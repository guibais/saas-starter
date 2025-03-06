import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { signToken, verifyToken } from "@/lib/auth/session";

const protectedRoutes = "/dashboard";
const adminRoutes = "/dashboard/admin";
const customerDashboardRoutes = "/customer/dashboard";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session");
  const customerSessionCookie = request.cookies.get("customer_session");

  const isProtectedRoute = pathname.startsWith(protectedRoutes);
  const isAdminRoute = pathname.startsWith(adminRoutes);
  const isCustomerDashboardRoute = pathname.startsWith(customerDashboardRoutes);

  // Redirect to sign-in if trying to access protected routes without a session
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Redirect to customer login if trying to access customer dashboard without a customer session
  if (isCustomerDashboardRoute && !customerSessionCookie) {
    return NextResponse.redirect(new URL("/customer/login", request.url));
  }

  let res = NextResponse.next();

  if (sessionCookie) {
    try {
      const session = await verifyToken(sessionCookie.value);

      // If session is invalid or expired, clear it and redirect if on protected route
      if (!session) {
        res.cookies.delete("session");
        if (isProtectedRoute) {
          return NextResponse.redirect(new URL("/sign-in", request.url));
        }
        return res;
      }

      // Role-based access control
      if (isAdminRoute && session.user.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // If user is admin and accessing the main dashboard, redirect to admin dashboard
      if (pathname === "/dashboard" && session.user.role === "admin") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }

      // Refresh the session if it's about to expire (less than 4 hours left)
      const expiresAt = new Date(session.expires).getTime();
      const now = Date.now();
      const fourHoursInMs = 4 * 60 * 60 * 1000;

      if (expiresAt - now < fourHoursInMs) {
        const expiresInOneDay = new Date(now + 24 * 60 * 60 * 1000);

        res.cookies.set({
          name: "session",
          value: await signToken({
            ...session,
            expires: expiresInOneDay.toISOString(),
          }),
          httpOnly: true,
          expires: expiresInOneDay,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
    } catch (error) {
      console.error("Error processing session:", error);
      res.cookies.delete("session");
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
    }
  }

  // Handle customer session
  if (customerSessionCookie) {
    try {
      const session = await verifyToken(customerSessionCookie.value);

      // If customer session is invalid or expired, clear it and redirect if on customer dashboard
      if (!session || !session.isCustomer) {
        res.cookies.delete("customer_session");
        if (isCustomerDashboardRoute) {
          return NextResponse.redirect(new URL("/customer/login", request.url));
        }
        return res;
      }

      // Refresh the customer session if it's about to expire (less than 4 hours left)
      const expiresAt = new Date(session.expires).getTime();
      const now = Date.now();
      const fourHoursInMs = 4 * 60 * 60 * 1000;

      if (expiresAt - now < fourHoursInMs) {
        const expiresInOneDay = new Date(now + 24 * 60 * 60 * 1000);

        res.cookies.set({
          name: "customer_session",
          value: await signToken({
            ...session,
            expires: expiresInOneDay.toISOString(),
          }),
          httpOnly: true,
          expires: expiresInOneDay,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
    } catch (error) {
      console.error("Error processing customer session:", error);
      res.cookies.delete("customer_session");
      if (isCustomerDashboardRoute) {
        return NextResponse.redirect(new URL("/customer/login", request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
