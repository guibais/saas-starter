import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, signToken } from "@/lib/auth/session";
import {
  ADMIN_COOKIE_NAME,
  setSessionCookieInResponse,
} from "@/lib/auth/cookie-utils";

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    const { email, password, name } = userData;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o email já está em uso
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email já está em uso" },
        { status: 400 }
      );
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Criar novo usuário
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
        role: "member", // Papel padrão
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      });

    if (!newUser) {
      throw new Error("Falha ao criar usuário");
    }

    // Criar sessão
    const expires = new Date(Date.now() + 86400 * 1000); // 1 day
    const session = {
      user: {
        id: newUser.id,
        role: newUser.role,
      },
      expires: expires.toISOString(),
    };

    const token = await signToken(session);

    // Criar resposta com os dados do usuário
    const response = NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
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
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { message: "Erro ao processar registro" },
      { status: 500 }
    );
  }
}
