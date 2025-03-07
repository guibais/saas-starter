import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  subscriptionPlans,
  planFixedItems,
  planCustomizableItems,
  products,
  userSubscriptions,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { desc, eq, like, or, and, sql, asc } from "drizzle-orm";
import { z } from "zod";
import { slugify } from "@/lib/utils";

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
    // Verificar autenticação para planos privados
    const session = await getSession();

    // Obter parâmetros de consulta para filtragem e paginação
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const filter = searchParams.get("filter"); // Novo parâmetro para filtrar por status
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 10;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;
    const sort = searchParams.get("sort") || "name";
    const order = searchParams.get("order") === "desc" ? desc : asc;

    // Construir a condição de busca
    let whereCondition;
    if (search) {
      whereCondition = or(
        like(subscriptionPlans.name, `%${search}%`),
        like(subscriptionPlans.description || "", `%${search}%`)
      );
    }

    // Buscar planos de assinatura
    const plans = await db.query.subscriptionPlans.findMany({
      limit,
      offset,
      orderBy:
        sort === "name"
          ? order(subscriptionPlans.name)
          : sort === "price"
          ? order(subscriptionPlans.price)
          : order(subscriptionPlans.createdAt),
      where: whereCondition,
    });

    // Se o usuário estiver autenticado, adicionar informações adicionais
    if (session) {
      // Contar total de planos para paginação
      const totalPlansCountResult = await db.execute(
        sql`SELECT COUNT(*) FROM subscription_plans`
      );
      const totalPlans = Number(totalPlansCountResult[0]?.count || 0);

      // Obter itens fixos e regras de personalização para cada plano
      const plansWithDetails = await Promise.all(
        plans.map(async (plan) => {
          // Obter itens fixos
          const fixedItems = await db
            .select({
              id: planFixedItems.id,
              planId: planFixedItems.planId,
              productId: planFixedItems.productId,
              quantity: planFixedItems.quantity,
              productName: products.name,
              productPrice: products.price,
              productType: products.productType,
            })
            .from(planFixedItems)
            .leftJoin(products, eq(planFixedItems.productId, products.id))
            .where(eq(planFixedItems.planId, plan.id));

          // Obter regras de personalização
          const customizableRules = await db
            .select()
            .from(planCustomizableItems)
            .where(eq(planCustomizableItems.planId, plan.id));

          // Contar assinantes
          const subscribersCount = await db
            .select({
              count: sql<number>`count(*)`,
            })
            .from(userSubscriptions)
            .where(
              and(
                eq(userSubscriptions.planId, plan.id),
                eq(userSubscriptions.status, "active")
              )
            );

          const subscribers = Number(subscribersCount[0]?.count || 0);

          return {
            ...plan,
            fixedItems,
            customizableRules,
            subscribers,
          };
        })
      );

      // Aplicar filtro adicional baseado no parâmetro 'filter'
      let filteredPlans = plansWithDetails;
      if (filter === "active") {
        filteredPlans = plansWithDetails.filter((plan) => plan.subscribers > 0);
      } else if (filter === "inactive") {
        filteredPlans = plansWithDetails.filter(
          (plan) => plan.subscribers === 0
        );
      }

      return NextResponse.json({
        plans: filteredPlans,
        total: totalPlans,
        limit,
        offset,
      });
    }

    // Para usuários não autenticados, retornar apenas os planos básicos
    return NextResponse.json({
      plans,
    });
  } catch (error) {
    console.error("Erro ao buscar planos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos " + error },
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

    // Obter dados do corpo da requisição
    const body = await request.json();

    // Validar dados
    const validationResult = planSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      price,
      imageUrl,
      fixedItems,
      customizableRules,
    } = validationResult.data;

    // Gerar slug a partir do nome
    const slug = slugify(name);

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

    // Criar o plano
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values({
        name,
        description,
        slug,
        price: price.toString(),
        imageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Adicionar itens fixos
    if (fixedItems.length > 0) {
      await db.insert(planFixedItems).values(
        fixedItems.map((item) => ({
          planId: newPlan.id,
          productId: item.productId,
          quantity: item.quantity,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }

    // Adicionar regras de personalização
    if (customizableRules.length > 0) {
      await db.insert(planCustomizableItems).values(
        customizableRules.map((rule) => ({
          planId: newPlan.id,
          productType: rule.productType,
          minQuantity: rule.minQuantity,
          maxQuantity: rule.maxQuantity,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }

    return NextResponse.json(newPlan);
  } catch (error) {
    console.error("Erro ao criar plano:", error);
    return NextResponse.json({ error: "Erro ao criar plano" }, { status: 500 });
  }
}
