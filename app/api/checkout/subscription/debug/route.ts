import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptionPlans, planFixedItems, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const planId = data.planId;

    // Tentar buscar o plano usando query normal
    const planBasic = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    // Tentar buscar os itens fixos separadamente
    const fixedItems = await db
      .select()
      .from(planFixedItems)
      .where(eq(planFixedItems.planId, planId));

    // Buscar produtos relacionados para cada item fixo
    const fixedItemsWithProducts = [];
    for (const item of fixedItems) {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (product && product.length > 0) {
        fixedItemsWithProducts.push({
          ...item,
          product: product[0],
        });
      }
    }

    // Tentar usar o query builder
    try {
      const planWithQueryBuilder = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, planId),
      });

      return NextResponse.json({
        success: true,
        basicPlan: planBasic && planBasic.length > 0 ? planBasic[0] : null,
        fixedItems: fixedItemsWithProducts,
        planWithQueryBuilder,
        message: "Consulta completada com sucesso",
      });
    } catch (queryBuilderError) {
      return NextResponse.json({
        success: false,
        basicPlan: planBasic && planBasic.length > 0 ? planBasic[0] : null,
        fixedItems: fixedItemsWithProducts,
        queryBuilderError: {
          message: queryBuilderError.message,
          stack: queryBuilderError.stack,
        },
        message:
          "Erro ao usar query builder, mas consultas básicas foram realizadas",
      });
    }
  } catch (error) {
    console.error("Erro na depuração:", error);
    return NextResponse.json(
      {
        error: "Erro ao executar depuração",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
