import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/drizzle";
import { orders, orderItems, users, products } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/orders/[id] - Obter detalhes de um pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "ID do pedido inválido" },
        { status: 400 }
      );
    }

    // Fetch the order
    const [orderData] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderData) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this order
    // Allow if user is admin or if the order belongs to the user
    if (session.user.role !== "admin" && orderData.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Não autorizado a visualizar este pedido" },
        { status: 403 }
      );
    }

    // Fetch user data
    const [userData] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        address: users.address,
        deliveryInstructions: users.deliveryInstructions,
      })
      .from(users)
      .where(eq(users.id, orderData.userId))
      .limit(1);

    // Fetch order items with product details
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

    // Return the complete order details
    return NextResponse.json({
      order: orderData,
      user: userData,
      items: orderItemsData,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes do pedido:", error);
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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Only admins can update orders
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem atualizar pedidos" },
        { status: 403 }
      );
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "ID do pedido inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if order exists
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existingOrder) {
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
      return NextResponse.json(
        { error: "Nenhum dado fornecido para atualização" },
        { status: 400 }
      );
    }

    updateData.updatedAt = new Date();

    // Update the order
    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar pedido" },
      { status: 500 }
    );
  }
}
