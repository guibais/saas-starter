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
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { slugify } from "@/lib/utils";

// Schema de validação para atualização de planos
const planUpdateSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").optional(),
  description: z.string().optional(),
  price: z.number().positive("Preço deve ser positivo").optional(),
  imageUrl: z.string().optional(),
  fixedItems: z
    .array(
      z.object({
        id: z.number().optional(),
        productId: z.number().positive(),
        quantity: z.number().positive(),
      })
    )
    .optional(),
  customizableRules: z
    .object({
      normal: z.object({
        min: z.number().min(0),
        max: z.number().positive(),
      }),
      exotic: z.object({
        min: z.number().min(0),
        max: z.number().positive(),
      }),
    })
    .optional(),
});

// GET /api/plans/[id] - Obter detalhes de um plano específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const planId = parseInt(params.id);

    // Buscar plano
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!plan || plan.length === 0) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    // Buscar itens fixos
    const fixedItems = await db
      .select({
        id: planFixedItems.id,
        productId: planFixedItems.productId,
        quantity: planFixedItems.quantity,
        productName: products.name,
        productPrice: products.price,
        productType: products.productType,
      })
      .from(planFixedItems)
      .leftJoin(products, eq(planFixedItems.productId, products.id))
      .where(eq(planFixedItems.planId, planId));

    // Buscar regras de customização
    const customizableRules = await db
      .select()
      .from(planCustomizableItems)
      .where(eq(planCustomizableItems.planId, planId));

    // Contar assinantes
    const subscribersCount = await db
      .select({ count: userSubscriptions.id })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.planId, planId))
      .then((result) => result.length);

    // Formatar regras de customização para o formato esperado pelo frontend
    const formattedRules = {
      normal: {
        min: 0,
        max: 0,
      },
      exotic: {
        min: 0,
        max: 0,
      },
    };

    customizableRules.forEach((rule) => {
      if (rule.productType === "normal") {
        formattedRules.normal.min = rule.minQuantity;
        formattedRules.normal.max = rule.maxQuantity;
      } else if (rule.productType === "exotic") {
        formattedRules.exotic.min = rule.minQuantity;
        formattedRules.exotic.max = rule.maxQuantity;
      }
    });

    return NextResponse.json({
      ...plan[0],
      fixedItems,
      customizableRules: formattedRules,
      subscribers: subscribersCount,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes do plano:", error);
    return NextResponse.json(
      { error: "Erro ao buscar detalhes do plano" },
      { status: 500 }
    );
  }
}

// PATCH /api/plans/[id] - Atualizar um plano existente
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const planId = parseInt(params.id);

    // Verificar se o plano existe
    const existingPlan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!existingPlan || existingPlan.length === 0) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    // Obter e validar dados do corpo da requisição
    const body = await request.json();
    const validationResult = planUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.format() },
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

    // Iniciar transação para garantir consistência dos dados
    const result = await db.transaction(async (tx) => {
      // Atualizar o plano
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (name !== undefined) {
        updateData.name = name;
        updateData.slug = slugify(name);
      }

      if (description !== undefined) {
        updateData.description = description;
      }

      if (price !== undefined) {
        updateData.price = price.toString();
      }

      if (imageUrl !== undefined) {
        updateData.imageUrl = imageUrl;
      }

      // Atualizar o plano
      const [updatedPlan] = await tx
        .update(subscriptionPlans)
        .set(updateData)
        .where(eq(subscriptionPlans.id, planId))
        .returning();

      // Atualizar itens fixos se fornecidos
      if (fixedItems) {
        // Remover itens fixos existentes
        await tx
          .delete(planFixedItems)
          .where(eq(planFixedItems.planId, planId));

        // Inserir novos itens fixos
        if (fixedItems.length > 0) {
          await tx.insert(planFixedItems).values(
            fixedItems.map((item) => ({
              planId,
              productId: item.productId,
              quantity: item.quantity,
              createdAt: new Date(),
              updatedAt: new Date(),
            }))
          );
        }
      }

      // Atualizar regras de customização se fornecidas
      if (customizableRules) {
        // Atualizar regra para produtos normais
        await tx
          .update(planCustomizableItems)
          .set({
            minQuantity: customizableRules.normal.min,
            maxQuantity: customizableRules.normal.max,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(planCustomizableItems.planId, planId),
              eq(planCustomizableItems.productType, "normal")
            )
          );

        // Atualizar regra para produtos exóticos
        await tx
          .update(planCustomizableItems)
          .set({
            minQuantity: customizableRules.exotic.min,
            maxQuantity: customizableRules.exotic.max,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(planCustomizableItems.planId, planId),
              eq(planCustomizableItems.productType, "exotic")
            )
          );
      }

      return updatedPlan;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao atualizar plano:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar plano" },
      { status: 500 }
    );
  }
}

// DELETE /api/plans/[id] - Excluir um plano
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const planId = parseInt(params.id);

    // Verificar se o plano existe
    const existingPlan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!existingPlan || existingPlan.length === 0) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se existem assinaturas ativas usando este plano
    const activeSubscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.planId, planId),
          eq(userSubscriptions.status, "active")
        )
      )
      .limit(1);

    if (activeSubscriptions.length > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir um plano com assinaturas ativas. Desative as assinaturas primeiro.",
        },
        { status: 400 }
      );
    }

    // Iniciar transação para garantir consistência dos dados
    await db.transaction(async (tx) => {
      // Remover itens fixos
      await tx.delete(planFixedItems).where(eq(planFixedItems.planId, planId));

      // Remover regras de customização
      await tx
        .delete(planCustomizableItems)
        .where(eq(planCustomizableItems.planId, planId));

      // Remover o plano
      await tx
        .delete(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId));
    });

    return NextResponse.json(
      { message: "Plano excluído com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao excluir plano:", error);
    return NextResponse.json(
      { error: "Erro ao excluir plano" },
      { status: 500 }
    );
  }
}
