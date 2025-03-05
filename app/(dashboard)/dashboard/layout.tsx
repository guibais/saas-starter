"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Package,
  ShoppingBag,
  Layers,
  Users,
  BarChart3,
  Settings,
  Calendar,
  ShoppingCart,
  Menu,
  X,
  Home,
  Shield,
  Activity,
  Cog,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const adminLinks = [
    {
      title: "Painel Admin",
      href: "/dashboard/admin",
      icon: Home,
    },
    {
      title: "Produtos",
      href: "/dashboard/admin/products",
      icon: Package,
    },
    {
      title: "Planos",
      href: "/dashboard/admin/plans",
      icon: Calendar,
    },
    {
      title: "Estoque",
      href: "/dashboard/admin/inventory",
      icon: Layers,
    },
    {
      title: "Pedidos",
      href: "/dashboard/admin/orders",
      icon: ShoppingCart,
    },
  ];

  const defaultLinks = [
    {
      title: "Equipe",
      href: "/dashboard",
      icon: Users,
    },
    {
      title: "Geral",
      href: "/dashboard/general",
      icon: Cog,
    },
    {
      title: "Atividade",
      href: "/dashboard/activity",
      icon: Activity,
    },
    {
      title: "Segurança",
      href: "/dashboard/security",
      icon: Shield,
    },
  ];

  const isAdminSection = pathname.includes("/admin");

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mr-4 lg:hidden"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </button>
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold">Tudo Fresco</span>
          </Link>
          <div className="ml-auto flex items-center space-x-4">
            <Link
              href="/dashboard/settings"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Configurações
            </Link>
          </div>
        </div>
      </div>
      <div className="flex flex-1">
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-background transition-transform lg:static lg:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b px-4 lg:h-[65px]">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold">Tudo Fresco</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close sidebar</span>
            </button>
          </div>
          <nav className="space-y-6 px-2 py-5">
            {isAdminSection && (
              <div>
                <h3 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                  Administração
                </h3>
                <div className="space-y-1">
                  {adminLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                        pathname === link.href
                          ? "bg-muted font-medium text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                Dashboard
              </h3>
              <div className="space-y-1">
                {defaultLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                      pathname === link.href
                        ? "bg-muted font-medium text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
        <div className="flex flex-1 flex-col">
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
