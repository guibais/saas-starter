import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { orders, customers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// Get all orders for the authenticated user
// Admin users can see all orders
export async function GET(request: NextRequest) {
  try {
    console.log("Iniciando busca de pedidos");

    const session = await getSession();
    console.log(
      "Sessão:",
      session
        ? {
            userId: session.user.id,
            role: session.user.role,
            expires: session.expires,
          }
        : "Nenhuma sessão encontrada"
    );

    if (!session) {
      console.log("Erro: Usuário não autenticado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";
    const userId = session.user.id;
    console.log("Detalhes do usuário:", { userId, isAdmin });

    // If admin and query param 'all' is true, return all orders
    const url = new URL(request.url);
    const showAll = url.searchParams.get("all") === "true";
    console.log("Parâmetro showAll:", showAll);

    let ordersList;

    if (isAdmin && showAll) {
      console.log("Buscando todos os pedidos (admin)");
      try {
        // Admin viewing all orders
        const allOrders = await db
          .select({
            id: orders.id,
            userId: orders.customerId,
            status: orders.status,
            totalAmount: orders.totalAmount,
            paymentStatus: orders.paymentStatus,
            shippingAddress: orders.shippingAddress,
            deliveryInstructions: orders.deliveryInstructions,
            stripePaymentIntentId: orders.stripePaymentIntentId,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
            userName: customers.name,
            userEmail: customers.email,
          })
          .from(orders)
          .leftJoin(customers, eq(orders.customerId, customers.id))
          .orderBy(desc(orders.createdAt));

        console.log(`Encontrados ${allOrders.length} pedidos`);
        ordersList = allOrders;
      } catch (dbError) {
        console.error("Erro ao consultar banco de dados (admin):", dbError);
        throw new Error(
          `Erro ao consultar banco de dados: ${
            dbError instanceof Error ? dbError.message : String(dbError)
          }`
        );
      }
    } else {
      console.log("Buscando pedidos do usuário:", userId);
      try {
        // Regular user or admin viewing their own orders
        const userOrders = await db
          .select({
            id: orders.id,
            userId: orders.customerId,
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
          .where(eq(orders.customerId, userId))
          .orderBy(desc(orders.createdAt));

        console.log(`Encontrados ${userOrders.length} pedidos para o usuário`);
        ordersList = userOrders;
      } catch (dbError) {
        console.error("Erro ao consultar banco de dados (usuário):", dbError);
        throw new Error(
          `Erro ao consultar banco de dados: ${
            dbError instanceof Error ? dbError.message : String(dbError)
          }`
        );
      }
    }

    console.log("Retornando lista de pedidos com sucesso");
    return NextResponse.json(ordersList);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    if (error instanceof Error) {
      console.error("Detalhes do erro:", error.stack);
    }
    return NextResponse.json(
      { error: "Erro ao buscar pedidos" },
      { status: 500 }
    );
  }
}
