import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  userSubscriptions,
  users,
  subscriptionPlans,
  subscriptionItems,
  products,
  customers,
} from "@/lib/db/schema";
import { getSession, getCustomerSession } from "@/lib/auth/session";
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
        customerId: userSubscriptions.customerId,
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

    // Buscar informações do cliente
    const customer = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
      })
      .from(customers)
      .where(eq(customers.id, subscription[0].customerId))
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
      customer: customer[0] || null,
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

// PATCH /api/subscriptions/[id] - Atualizar uma assinatura específica
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação (admin ou cliente dono da assinatura)
    const adminSession = await getSession();
    const customerSession = await getCustomerSession();

    if (!adminSession && !customerSession) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const subscriptionId = parseInt(params.id);
    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: "ID de assinatura inválido" },
        { status: 400 }
      );
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

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { status, statusReason, nextDeliveryDate } = body;

    // Validar os dados
    if (!status) {
      return NextResponse.json(
        { error: "Status é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o status é válido
    const validStatuses = ["active", "paused", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    // Preparar dados para atualização
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Se fornecido, atualizar a razão do status
    if (statusReason !== undefined) {
      updateData.statusReason = statusReason;
    }

    // Se fornecido, atualizar a próxima data de entrega
    if (nextDeliveryDate) {
      updateData.nextDeliveryDate = new Date(nextDeliveryDate);
    }

    // Atualizar a assinatura
    const updated = await db
      .update(userSubscriptions)
      .set(updateData)
      .where(eq(userSubscriptions.id, subscriptionId))
      .returning();

    return NextResponse.json({
      message: "Assinatura atualizada com sucesso",
      subscription: updated[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar assinatura" },
      { status: 500 }
    );
  }
}
