import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/payments/stripe";
import { db } from "@/lib/db";
import { subscriptionPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação usando o cookie de sessão
    const cookieStore = await cookies();
    const customerSession = cookieStore.get("customer_session");
    let session = null;

    if (customerSession?.value) {
      try {
        session = await verifyToken(customerSession.value);
      } catch (error) {
        console.error("Erro ao verificar token:", error);
      }
    }

    // Obter os dados do corpo da requisição
    const data = await req.json();
    const { planId, customizableItems } = data;

    if (!planId) {
      return NextResponse.json(
        { error: "ID do plano não fornecido" },
        { status: 400 }
      );
    }

    // Buscar detalhes do plano
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      );
    }

    // Calcular o preço total (plano + itens personalizados)
    let totalAmount = parseFloat(plan.price);

    // Adicionar o preço dos itens personalizados, se houver
    if (customizableItems && customizableItems.length > 0) {
      for (const item of customizableItems) {
        if (item.product && item.product.price && item.quantity) {
          const itemPrice = parseFloat(item.product.price) * item.quantity;
          totalAmount += itemPrice;
        }
      }
    }

    // Converter para centavos para o Stripe
    const amountInCents = Math.round(totalAmount * 100);

    console.log("Criando PaymentIntent:", {
      amount: amountInCents,
      currency: "brl",
      planId,
    });

    // Criar o Payment Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "brl",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        planId: planId.toString(),
        userId: session?.user?.id?.toString() || "",
        isSubscription: "true",
      },
    });

    // Retornar o client_secret para o frontend
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Erro ao criar payment intent:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
