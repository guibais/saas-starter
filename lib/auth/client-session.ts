"use client";

import { User } from "@/lib/db/schema";

// Funções de sessão específicas para o cliente
export async function getClientUser() {
  try {
    console.log("[getClientUser] Fazendo requisição para /api/auth/user");

    // Chamar a API para obter o usuário
    const response = await fetch("/api/auth/user", {
      credentials: "include",
      cache: "no-store",
      next: { revalidate: 0 },
    });

    console.log("[getClientUser] Status da resposta:", response.status);

    if (!response.ok) {
      console.log("[getClientUser] Resposta não-ok:", response.status);
      return null;
    }

    const user = await response.json();
    console.log(
      "[getClientUser] Usuário retornado:",
      user ? `ID: ${user.id}, Role: ${user.role}` : "Nenhum"
    );
    return user;
  } catch (error) {
    console.error("[getClientUser] Erro ao obter usuário:", error);
    return null;
  }
}

export async function logoutClient() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    return response.ok;
  } catch (error) {
    console.error("[logoutClient] Erro ao fazer logout:", error);
    return false;
  }
}
