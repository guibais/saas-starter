import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { comparePasswords, signToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    console.log("[CustomerLogin] Iniciando processo de login cliente");
    const { email, password } = await request.json();

    if (!email || !password) {
      console.log("[CustomerLogin] Erro: Email ou senha não fornecidos");
      return NextResponse.json(
        { message: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    console.log(`[CustomerLogin] Buscando usuário com email: ${email}`);
    // Buscar cliente pelo email (na tabela customers)
    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, email),
    });

    if (!customer) {
      console.log("[CustomerLogin] Erro: Cliente não encontrado");
      return NextResponse.json(
        { message: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    console.log("[CustomerLogin] Verificando senha");
    // Verificar senha
    const passwordMatch = await comparePasswords(
      password,
      customer.passwordHash
    );

    if (!passwordMatch) {
      console.log("[CustomerLogin] Erro: Senha incorreta");
      return NextResponse.json(
        { message: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    console.log("[CustomerLogin] Senha verificada com sucesso, criando sessão");
    // Criar sessão
    const expires = new Date(Date.now() + 86400 * 1000); // 1 day
    const session = {
      user: {
        id: customer.id,
        role: "customer",
      },
      expires: expires.toISOString(),
      isCustomer: true,
    };

    const token = await signToken(session);
    console.log("[CustomerLogin] Token de sessão gerado");

    // Dados resposta enviados ao cliente
    const userData = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: "customer",
      customer: {
        id: customer.id,
        createdAt: customer.createdAt,
      },
    };

    // Criar resposta com os dados do usuário
    const response = NextResponse.json(userData);

    // Garantir que quaisquer cookies antigos sejam removidos
    response.cookies.delete("customer_session");

    // Definir cookie de sessão na resposta com configurações corretas
    console.log("[CustomerLogin] Definindo cookie de sessão do cliente");
    response.cookies.set({
      name: "customer_session",
      value: token,
      httpOnly: true,
      expires,
      path: "/",
      sameSite: "lax",
      // secure: process.env.NODE_ENV === "production",
      // Garantir que o cookie não seja removido por redirecionamentos subsequentes
      priority: "high",
    });

    console.log(
      "[CustomerLogin] Cookie de sessão definido, login concluído com sucesso"
    );
    return response;
  } catch (error) {
    console.error("[CustomerLogin] Erro no login do cliente:", error);
    return NextResponse.json(
      { message: "Erro ao processar login do cliente" },
      { status: 500 }
    );
  }
}
