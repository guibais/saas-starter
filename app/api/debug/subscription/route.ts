import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db/drizzle";
import { userSubscriptions, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    // Obter a sessão do usuário
    const session = await getSession();
    const cookieStore = await cookies();
    const customerSessionCookie = cookieStore.get("customer_session");

    // Informações de diagnóstico
    const diagnosticInfo = {
      session: session
        ? {
            userRole: session.user.role,
            userId: session.user.id,
            isCustomer: session.isCustomer || false,
          }
        : null,
      hasCustomerCookie: !!customerSessionCookie,
      message: "Diagnóstico da API de assinaturas",
    };

    // Se não há sessão, retornar apenas informações de diagnóstico
    if (!session) {
      return NextResponse.json({
        ...diagnosticInfo,
        error: "Nenhuma sessão encontrada",
      });
    }

    // Verificar se é sessão de cliente
    if (session.isCustomer) {
      // Buscar informações do cliente
      const customer = await db.query.customers.findFirst({
        where: eq(customers.id, session.user.id),
        columns: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!customer) {
        return NextResponse.json({
          ...diagnosticInfo,
          error: "Cliente não encontrado no banco de dados",
        });
      }

      // Buscar assinatura do cliente
      const subscription = await db.query.userSubscriptions.findFirst({
        where: eq(userSubscriptions.customerId, customer.id),
        orderBy: (userSubscriptions, { desc }) => [
          desc(userSubscriptions.createdAt),
        ],
      });

      return NextResponse.json({
        ...diagnosticInfo,
        customer,
        hasSubscription: !!subscription,
        subscription: subscription || null,
      });
    } else {
      // Sessão de usuário administrativo
      return NextResponse.json({
        ...diagnosticInfo,
        message: "Sessão administrativa detectada",
      });
    }
  } catch (error) {
    console.error("Erro no diagnóstico de assinatura:", error);
    return NextResponse.json(
      {
        error: "Erro ao executar diagnóstico de assinatura",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
