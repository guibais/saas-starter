import { NextRequest, NextResponse } from "next/server";
import { createSubscriptionCheckoutSession } from "@/lib/payments/stripe";
import { getUser } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { products, subscriptionPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, customItems, paymentMethod } = body;

    if (!planId) {
      return NextResponse.json(
        { message: "ID do plano não fornecido" },
        { status: 400 }
      );
    }

    // Buscar o plano no banco de dados
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, parseInt(planId)),
    });

    if (!plan) {
      return NextResponse.json(
        { message: "Plano não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o plano tem um ID do Stripe
    if (!plan.stripePriceId) {
      return NextResponse.json(
        { message: "Plano sem ID do Stripe" },
        { status: 400 }
      );
    }

    // Verificar os itens customizáveis
    let validatedCustomItems = [];
    if (customItems && customItems.length > 0) {
      for (const item of customItems) {
        const productId = parseInt(item.productId);
        if (isNaN(productId)) {
          return NextResponse.json(
            { message: "ID de produto inválido" },
            { status: 400 }
          );
        }

        const dbProduct = await db.query.products.findFirst({
          where: eq(products.id, productId),
        });

        if (!dbProduct) {
          return NextResponse.json(
            { message: `Produto não encontrado: ${productId}` },
            { status: 404 }
          );
        }

        validatedCustomItems.push({
          productId,
          quantity: item.quantity,
        });
      }
    }

    // Criar sessão de checkout
    const session = await createSubscriptionCheckoutSession({
      team: null, // Não estamos usando times neste projeto
      priceId: plan.stripePriceId,
      planId: plan.id,
      customItems: validatedCustomItems,
    });

    if (!session || !session.url) {
      throw new Error("Falha ao criar sessão de checkout");
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    return NextResponse.json(
      { message: "Erro ao criar sessão de checkout" },
      { status: 500 }
    );
  }
}
