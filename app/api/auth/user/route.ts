import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  console.log("[API /auth/user] Recebendo solicitação");

  try {
    // Primeiro, tentar obter a sessão normal (admin/staff)
    const sessionCookie = request.cookies.get("session");

    if (sessionCookie) {
      console.log(
        "[API /auth/user] Cookie de sessão encontrado, verificando token"
      );

      // Verificar token
      const session = await verifyToken(sessionCookie.value);

      if (!session || !session.user || !session.user.id) {
        console.log("[API /auth/user] Token inválido ou expirado");
      } else {
        console.log(
          `[API /auth/user] Token válido para usuário ID: ${session.user.id}`
        );

        // Buscar usuário no banco de dados
        const user = await db.query.users.findFirst({
          where: eq(users.id, session.user.id),
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            address: true,
            phone: true,
            deliveryInstructions: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!user) {
          console.log(
            `[API /auth/user] Usuário ID: ${session.user.id} não encontrado no banco de dados`
          );
        } else {
          console.log(
            `[API /auth/user] Usuário ID: ${user.id}, role: ${user.role} encontrado com sucesso`
          );
          return NextResponse.json({
            ...user,
            isCustomer: false,
            isAdmin: user.role === "admin",
          });
        }
      }
    }

    // Se não tiver session válida ou não encontrou o usuário, tentar customer_session
    const customerSessionCookie = request.cookies.get("customer_session");

    if (customerSessionCookie) {
      console.log(
        "[API /auth/user] Cookie de sessão de cliente encontrado, verificando token"
      );

      // Verificar token
      const customerSession = await verifyToken(customerSessionCookie.value);

      if (
        !customerSession ||
        !customerSession.user ||
        !customerSession.user.id ||
        !customerSession.isCustomer
      ) {
        console.log("[API /auth/user] Token de cliente inválido ou expirado");
      } else {
        console.log(
          `[API /auth/user] Token de cliente válido para ID: ${customerSession.user.id}`
        );

        // Buscar cliente no banco de dados
        const customer = await db.query.customers.findFirst({
          where: eq(customers.id, customerSession.user.id),
          columns: {
            id: true,
            name: true,
            email: true,
            address: true,
            phone: true,
            deliveryInstructions: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!customer) {
          console.log(
            `[API /auth/user] Cliente ID: ${customerSession.user.id} não encontrado no banco de dados`
          );
        } else {
          console.log(
            `[API /auth/user] Cliente ID: ${customer.id} encontrado com sucesso`
          );
          return NextResponse.json({
            ...customer,
            role: "customer",
            isCustomer: true,
            isAdmin: false,
          });
        }
      }
    }

    // Nenhuma sessão válida encontrada
    console.log("[API /auth/user] Nenhuma sessão válida encontrada");
    return NextResponse.json(null, { status: 401 });
  } catch (error) {
    console.error("[API /auth/user] Erro ao obter usuário:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
