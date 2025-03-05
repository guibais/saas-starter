import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  subscriptionPlans,
  userSubscriptions,
  subscriptionItems,
  products,
} from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/payments/stripe";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("session_id");
  const planId = searchParams.get("plan_id");

  if (!sessionId || !planId) {
    return NextResponse.redirect(new URL("/plans", request.url));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    if (!session.subscription || typeof session.subscription === "string") {
      throw new Error("Dados de assinatura inválidos do Stripe.");
    }

    const subscriptionId = session.subscription.id;
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    if (!customerId) {
      throw new Error("ID do cliente não encontrado na sessão.");
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price.product"],
    });

    // Verificar se a assinatura já foi processada pelo webhook
    const existingSubscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.stripeSubscriptionId, subscriptionId),
    });

    if (existingSubscription) {
      // Assinatura já processada, redirecionar para a página de sucesso
      return NextResponse.json({
        success: true,
        subscriptionId: existingSubscription.id,
        planName: existingSubscription.planName || "Assinatura",
      });
    }

    // Se o webhook ainda não processou, criar a assinatura manualmente
    const userId = parseInt(session.client_reference_id || "0");

    if (!userId) {
      throw new Error("ID do usuário não encontrado na sessão.");
    }

    // Obter o plano
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, parseInt(planId)),
    });

    if (!plan) {
      throw new Error("Plano não encontrado.");
    }

    // Criar a assinatura
    const startDate = new Date();
    const nextDeliveryDate = new Date();
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7); // Próxima entrega em 7 dias

    const [subscriptionResult] = await db
      .insert(userSubscriptions)
      .values({
        userId,
        planId: plan.id,
        status: subscription.status,
        startDate,
        nextDeliveryDate,
        stripeSubscriptionId: subscriptionId,
        planName: plan.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: userSubscriptions.id });

    if (!subscriptionResult) {
      throw new Error("Falha ao criar a assinatura no banco de dados.");
    }

    const userSubscriptionId = subscriptionResult.id;

    // Obter os itens personalizados da assinatura a partir dos metadados
    const customItemsJson = subscription.metadata.customItems;

    if (customItemsJson) {
      try {
        const customItems = JSON.parse(customItemsJson) as Array<{
          productId: number;
          quantity: number;
        }>;

        // Adicionar cada item personalizado à assinatura
        for (const item of customItems) {
          const product = await db.query.products.findFirst({
            where: eq(products.id, item.productId),
          });

          if (product) {
            await db.insert(subscriptionItems).values({
              subscriptionId: userSubscriptionId,
              productId: product.id,
              quantity: item.quantity,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            // Atualizar o estoque do produto
            await db
              .update(products)
              .set({
                stockQuantity: Math.max(
                  0,
                  product.stockQuantity - item.quantity
                ),
                updatedAt: new Date(),
              })
              .where(eq(products.id, product.id));
          }
        }
      } catch (error) {
        console.error("Erro ao processar itens personalizados:", error);
      }
    }

    // Atualizar informações do usuário se necessário
    if (session.customer_details) {
      const userUpdates: Record<string, any> = {};

      if (session.customer_details.name) {
        userUpdates.name = session.customer_details.name;
      }

      if (session.customer_details.phone) {
        userUpdates.phone = session.customer_details.phone;
      }

      if (Object.keys(userUpdates).length > 0) {
        userUpdates.updatedAt = new Date();

        await db.update(users).set(userUpdates).where(eq(users.id, userId));
      }
    }

    // Retornar os dados da assinatura
    return NextResponse.json({
      success: true,
      subscriptionId: userSubscriptionId,
      planName: plan.name,
    });
  } catch (error) {
    console.error("Erro ao processar checkout de assinatura:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao processar a assinatura" },
      { status: 500 }
    );
  }
}
