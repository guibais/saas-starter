import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { stripe } from "@/lib/payments/stripe";
import { db } from "@/lib/db";
import { plans, userSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { planId, customizableItems } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: "ID do plano é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar plano no banco de dados
    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, planId),
      with: {
        fixedItems: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    // Calcular valor total (plano + itens personalizados)
    let totalAmount = parseFloat(plan.price);

    // Adicionar valor dos itens personalizados
    if (customizableItems && customizableItems.length > 0) {
      for (const item of customizableItems) {
        const itemPrice = parseFloat(item.product.price);
        totalAmount += itemPrice * item.quantity;
      }
    }

    // Converter para centavos para o Stripe
    const amountInCents = Math.round(totalAmount * 100);

    // Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "brl",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        planId: planId.toString(),
        userId: session?.user?.id || "guest",
        isSubscription: "true",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Erro ao criar payment intent:", error);
    return NextResponse.json(
      { error: "Erro ao processar a requisição" },
      { status: 500 }
    );
  }
}
