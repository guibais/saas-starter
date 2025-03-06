"use client";

import { User } from "@/lib/db/schema";
import {
  ADMIN_COOKIE_NAME,
  getClientCookieClearingScript,
} from "./cookie-utils";

// Funções de sessão específicas para o cliente
export async function getClientUser() {
  try {
    console.log("[getClientUser] Verificando se há usuário autenticado");
    const response = await fetch("/api/auth/user", {
      method: "GET",
      credentials: "include", // Importante para enviar cookies
    });

    // Se não estiver autenticado, retornar null
    if (response.status === 401) {
      console.log("[getClientUser] Usuário não autenticado");
      return null;
    }

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
    console.log("[logoutClient] Iniciando logout no cliente");
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    console.log(`[logoutClient] Resposta do servidor: ${response.status}`);

    // Verificar resposta
    if (response.ok) {
      console.log(
        "[logoutClient] Logout bem-sucedido, limpando cookie localmente"
      );

      // Também tentar limpar o cookie no lado do cliente como backup
      document.cookie = getClientCookieClearingScript(ADMIN_COOKIE_NAME);

      console.log("[logoutClient] Processo de logout concluído");
      return true;
    } else {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Erro desconhecido" }));
      console.error("[logoutClient] Erro ao fazer logout:", errorData.message);
      return false;
    }
  } catch (error) {
    console.error("[logoutClient] Erro ao fazer logout:", error);
    return false;
  }
}
