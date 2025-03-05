import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  subscriptionPlans,
  planFixedItems,
  planCustomizableItems,
  products,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { desc, eq, like, or, and, SQL, asc } from "drizzle-orm";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { auth } from "@/auth";

// Schema de validação para criação/atualização de planos
const planSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  price: z.string().or(z.number()),
  imageUrl: z.string().optional().nullable(),
  fixedItems: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().min(1),
    })
  ),
  customizableRules: z.array(
    z.object({
      productType: z.string(),
      minQuantity: z.number().min(0),
      maxQuantity: z.number().min(1),
    })
  ),
});

// GET /api/plans - Listar todos os planos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 10;
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page")!)
      : 1;
    const offset = (page - 1) * limit;

    // Verificar se é uma solicitação para detalhes completos
    const fullDetails = searchParams.get("fullDetails") === "true";

    if (fullDetails) {
      // Buscar todos os planos com detalhes completos
      const plans = await db.query.subscriptionPlans.findMany({
        orderBy: (plans, { asc }) => [asc(plans.price)],
      });

      // Para cada plano, buscar os itens fixos e regras de customização
      const plansWithDetails = await Promise.all(
        plans.map(async (plan) => {
          // Buscar os itens fixos do plano
          const fixedItems = await db
            .select()
            .from(planFixedItems)
            .where(eq(planFixedItems.planId, plan.id));

          // Buscar os produtos dos itens fixos
          const fixedItemsWithProducts = await Promise.all(
            fixedItems.map(async (item) => {
              const product = await db.query.products.findFirst({
                where: eq(products.id, item.productId),
              });
              return {
                ...item,
                product,
              };
            })
          );

          // Buscar as regras de customização do plano
          const customizableRules = await db
            .select()
            .from(planCustomizableItems)
            .where(eq(planCustomizableItems.planId, plan.id));

          // Retornar o plano com os itens fixos e regras de customização
          return {
            ...plan,
            fixedItems: fixedItemsWithProducts,
            customizableRules,
          };
        })
      );

      return NextResponse.json(plansWithDetails);
    } else {
      // Buscar planos de assinatura simplificados
      const plans = await db
        .select({
          id: subscriptionPlans.id,
          name: subscriptionPlans.name,
          description: subscriptionPlans.description,
          slug: subscriptionPlans.slug,
          price: subscriptionPlans.price,
          imageUrl: subscriptionPlans.imageUrl,
          createdAt: subscriptionPlans.createdAt,
        })
        .from(subscriptionPlans)
        .orderBy(desc(subscriptionPlans.createdAt))
        .limit(limit)
        .offset(offset);

      // Contar total de planos para paginação
      const totalPlansCount = await db
        .select({ count: SQL`count(*)` })
        .from(subscriptionPlans);

      const totalPlans = Number(totalPlansCount[0]?.count || 0);
      const totalPages = Math.ceil(totalPlans / limit);

      return NextResponse.json({
        plans,
        pagination: {
          total: totalPlans,
          totalPages,
          currentPage: page,
          limit,
        },
      });
    }
  } catch (error) {
    console.error("Erro ao buscar planos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos de assinatura" },
      { status: 500 }
    );
  }
}

// POST /api/plans - Criar um novo plano
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validar os dados recebidos
    const validatedData = planSchema.parse(body);

    // Criar o slug a partir do nome
    const slug = slugify(validatedData.name);

    // Verificar se já existe um plano com o mesmo slug
    const existingPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.slug, slug),
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: "Já existe um plano com este nome" },
        { status: 400 }
      );
    }

    // Inserir o plano no banco de dados
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values({
        name: validatedData.name,
        description: validatedData.description || null,
        slug,
        price: validatedData.price.toString(),
        imageUrl: validatedData.imageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!newPlan) {
      throw new Error("Falha ao criar o plano");
    }

    // Inserir os itens fixos do plano
    if (validatedData.fixedItems.length > 0) {
      await db.insert(planFixedItems).values(
        validatedData.fixedItems.map((item) => ({
          planId: newPlan.id,
          productId: item.productId,
          quantity: item.quantity,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }

    // Inserir as regras de customização do plano
    if (validatedData.customizableRules.length > 0) {
      await db.insert(planCustomizableItems).values(
        validatedData.customizableRules.map((rule) => ({
          planId: newPlan.id,
          productType: rule.productType,
          minQuantity: rule.minQuantity,
          maxQuantity: rule.maxQuantity,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar plano:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erro ao criar plano" }, { status: 500 });
  }
}
