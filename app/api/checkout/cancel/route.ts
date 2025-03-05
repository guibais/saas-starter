import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { userSubscriptions, subscriptionItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "ID da assinatura é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a assinatura existe
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.id, parseInt(subscriptionId)),
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    // Atualizar o status da assinatura para cancelado
    await db
      .update(userSubscriptions)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, parseInt(subscriptionId)));

    // Excluir os itens da assinatura
    await db
      .delete(subscriptionItems)
      .where(eq(subscriptionItems.subscriptionId, parseInt(subscriptionId)));

    return NextResponse.json({
      success: true,
      message: "Assinatura cancelada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao cancelar assinatura";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
