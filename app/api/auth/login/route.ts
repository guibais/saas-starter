import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { comparePasswords, signToken } from "@/lib/auth/session";
import {
  ADMIN_COOKIE_NAME,
  setSessionCookieInResponse,
} from "@/lib/auth/cookie-utils";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar usuário pelo email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { message: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Verificar senha
    const passwordMatch = await comparePasswords(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Credenciais inválidas" },
        { status: 401 }
      );
    }

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

    // Criar resposta com os dados do usuário
    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Definir cookie de sessão na resposta usando a função utilitária
    setSessionCookieInResponse(
      response.cookies,
      ADMIN_COOKIE_NAME,
      token,
      expires
    );

    return response;
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { message: "Erro ao processar login" },
      { status: 500 }
    );
  }
}
