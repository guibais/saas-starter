import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { User } from "@/lib/db/schema";
import { ADMIN_COOKIE_NAME, setSessionCookie } from "./cookie-utils";
import { hash, compare } from "bcryptjs";

// Secret key for JWT signing/verification
const key = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-at-least-32-characters"
);

// Password hashing functions
export async function hashPassword(password: string) {
  return await hash(password, 10);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return await compare(plainTextPassword, hashedPassword);
}

export type SessionData = {
  user: { id: number; role?: string };
  expires: string;
  isCustomer?: boolean;
};

// Token operations (can be used on both client and server)
export async function signToken(payload: SessionData) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(key);

  return token;
}

export async function verifyToken(input: string) {
  try {
    console.log("[verifyToken] Verificando token:", input);
    const { payload } = await jwtVerify(input, key);
    console.log("[verifyToken] Token verificado com sucesso:", payload);
    return payload as SessionData;
  } catch (error) {
    console.error("[verifyToken] Erro ao verificar token:", error);
    return null;
  }
}

// Server-side session operations (for backward compatibility)
export async function getSession() {
  try {
    // Get the session cookie from request headers
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

    if (!sessionCookie) return null;

    const sessionToken = sessionCookie.value;

    // Verify the token
    const session = await verifyToken(sessionToken);
    if (!session) {
      return null;
    }

    return session;
  } catch (error) {
    console.error("[Auth] Error getting session:", error);
    return null;
  }
}

// Get customer session specifically
export async function getCustomerSession() {
  try {
    // Get the customer session cookie from request headers
    const cookieStore = await cookies();
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

// Client-side session operations
export async function login(email: string, password: string) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function register(userData: Partial<User>) {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function logout() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function getUser() {
  try {
    const response = await fetch("/api/auth/user", {
      credentials: "include",
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function setSession(user: User) {
  console.log(`[setSession] Criando sessão para usuário ${user.id}`);

  const session = {
    user: { id: user.id, role: user.role },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
  };

  const token = await signToken(session);

  // Verificar qual ambiente estamos
  const isProd = process.env.NODE_ENV === "production";
  console.log(
    `[setSession] Ambiente detectado: ${
      isProd ? "Produção" : "Desenvolvimento"
    }`
  );

  // Set the session cookie with production-safe settings
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: "/",
    secure: isProd,
    sameSite: "strict",
    // Use domain apenas em produção, se necessário
    ...(isProd && process.env.COOKIE_DOMAIN
      ? { domain: process.env.COOKIE_DOMAIN }
      : {}),
    maxAge: 60 * 60 * 24, // 1 day in seconds
    priority: "high",
  });

  console.log(
    `[setSession] Cookie "${ADMIN_COOKIE_NAME}" definido para ${
      user.id
    } com configurações para ${isProd ? "produção" : "desenvolvimento"}`
  );
  return session;
}
