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
      // Em alguns browsers isso pode falhar devido a restrições, mas é uma camada extra de segurança
      document.cookie =
        "admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";

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
