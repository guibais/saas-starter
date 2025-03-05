import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  users,
  userSubscriptions,
  orders,
  customers,
  subscriptionPlans,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";

// GET /api/users/[id] - Obter detalhes de um usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Iniciando busca para usuário ID: ${params.id}`);

    // Verificar autenticação
    const session = await getSession();
    console.log(
      "Estado da sessão:",
      session ? "Sessão encontrada" : "Sessão não encontrada"
    );

    if (!session) {
      console.log("Erro: Sessão não encontrada");
      return NextResponse.json(
        { error: "Não autorizado - Sessão não encontrada" },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      console.log(
        `Erro: Usuário não é admin. Role atual: ${session.user.role}`
      );
      return NextResponse.json(
        { error: "Não autorizado - Acesso apenas para administradores" },
        { status: 401 }
      );
    }

    const userId = parseInt(params.id);
    console.log(`Buscando informações para usuário ID: ${userId}`);

    // Verificar se o ID refere-se a um usuário administrativo ou um cliente
    let userData;
    let isCustomer = false;

    // Primeiro, tentar buscar um usuário administrativo
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user && user.length > 0) {
      console.log("Usuário administrativo encontrado");
      userData = { ...user[0], passwordHash: undefined };
    } else {
      // Se não encontrar, tentar buscar um cliente
      console.log("Usuário administrativo não encontrado, verificando cliente");
      const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, userId))
        .limit(1);

      if (customer && customer.length > 0) {
        console.log("Cliente encontrado");
        userData = { ...customer[0], passwordHash: undefined };
        isCustomer = true;
      }
    }

    if (!userData) {
      console.log("Erro: Nenhum usuário ou cliente encontrado com este ID");
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar assinaturas do usuário/cliente
    const subscriptions = isCustomer
      ? await db
          .select({
            id: userSubscriptions.id,
            userId: userSubscriptions.customerId,
            planId: userSubscriptions.planId,
            status: userSubscriptions.status,
            startDate: userSubscriptions.startDate,
            nextDeliveryDate: userSubscriptions.nextDeliveryDate,
            stripeSubscriptionId: userSubscriptions.stripeSubscriptionId,
            planName: userSubscriptions.planName,
            createdAt: userSubscriptions.createdAt,
            updatedAt: userSubscriptions.updatedAt,
          })
          .from(userSubscriptions)
          .where(eq(userSubscriptions.customerId, userId))
      : [];

    console.log(`Encontradas ${subscriptions.length} assinaturas`);

    // Buscar pedidos do usuário/cliente
    const userOrders = isCustomer
      ? await db.select().from(orders).where(eq(orders.customerId, userId))
      : [];

    console.log(`Encontrados ${userOrders.length} pedidos`);

    return NextResponse.json({
      user: userData,
      subscriptions,
      orders: userOrders,
    });
  } catch (error) {
    console.error("Erro detalhado ao buscar detalhes do usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar detalhes do usuário" },
      { status: 500 }
    );
  }
}
