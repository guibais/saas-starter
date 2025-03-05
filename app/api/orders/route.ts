import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { orders, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// Get all orders for the authenticated user
// Admin users can see all orders
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";
    const userId = session.user.id;

    // If admin and query param 'all' is true, return all orders
    const url = new URL(request.url);
    const showAll = url.searchParams.get("all") === "true";

    let ordersList;

    if (isAdmin && showAll) {
      // Admin viewing all orders
      const allOrders = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          status: orders.status,
          totalAmount: orders.totalAmount,
          paymentStatus: orders.paymentStatus,
          shippingAddress: orders.shippingAddress,
          deliveryInstructions: orders.deliveryInstructions,
          stripePaymentIntentId: orders.stripePaymentIntentId,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .orderBy(desc(orders.createdAt));

      ordersList = allOrders;
    } else {
      // Regular user or admin viewing their own orders
      const userOrders = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          status: orders.status,
          totalAmount: orders.totalAmount,
          paymentStatus: orders.paymentStatus,
          shippingAddress: orders.shippingAddress,
          deliveryInstructions: orders.deliveryInstructions,
          stripePaymentIntentId: orders.stripePaymentIntentId,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt));

      ordersList = userOrders;
    }

    return NextResponse.json(ordersList);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pedidos" },
      { status: 500 }
    );
  }
}
