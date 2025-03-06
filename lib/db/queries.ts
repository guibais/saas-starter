import { desc, and, eq, isNull } from "drizzle-orm";
import { db } from "./index";
import { activityLogs, teamMembers, teams, users } from "./schema";
import { verifyToken } from "@/lib/auth/session";
import { headers } from "next/headers";
import { cache } from "react";
import { cookies } from "next/headers";

// Server-side function to get the current user from a request object
export async function getUserFromRequest(request: Request) {
  try {
    // Extract the cookie from the request headers
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return null;

    // Parse the cookie string to find the session cookie
    const cookies = parseCookies(cookieHeader);
    const sessionCookie = cookies["session"];

    if (!sessionCookie) return null;

    // Verify the token and get the user
    return await getUserFromToken(sessionCookie);
  } catch (error) {
    console.error("Error getting user from request:", error);
    return null;
  }
}

// Helper function to parse cookies from a cookie header string
function parseCookies(cookieHeader: string) {
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split("=");
    cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {} as Record<string, string>);
}

// Get user from a session token
async function getUserFromToken(token: string) {
  try {
    // Verify the token
    const sessionData = await verifyToken(token);

    if (
      !sessionData ||
      !sessionData.user ||
      typeof sessionData.user.id !== "number"
    ) {
      return null;
    }

    // Check if the session is expired
    if (new Date(sessionData.expires) < new Date()) {
      return null;
    }

    // Get the user from the database
    const user = await db.query.users.findFirst({
      where: and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)),
    });

    return user;
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
}

// Cached version of getUser for use in Server Components
export const getUser = cache(async () => {
  try {
    // Construir a URL absoluta com base na variável de ambiente
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000");
    const apiUrl = `${baseUrl}/api/auth/user`;

    console.log("[getUser] Chamando API:", apiUrl);

    // Diferenciação entre ambiente cliente e servidor
    if (typeof window !== "undefined") {
      // Cliente: enviar credentials para incluir cookies automaticamente
      console.log("[getUser] Ambiente: Cliente");
      const response = await fetch(apiUrl, {
        cache: "no-store",
        credentials: "include",
      });

      console.log("[getUser] Status da resposta:", response.status);
      if (!response.ok) return null;
      return await response.json();
    } else {
      // Servidor: precisamos enviar cookies explicitamente
      console.log("[getUser] Ambiente: Servidor");
      // Obter cookies do request
      const cookieHeader = cookies().toString();
      console.log(
        "[getUser] Cookies:",
        cookieHeader ? "Cookies encontrados" : "Nenhum cookie"
      );

      const response = await fetch(apiUrl, {
        cache: "no-store",
        next: { revalidate: 0 },
        headers: {
          Cookie: cookieHeader,
        },
      });

      console.log("[getUser] Status da resposta:", response.status);
      if (!response.ok) return null;
      return await response.json();
    }
  } catch (error) {
    console.error("[getUser] Erro:", error);
    return null;
  }
});

// Function to get user by ID
export async function getUserById(userId: number) {
  try {
    return await db.query.users.findFirst({
      where: and(eq(users.id, userId), isNull(users.deletedAt)),
    });
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser(userId: number) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      teamMembers: {
        with: {
          team: {
            with: {
              teamMembers: {
                with: {
                  user: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return result?.teamMembers[0]?.team || null;
}
