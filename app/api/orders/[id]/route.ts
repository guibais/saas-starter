import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/drizzle";
import { orders, orderItems, customers, products } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/orders/[id] - Obter detalhes de um pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Buscando detalhes do pedido:", params.id);

    const session = await getSession();
    console.log(
      "Sessão:",
      session
        ? {
            userId: session.user.id,
            role: session.user.role,
          }
        : "Nenhuma sessão encontrada"
    );

    if (!session) {
      console.log("Erro: Usuário não autenticado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      console.log("Erro: ID do pedido inválido:", params.id);
      return NextResponse.json(
        { error: "ID do pedido inválido" },
        { status: 400 }
      );
    }

    console.log("Buscando pedido com ID:", orderId);

    // Fetch the order
    const [orderData] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderData) {
      console.log("Pedido não encontrado:", orderId);
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    console.log("Pedido encontrado:", {
      id: orderData.id,
      status: orderData.status,
      customerId: orderData.customerId,
    });

    // Check if user is authorized to view this order
    // Allow if user is admin or if the order belongs to the user
    if (
      session.user.role !== "admin" &&
      orderData.customerId !== session.user.id
    ) {
      console.log("Acesso negado: Usuário não autorizado a ver este pedido", {
        sessionUserId: session.user.id,
        orderUserId: orderData.customerId,
        userRole: session.user.role,
      });
      return NextResponse.json(
        { error: "Não autorizado a visualizar este pedido" },
        { status: 403 }
      );
    }

    // Fetch user data
    console.log("Buscando dados do cliente:", orderData.customerId);
    const [userData] = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        deliveryInstructions: customers.deliveryInstructions,
      })
      .from(customers)
      .where(eq(customers.id, orderData.customerId))
      .limit(1);

    // Fetch order items with product details
    console.log("Buscando itens do pedido:", orderId);
    const orderItemsData = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        productName: products.name,
        productType: products.productType,
        productImage: products.imageUrl,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    console.log(`Encontrados ${orderItemsData.length} itens para o pedido`);

    // Return the complete order details
    return NextResponse.json({
      order: orderData,
      user: userData,
      items: orderItemsData,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes do pedido:", error);
    if (error instanceof Error) {
      console.error("Detalhes do erro:", error.stack);
    }
    return NextResponse.json(
      { error: "Erro ao buscar detalhes do pedido" },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Atualizar um pedido específico
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Atualizando pedido:", params.id);

    const session = await getSession();
    if (!session) {
      console.log("Erro: Usuário não autenticado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Only admins can update orders
    if (session.user.role !== "admin") {
      console.log("Acesso negado: Usuário não é admin", {
        userId: session.user.id,
        role: session.user.role,
      });
      return NextResponse.json(
        { error: "Apenas administradores podem atualizar pedidos" },
        { status: 403 }
      );
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      console.log("Erro: ID do pedido inválido:", params.id);
      return NextResponse.json(
        { error: "ID do pedido inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Dados para atualização:", body);

    // Check if order exists
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existingOrder) {
      console.log("Pedido não encontrado:", orderId);
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Update order with provided fields
    const updateData: Partial<typeof orders.$inferInsert> = {};

    if (body.status) {
      updateData.status = body.status;
    }

    if (body.paymentStatus) {
      updateData.paymentStatus = body.paymentStatus;
    }

    if (Object.keys(updateData).length === 0) {
      console.log("Nenhum dado fornecido para atualização");
      return NextResponse.json(
        { error: "Nenhum dado fornecido para atualização" },
        { status: 400 }
      );
    }

    updateData.updatedAt = new Date();
    console.log("Atualizando pedido com dados:", updateData);

    // Update the order
    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    console.log("Pedido atualizado com sucesso:", {
      id: updatedOrder.id,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    if (error instanceof Error) {
      console.error("Detalhes do erro:", error.stack);
    }
    return NextResponse.json(
      { error: "Erro ao atualizar pedido" },
      { status: 500 }
    );
  }
}
