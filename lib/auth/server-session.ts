"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { User } from "@/lib/db/schema";
import { SessionData, verifyToken, signToken } from "./session";

// Server-side session operations (for backward compatibility)
export async function getSession() {
  try {
    console.log("[getSession] Buscando cookie de sessão");

    // Get the session cookie from request headers
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      console.log("[getSession] Cookie de sessão não encontrado");
      return null;
    }

    console.log("[getSession] Cookie de sessão encontrado, verificando token");
    const sessionToken = sessionCookie.value;

    // Verify the token
    const session = await verifyToken(sessionToken);
    if (!session) {
      console.log("[getSession] Token inválido ou expirado");
      return null;
    }

    console.log("[getSession] Sessão válida encontrada:", session.user?.id);
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

// Get customer session specifically
export async function getCustomerSession() {
  try {
    // Get the customer session cookie from request headers
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("customer_session");

    if (!sessionCookie) {
      console.log("[Auth] Customer session cookie not found");
      return null;
    }

    const sessionToken = sessionCookie.value;

    // Verify the token
    const session = await verifyToken(sessionToken);
    if (!session) {
      console.log("[Auth] Customer session token invalid");
      return null;
    }

    if (!session.isCustomer) {
      console.log("[Auth] Session is not a customer session");
      return null;
    }

    return session;
  } catch (error) {
    console.error("[Auth] Error getting customer session:", error);
    return null;
  }
}

export async function setSession(user: User) {
  const session: SessionData = {
    user: { id: user.id, role: user.role },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
  };

  const token = await signToken(session);

  // Set the session cookie
  const cookieStore = cookies();
  cookieStore.set({
    name: "session",
    value: token,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 day in seconds
    sameSite: "lax",
  });

  return session;
}

// Server-side getUser
export async function getServerUser() {
  console.log("[getServerUser] Iniciando busca do usuário a partir da sessão");

  const session = await getSession();
  console.log(
    "[getServerUser] Sessão encontrada:",
    session ? `ID: ${session.user?.id}` : "Nenhuma sessão"
  );

  if (!session || !session.user || !session.user.id) {
    console.log("[getServerUser] Nenhuma sessão válida encontrada");
    return null;
  }

  console.log(
    `[getServerUser] Buscando usuário ID ${session.user.id} no banco de dados`
  );
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  console.log(
    "[getServerUser] Resultado da busca:",
    user
      ? `Usuário encontrado: ${user.name || user.email}`
      : "Usuário não encontrado"
  );

  return user;
}
