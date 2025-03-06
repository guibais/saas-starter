"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CircleIcon, Home, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { User } from "@/lib/db/schema";
import Image from "next/image";
import { logoutClient } from "@/lib/auth/client-session";

// Controle para evitar logout automático no carregamento inicial
const PREVENT_AUTO_LOGOUT_KEY = "prevent_auto_logout";

export function DashboardHeader({ user }: { user: User | null }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();

  // Efeito para proteção contra logout automático
  useEffect(() => {
    // Verificar se estamos em um carregamento inicial e se acabamos de fazer login
    const isRecentLogin =
      document.referrer &&
      (document.referrer.includes("/login") ||
        document.referrer.includes("/sign-in") ||
        document.referrer.includes("/admin-login"));

    if (isRecentLogin) {
      console.log(
        "[DashboardHeader] Detectado acesso após tela de login. Bloqueando possível logout automático."
      );
      // Definir token para prevenir logout automático
      sessionStorage.setItem(PREVENT_AUTO_LOGOUT_KEY, "true");
    }

    // Marcar que não é mais o carregamento inicial
    setIsInitialLoad(false);
  }, []);

  async function handleSignOut() {
    // Verificar se estamos em uma prevenção de logout automático
    const preventAutoLogout = sessionStorage.getItem(PREVENT_AUTO_LOGOUT_KEY);

    if (preventAutoLogout && isInitialLoad) {
      console.log(
        "[DashboardHeader] Prevenção de logout automático ativada. Ignorando solicitação de logout."
      );
      sessionStorage.removeItem(PREVENT_AUTO_LOGOUT_KEY);
      return;
    }

    console.log("[DashboardHeader] Executando logout manual");
    const success = await logoutClient();
    if (success) {
      router.refresh();
      router.push("/");
    }
  }

  // Se for um carregamento inicial e o usuário existir, verifique se não estamos em um ciclo de logout
  useEffect(() => {
    if (isInitialLoad && user) {
      console.log("[DashboardHeader] Usuário autenticado detectado:", user.id);
    }
  }, [user, isInitialLoad]);

  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.jpeg"
              alt="Tudo Fresco Logo"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="text-xl font-semibold">Admin</span>
          </div>
        </Link>
        <div className="flex items-center space-x-4">
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Pricing
          </Link>
          {user ? (
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger>
                <Avatar className="cursor-pointer size-9">
                  <AvatarImage alt={user.name || ""} />
                  <AvatarFallback>
                    {user.email
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="flex flex-col gap-1">
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="/dashboard" className="flex w-full items-center">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              className="bg-black hover:bg-gray-800 text-white text-sm px-4 py-2 rounded-full"
            >
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
