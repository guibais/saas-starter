"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CircleIcon,
  Home,
  LogOut,
  User,
  ShoppingCart,
  Calendar,
  Clock,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function CustomerHeader({ user }: { user: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Fazer uma solicitação POST para a rota de logout
      const response = await fetch("/api/customer/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Redirecionar para a página inicial após o logout bem-sucedido
        router.push("/");
        router.refresh();
      } else {
        console.error("Falha ao fazer logout");
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <CircleIcon className="h-6 w-6 text-green-500" />
          <span className="ml-2 text-xl font-semibold text-gray-900">
            Tudo Fresco
          </span>
        </Link>
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/customer/dashboard"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center"
          >
            <Home className="mr-2 h-4 w-4" />
            Início
          </Link>
          <Link
            href="/customer/dashboard/subscription"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Assinaturas
          </Link>
          <Link
            href="/customer/dashboard/history"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center"
          >
            <Clock className="mr-2 h-4 w-4" />
            Histórico
          </Link>
          <Link
            href="/customer/dashboard/settings"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center"
          >
            <User className="mr-2 h-4 w-4" />
            Minha Conta
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/products"
            className="hidden md:inline-block text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Loja
          </Link>
          <Link
            href="/plans"
            className="hidden md:inline-block text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Planos
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-700 hover:text-gray-900 hidden md:inline-flex"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu do Cliente</SheetTitle>
                <SheetDescription>
                  Acesse as funcionalidades da sua conta
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/customer/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Início
                </Link>
                <Link
                  href="/customer/dashboard/subscription"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Assinaturas
                </Link>
                <Link
                  href="/customer/dashboard/history"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Histórico
                </Link>
                <Link
                  href="/customer/dashboard/settings"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center"
                >
                  <User className="mr-2 h-4 w-4" />
                  Minha Conta
                </Link>
                <div className="border-t border-gray-200 my-2 pt-2"></div>
                <Link
                  href="/products"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Loja
                </Link>
                <Link
                  href="/plans"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Planos
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
