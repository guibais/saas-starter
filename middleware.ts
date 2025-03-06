import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { signToken, verifyToken } from "@/lib/auth/session";

const protectedRoutes = "/dashboard";
const adminRoutes = "/dashboard/admin";
const customerDashboardRoutes = "/customer/dashboard";

// Função para habilitar logs de diagnóstico
const DEBUG_AUTH = process.env.DEBUG_AUTH === "true";

function log(...args: any[]) {
  if (DEBUG_AUTH) {
    console.log(...args);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  log(`[Middleware] Processando rota: ${pathname}`);

  // Log do referrer para depurar redirecionamentos
  const referer = request.headers.get("referer");
  log(`[Middleware] Referer: ${referer || "Nenhum"}`);

  // Verificar os cookies corretos
  const adminSessionCookie = request.cookies.get("admin_session");
  const customerSessionCookie = request.cookies.get("customer_session");

  log(`[Middleware] Cookies encontrados:`, {
    admin_session: adminSessionCookie ? "presente" : "ausente",
    customer_session: customerSessionCookie ? "presente" : "ausente",
  });

  const isProtectedRoute = pathname.startsWith(protectedRoutes);
  const isAdminRoute = pathname.startsWith(adminRoutes);
  const isCustomerDashboardRoute = pathname.startsWith(customerDashboardRoutes);

  // Verificar se estamos em um fluxo de login-para-admin
  const isComingFromLogin =
    referer &&
    (referer.includes("/login") ||
      referer.includes("/sign-in") ||
      referer.includes("/admin-login"));

  if (isComingFromLogin) {
    log(
      `[Middleware] Detectado fluxo de login-para-admin. Verificando cookies...`
    );
  }

  // Se é rota administrativa, dar prioridade ao cookie admin_session
  if (isAdminRoute && adminSessionCookie) {
    try {
      log(`[Middleware] Rota admin - verificando token de sessão admin`);
      const session = await verifyToken(adminSessionCookie.value);

      if (!session || !session.user || session.user.role !== "admin") {
        log(`[Middleware] Token de admin inválido ou usuário não é admin`);
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }

      log(`[Middleware] Acesso admin autorizado para: ${session.user.id}`);
      // Admin tem acesso, continuar com a resposta normal
      return NextResponse.next();
    } catch (error) {
      log(`[Middleware] Erro ao verificar sessão admin: ${error}`);
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  // Redirect to sign-in if trying to access protected routes without a session
  if (isProtectedRoute && !adminSessionCookie) {
    log(
      `[Middleware] Tentativa de acesso a rota protegida sem sessão. Redirecionando para login.`
    );
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Redirect to customer login if trying to access customer dashboard without a customer session
  if (isCustomerDashboardRoute && !customerSessionCookie) {
    log(
      `[Middleware] Tentativa de acesso ao dashboard de cliente sem sessão. Redirecionando para login de cliente.`
    );
    return NextResponse.redirect(new URL("/customer/login", request.url));
  }

  let res = NextResponse.next();

  if (adminSessionCookie) {
    try {
      log(`[Middleware] Verificando token de sessão admin/staff`);
      const session = await verifyToken(adminSessionCookie.value);

      // If session is invalid or expired, clear it and redirect if on protected route
      if (!session) {
        log(
          `[Middleware] Sessão inválida ou expirada. Removendo cookie e redirecionando.`
        );

        // Use as configurações corretas para remover o cookie
        const isProd = process.env.NODE_ENV === "production";
        const cookieOptions: any = {
          name: "admin_session",
          value: "",
          expires: new Date(0),
          path: "/",
          sameSite: "strict",
          secure: isProd,
        };

        // Em produção, adicionar domain se configurado
        if (isProd && process.env.COOKIE_DOMAIN) {
          cookieOptions.domain = process.env.COOKIE_DOMAIN;
        }

        res.cookies.set(cookieOptions);

        if (isProtectedRoute) {
          return NextResponse.redirect(new URL("/sign-in", request.url));
        }
        return res;
      }

      log(
        `[Middleware] Sessão válida para usuário ID: ${session.user.id}, Role: ${session.user.role}`
      );

      // Role-based access control
      if (isAdminRoute && session.user.role !== "admin") {
        log(`[Middleware] Acesso negado: usuário não é admin. Redirecionando.`);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // If user is admin and accessing the main dashboard, redirect to admin dashboard
      if (pathname === "/dashboard" && session.user.role === "admin") {
        log(
          `[Middleware] Usuário admin acessando dashboard geral. Redirecionando para dashboard admin.`
        );
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }

      // Refresh the session if it's about to expire (less than 4 hours left)
      const expiresAt = new Date(session.expires).getTime();
      const now = Date.now();
      const fourHoursInMs = 4 * 60 * 60 * 1000;

      if (expiresAt - now < fourHoursInMs) {
        log(`[Middleware] Renovando sessão que está próxima de expirar`);
        const expiresInOneDay = new Date(now + 24 * 60 * 60 * 1000);

        // Preservar o cookie de sessão atual
        const updatedSession = {
          ...session,
          expires: expiresInOneDay.toISOString(),
        };

        const newToken = await signToken(updatedSession);

        // Configurações para renovar o cookie
        const isProd = process.env.NODE_ENV === "production";
        const cookieOptions: any = {
          name: "admin_session",
          value: newToken,
          httpOnly: true,
          expires: expiresInOneDay,
          path: "/",
          sameSite: "strict",
          secure: isProd,
          priority: "high",
        };

        // Em produção, adicionar domain se configurado
        if (isProd && process.env.COOKIE_DOMAIN) {
          cookieOptions.domain = process.env.COOKIE_DOMAIN;
        }

        res.cookies.set(cookieOptions);

        log(
          `[Middleware] Sessão renovada com sucesso. Nova expiração: ${expiresInOneDay.toISOString()}`
        );
      }
    } catch (error) {
      console.error("[Middleware] Erro ao processar sessão:", error);
      log(
        `[Middleware] Erro ao processar sessão: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );

      // Não remover o cookie em caso de erro - pode ser um problema temporário
      if (isProtectedRoute) {
        log(`[Middleware] Redirecionando para login devido ao erro na sessão`);
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
    }
  }

  // Agora, somente gerencie o customer_session se não for uma rota admin
  // Isso evita colisões entre as sessões em rotas administrativas
  if (customerSessionCookie && !isAdminRoute) {
    try {
      log(`[Middleware] Verificando token de sessão de cliente`);
      const session = await verifyToken(customerSessionCookie.value);

      // If customer session is invalid or expired, clear it and redirect if on customer dashboard
      if (!session || !session.isCustomer) {
        log(
          `[Middleware] Sessão de cliente inválida ou expirada. Removendo cookie e redirecionando.`
        );
        res.cookies.delete("customer_session");
        if (isCustomerDashboardRoute) {
          return NextResponse.redirect(new URL("/customer/login", request.url));
        }
        return res;
      }

      log(
        `[Middleware] Sessão de cliente válida para usuário ID: ${session.user.id}`
      );

      // Refresh the customer session if it's about to expire (less than 4 hours left)
      const expiresAt = new Date(session.expires).getTime();
      const now = Date.now();
      const fourHoursInMs = 4 * 60 * 60 * 1000;

      if (expiresAt - now < fourHoursInMs) {
        log(
          `[Middleware] Renovando sessão de cliente que está próxima de expirar`
        );
        const expiresInOneDay = new Date(now + 24 * 60 * 60 * 1000);

        // Preservar o cookie de sessão atual
        const updatedSession = {
          ...session,
          expires: expiresInOneDay.toISOString(),
        };

        const newToken = await signToken(updatedSession);

        // Configurações para o cookie de cliente
        const cookieOptions: any = {
          name: "customer_session",
          value: newToken,
          httpOnly: true,
          expires: expiresInOneDay,
          path: "/",
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
          priority: "high",
        };

        res.cookies.set(cookieOptions);

        log(
          `[Middleware] Sessão de cliente renovada com sucesso. Nova expiração: ${expiresInOneDay.toISOString()}`
        );
      }
    } catch (error) {
      console.error("[Middleware] Erro ao processar sessão de cliente:", error);
      log(
        `[Middleware] Erro ao processar sessão de cliente: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );

      // Não remover o cookie em caso de erro - pode ser um problema temporário
      if (isCustomerDashboardRoute) {
        log(
          `[Middleware] Redirecionando para login de cliente devido ao erro na sessão`
        );
        return NextResponse.redirect(new URL("/customer/login", request.url));
      }
    }
  }

  log(`[Middleware] Finalizando processamento para: ${pathname}`);
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
