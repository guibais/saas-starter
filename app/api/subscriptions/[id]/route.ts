import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  userSubscriptions,
  users,
  subscriptionPlans,
  subscriptionItems,
  products,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

// GET /api/subscriptions/[id] - Obter detalhes de uma assinatura específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const subscriptionId = parseInt(params.id);

    // Buscar assinatura
    const subscription = await db
      .select({
        id: userSubscriptions.id,
        userId: userSubscriptions.userId,
        planId: userSubscriptions.planId,
        status: userSubscriptions.status,
        startDate: userSubscriptions.startDate,
        nextDeliveryDate: userSubscriptions.nextDeliveryDate,
        createdAt: userSubscriptions.createdAt,
      })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription || subscription.length === 0) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    // Buscar informações do usuário
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        address: users.address,
        deliveryInstructions: users.deliveryInstructions,
      })
      .from(users)
      .where(eq(users.id, subscription[0].userId))
      .limit(1);

    // Buscar informações do plano
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscription[0].planId))
      .limit(1);

    // Buscar itens da assinatura
    const subscriptionItemsWithProducts = await db
      .select({
        id: subscriptionItems.id,
        subscriptionId: subscriptionItems.subscriptionId,
        productId: subscriptionItems.productId,
        quantity: subscriptionItems.quantity,
        productName: products.name,
        productType: products.productType,
        productPrice: products.price,
      })
      .from(subscriptionItems)
      .leftJoin(products, eq(subscriptionItems.productId, products.id))
      .where(eq(subscriptionItems.subscriptionId, subscriptionId));

    return NextResponse.json({
      subscription: subscription[0],
      user: user[0] || null,
      plan: plan[0] || null,
      items: subscriptionItemsWithProducts,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes da assinatura:", error);
    return NextResponse.json(
      { error: "Erro ao buscar detalhes da assinatura" },
      { status: 500 }
    );
  }
}
