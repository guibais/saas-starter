import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  subscriptionPlans,
  planFixedItems,
  planCustomizableItems,
  userSubscriptions,
  products,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// Schema de validação para atualização de plano
const planUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  description: z.string().optional(),
  price: z.number().positive("Preço deve ser positivo").optional(),
  imageUrl: z.string().optional(),
  fixedItems: z
    .array(
      z.object({
        id: z.number().optional(),
        productId: z.number(),
        quantity: z.number().positive(),
      })
    )
    .optional(),
  customizableRules: z
    .object({
      normal: z.object({
        min: z.number().min(0),
        max: z.number().min(0),
      }),
      exotic: z.object({
        min: z.number().min(0),
        max: z.number().min(0),
      }),
    })
    .optional(),
});

// Processar URLs especiais do R2
function processR2Url(url: string): string {
  // Se não houver URL, retorna null
  if (!url) return url;

  // Se a URL já for uma URL completa e não for uma URL especial de armazenamento, retorná-la como está
  if (
    !url.startsWith("__r2_storage__:") &&
    (url.startsWith("http") || url.startsWith("https"))
  ) {
    return url;
  }

  if (url.startsWith("__r2_storage__:")) {
    console.log("URL do R2 recebida:", url);
    try {
      // Verificar se é um caso especial onde a URL completa foi prefixada
      if (url.includes("https://") || url.includes("http://")) {
        // Extrair apenas a parte após "__r2_storage__:"
        const actualUrl = url.replace("__r2_storage__:", "");

        // Para URLs no formato __r2_storage__:https::dominio/caminho
        // Corrigir o formato dos dois pontos extras após https:
        return actualUrl
          .replace(/^https::(.*)/i, "https://$1")
          .replace(/^http::(.*)/i, "http://$1");
      }

      // Caso tradicional do formato __r2_storage__:bucket:path
      const parts = url.split(":");
      if (parts.length >= 3) {
        const bucket = parts.find((part) =>
          part.includes(
            process.env.R2_PUBLIC_URL?.replace("https://", "") ?? ""
          )
        );
        console.log({ bucket, env: process.env.R2_PUBLIC_URL });
        const processedUrl = `https://${bucket}`;
        return processedUrl;
      }
    } catch (error) {
      console.error("Erro ao processar URL do R2:", error);
    }
  }

  // Em caso de erro ou formato não reconhecido, retorna a URL original
  return url;
}

// GET /api/plans/[id] - Obter detalhes de um plano específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const planId = parseInt(id);

    if (isNaN(planId)) {
      return NextResponse.json(
        { error: "ID de plano inválido" },
        { status: 400 }
      );
    }

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

    const { id } = await params;
    const planId = parseInt(id);

    if (isNaN(planId)) {
      return NextResponse.json(
        { error: "ID de plano inválido" },
        { status: 400 }
      );
    }

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

    // Obter e validar os dados do body
    const body = await request.json();
    console.log("Corpo da requisição recebido:", body);

    // Validar com o schema
    const validationResult = planUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("Erro de validação:", validationResult.error.format());
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Extrair valores validados
    const {
      name,
      description,
      price,
      imageUrl,
      fixedItems,
      customizableRules,
    } = validationResult.data;

    console.log("URL da imagem recebida:", imageUrl);

    // Iniciar transação para garantir consistência dos dados
    return await db.transaction(async (tx) => {
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
        console.log("Atualizando imageUrl para:", imageUrl);
        updateData.imageUrl = processR2Url(imageUrl);
      }

      // Atualizar o plano
      const [updatedPlan] = await tx
        .update(subscriptionPlans)
        .set(updateData)
        .where(eq(subscriptionPlans.id, planId))
        .returning();

      console.log("Plano atualizado:", updatedPlan);

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
        // Certificar que as regras existem
        const existingRules = await tx
          .select()
          .from(planCustomizableItems)
          .where(eq(planCustomizableItems.planId, planId));

        // Se não houver regras, criar
        if (existingRules.length === 0) {
          // Inserir regra para normal
          await tx.insert(planCustomizableItems).values({
            planId,
            productType: "normal",
            minQuantity: customizableRules.normal.min,
            maxQuantity: customizableRules.normal.max,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Inserir regra para exotic
          await tx.insert(planCustomizableItems).values({
            planId,
            productType: "exotic",
            minQuantity: customizableRules.exotic.min,
            maxQuantity: customizableRules.exotic.max,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
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
      }

      return NextResponse.json(updatedPlan);
    });
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

    const { id } = await params;
    const planId = parseInt(id);

    if (isNaN(planId)) {
      return NextResponse.json(
        { error: "ID de plano inválido" },
        { status: 400 }
      );
    }

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
