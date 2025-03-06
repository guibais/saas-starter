import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { comparePasswords, signToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    console.log("[AdminLogin] Iniciando processo de login administrativo");
    const { email, password } = await request.json();

    if (!email || !password) {
      console.log("[AdminLogin] Erro: Email ou senha não fornecidos");
      return NextResponse.json(
        { message: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    console.log(`[AdminLogin] Buscando usuário com email: ${email}`);
    // Buscar usuário pelo email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      console.log("[AdminLogin] Erro: Usuário não encontrado");
      return NextResponse.json(
        { message: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Verificar se é administrador
    if (user.role !== "admin") {
      console.log(
        `[AdminLogin] Erro: Usuário não é administrador. Role atual: ${user.role}`
      );
      return NextResponse.json(
        {
          message:
            "Acesso negado. Apenas administradores podem fazer login aqui.",
        },
        { status: 403 }
      );
    }

    console.log("[AdminLogin] Verificando senha");
    // Verificar senha
    const passwordMatch = await comparePasswords(password, user.passwordHash);

    if (!passwordMatch) {
      console.log("[AdminLogin] Erro: Senha incorreta");
      return NextResponse.json(
        { message: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    console.log("[AdminLogin] Senha verificada com sucesso, criando sessão");
    // Criar sessão
    const expires = new Date(Date.now() + 86400 * 1000); // 1 day
    const session = {
      user: {
        id: user.id,
        role: user.role,
      },
      expires: expires.toISOString(),
    };

    const token = await signToken(session);
    console.log("[AdminLogin] Token de sessão gerado");

    // Criar resposta com os dados do usuário
    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Garantir que quaisquer cookies antigos sejam removidos
    response.cookies.delete("session");

    // Definir cookie de sessão na resposta com configurações corretas
    console.log("[AdminLogin] Definindo cookie de sessão");
    response.cookies.set({
      name: "session",
      value: token,
      httpOnly: true,
      expires,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      // Garantir que o cookie não seja removido por redirecionamentos subsequentes
      priority: "high",
    });

    console.log(
      "[AdminLogin] Cookie de sessão definido, login concluído com sucesso"
    );
    return response;
  } catch (error) {
    console.error("[AdminLogin] Erro no login administrativo:", error);
    return NextResponse.json(
      { message: "Erro ao processar login administrativo" },
      { status: 500 }
    );
  }
}
