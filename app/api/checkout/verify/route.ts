import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { userSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

// Inicializar o cliente Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, subscriptionId, type } = body;

    if (!sessionId && !subscriptionId) {
      return NextResponse.json(
        { error: "Informações de pagamento não encontradas" },
        { status: 400 }
      );
    }

    // Verificar o status da sessão no Stripe
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== "paid") {
        return NextResponse.json(
          { error: "Pagamento não confirmado" },
          { status: 400 }
        );
      }

      // Se o pagamento foi confirmado, atualizar o status da assinatura
      if (subscriptionId && type === "subscription") {
        await db
          .update(userSubscriptions)
          .set({
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.id, parseInt(subscriptionId)));
      }

      return NextResponse.json({
        success: true,
        message: "Pagamento verificado com sucesso",
      });
    }

    // Se não tiver sessionId, verificar diretamente no banco de dados
    if (subscriptionId && type === "subscription") {
      const subscription = await db.query.userSubscriptions.findFirst({
        where: eq(userSubscriptions.id, parseInt(subscriptionId)),
      });

      if (!subscription) {
        return NextResponse.json(
          { error: "Assinatura não encontrada" },
          { status: 404 }
        );
      }

      if (subscription.status !== "active") {
        return NextResponse.json(
          { error: "Pagamento não confirmado" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Pagamento verificado com sucesso",
      });
    }

    return NextResponse.json(
      { error: "Tipo de verificação não suportado" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao verificar pagamento:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao verificar pagamento";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
