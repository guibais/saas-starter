"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken, signToken } from "@/lib/auth/session";
import type { User } from "@/lib/db/schema";

// Função para obter a sessão do usuário
export async function getSession() {
  try {
    console.log("[getSession] Obtendo cookie de sessão");
    // Get the session cookie from request headers
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("admin_session");

    if (!sessionCookie) {
      console.log("[getSession] Cookie de sessão não encontrado");
      return null;
    }

    try {
      console.log("[getSession] Verificando token de sessão");
      // Verify the session token
      const session = await verifyToken(sessionCookie.value);

      if (!session || !session.user || !session.expires) {
        console.log("[getSession] Sessão inválida ou expirada");
        return null;
      }

      // Check if the session has expired
      const now = new Date();
      const expiresAt = new Date(session.expires);

      if (now > expiresAt) {
        console.log("[getSession] Sessão expirada");
        return null;
      }

      console.log("[getSession] Sessão válida encontrada");
      return session;
    } catch (error) {
      console.error("[getSession] Erro ao verificar token:", error);
      return null;
    }
  } catch (error) {
    console.error("[getSession] Erro ao obter sessão:", error);
    return null;
  }
}

// Função para obter a sessão do cliente
export async function getCustomerSession() {
  try {
    console.log("[getCustomerSession] Obtendo cookie de sessão do cliente");
    // Get the customer session cookie from request headers
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("customer_session");

    if (!sessionCookie) {
      console.log("[Auth] Customer session cookie not found");
      return null;
    }

    try {
      // Verify the session token
      const session = await verifyToken(sessionCookie.value);

      if (
        !session ||
        !session.user ||
        !session.expires ||
        !session.isCustomer
      ) {
        console.log("[Auth] Customer session invalid or expired");
        return null;
      }

      // Check if the session has expired
      const now = new Date();
      const expiresAt = new Date(session.expires);

      if (now > expiresAt) {
        console.log("[Auth] Customer session expired");
        return null;
      }

      return session;
    } catch (error) {
      console.error("[Auth] Error verifying customer token:", error);
      return null;
    }
  } catch (error) {
    console.error("[Auth] Error getting customer session:", error);
    return null;
  }
}

// Função para definir uma sessão de usuário
export async function setSession(user: User) {
  console.log(`[setSession] Criando sessão para usuário ${user.id}`);
  const session = {
    user: { id: user.id, role: user.role },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
  };

  const token = await signToken(session);

  // Set the session cookie
  const cookieStore = await cookies();
  cookieStore.set({
    name: "admin_session",
    value: token,
    httpOnly: true,
    path: "/",
    // secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 day in seconds
    sameSite: "lax",
    priority: "high",
  });

  console.log(`[setSession] Sessão criada com sucesso para usuário ${user.id}`);
  return session;
}

// Função para obter o usuário atual do servidor
export async function getServerUser(isAdminRoute: boolean = false) {
  try {
    console.log("[getServerUser] Verificando se há usuário autenticado");

    // Primeiro, tentar obter usuário admin/staff pela sessão normal
    const session = await getSession();

    if (session && session.user && session.user.id) {
      console.log(
        `[getServerUser] Sessão admin/staff encontrada para ID: ${session.user.id}`
      );

      // Get the user from the database
      const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
      });

      if (user) {
        console.log(
          `[getServerUser] Resultado da busca: Usuário encontrado: ${user.name}`
        );
        return user;
      } else {
        console.log("[getServerUser] Usuário não encontrado no banco de dados");
      }
    }

    // Se não é rota de admin e não encontrou sessão normal ou não encontrou usuário,
    // tentar sessão de cliente
    if (!isAdminRoute) {
      const customerSession = await getCustomerSession();

      if (customerSession && customerSession.user && customerSession.user.id) {
        console.log(
          `[getServerUser] Sessão de cliente encontrada para ID: ${customerSession.user.id}`
        );

        // Get the customer from the database
        const customer = await db.query.customers.findFirst({
          where: eq(customers.id, customerSession.user.id),
        });

        if (customer) {
          console.log(`[getServerUser] Cliente encontrado: ${customer.name}`);
          // Note: dependendo de como o sistema espera os dados, pode ser necessário
          // adaptar o objeto customer para ter a mesma estrutura que user
          return {
            ...customer,
            role: "customer",
            isCustomer: true,
          };
        } else {
          console.log(
            "[getServerUser] Cliente não encontrado no banco de dados"
          );
        }
      }
    }

    console.log("[getServerUser] Nenhuma sessão válida encontrada");
    return null;
  } catch (error) {
    console.error("[getServerUser] Erro ao obter usuário:", error);
    return null;
  }
}
