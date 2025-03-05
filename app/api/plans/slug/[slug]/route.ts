import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  subscriptionPlans,
  planFixedItems,
  planCustomizableItems,
  products,
  PlanFixedItem,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Buscar o plano pelo slug
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.slug, params.slug),
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    // Buscar os itens fixos do plano
    const fixedItems = await db
      .select()
      .from(planFixedItems)
      .where(eq(planFixedItems.planId, plan.id));

    // Buscar os produtos dos itens fixos
    const fixedItemsWithProducts = await Promise.all(
      fixedItems.map(async (item: PlanFixedItem) => {
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
    return NextResponse.json({
      ...plan,
      fixedItems: fixedItemsWithProducts,
      customizableRules,
    });
  } catch (error) {
    console.error("Erro ao buscar plano:", error);
    return NextResponse.json(
      { error: "Erro ao buscar plano" },
      { status: 500 }
    );
  }
}
