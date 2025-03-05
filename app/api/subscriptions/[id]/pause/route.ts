import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { userSubscriptions } from "@/lib/db/schema";
import { getSession, getCustomerSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { pauseSubscription } from "@/lib/payments/stripe";

// GET /api/subscriptions/[id]/pause - Pausar uma assinatura
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obter ID da assinatura
    const subscriptionId = parseInt(params.id);
    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: "ID de assinatura inválido" },
        { status: 400 }
      );
    }

    // Verificar autenticação (admin ou cliente dono da assinatura)
    const adminSession = await getSession();
    const customerSession = await getCustomerSession();

    if (!adminSession && !customerSession) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar a assinatura
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.id, subscriptionId),
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    // Verificar permissões
    const isAdmin = adminSession && adminSession.user.role === "admin";
    const isOwner =
      customerSession && customerSession.user.id === subscription.customerId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Verificar se a assinatura já está pausada
    if (subscription.status === "paused") {
      return NextResponse.json(
        { error: "Assinatura já está pausada" },
        { status: 400 }
      );
    }

    // Pausar a assinatura no Stripe (se tiver ID do Stripe)
    if (subscription.stripeSubscriptionId) {
      try {
        await pauseSubscription(subscription.stripeSubscriptionId);
        console.log(`Assinatura ${subscription.id} pausada no Stripe`);
      } catch (stripeError) {
        console.error("Erro ao pausar assinatura no Stripe:", stripeError);
        return NextResponse.json(
          {
            error: "Erro ao pausar assinatura no Stripe",
            details:
              stripeError instanceof Error
                ? stripeError.message
                : "Erro desconhecido",
          },
          { status: 500 }
        );
      }
    } else {
      console.log(
        `Assinatura ${subscription.id} não tem ID do Stripe, atualizando apenas no banco de dados`
      );
    }

    // Atualizar status da assinatura no banco de dados
    const updated = await db
      .update(userSubscriptions)
      .set({
        status: "paused",
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, subscriptionId))
      .returning();

    // Redirecionar de volta para a página apropriada
    let redirectUrl;
    if (adminSession && adminSession.user.role === "admin") {
      redirectUrl = `/dashboard/admin/subscriptions/${subscriptionId}`;
    } else {
      redirectUrl = `/customer/dashboard/subscription`;
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error("Erro ao pausar assinatura:", error);
    return NextResponse.json(
      { error: "Erro ao pausar assinatura" },
      { status: 500 }
    );
  }
}
