import { cookies } from "next/headers";
import { cache } from "react";

// Function to get the customer user
export const getCustomerUser = cache(async () => {
  try {
    // URL absoluta para evitar problemas de resolução
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/customer/user`
      : `http://localhost:3000/api/customer/user`;

    console.log(`[Utils] Buscando informações do usuário`);
    console.log(`[Utils] URL da API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Cookie: cookies().toString(),
      },
      next: { revalidate: 0 },
    });

    console.log(`[Utils] Status da resposta do usuário: ${response.status}`);

    if (!response.ok) {
      console.error(`[Utils] Erro ao buscar usuário: ${response.statusText}`);
      return null;
    }

    const userData = await response.json();
    console.log(`[Utils] Usuário encontrado com ID: ${userData.id}`);
    return userData;
  } catch (error) {
    console.error("[Utils] Erro ao obter usuário cliente:", error);
    return null;
  }
});
