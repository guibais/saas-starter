import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Menu, LogOut } from "lucide-react";
import { getUser } from "@/lib/db/queries";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cookies } from "next/headers";

// Função para verificar se o usuário é um cliente
async function isCustomerAuthenticated() {
  const cookieStore = await cookies();
  const customerCookie = cookieStore.get("customer_session");
  return !!customerCookie;
}

export async function SiteHeader() {
  const user = await getUser();
  const isCustomer = await isCustomerAuthenticated();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-2xl text-green-900">
            Tudo Fresco
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/plans"
              className="text-sm font-medium text-gray-600 hover:text-green-800"
            >
              Planos de Assinatura
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-gray-600 hover:text-green-800"
            >
              Sobre Nós
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-gray-600 hover:text-green-800"
            >
              Contato
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user || isCustomer ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isCustomer ? (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/customer/dashboard"
                      className="w-full cursor-pointer"
                    >
                      Painel do Cliente
                    </Link>
                  </DropdownMenuItem>
                ) : user ? (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="w-full cursor-pointer">
                      Painel Administrativo
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem asChild>
                  <Link
                    href={
                      isCustomer
                        ? "/customer/dashboard/subscription"
                        : "/dashboard"
                    }
                    className="w-full cursor-pointer"
                  >
                    Minhas Assinaturas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={
                      isCustomer ? "/customer/dashboard/history" : "/dashboard"
                    }
                    className="w-full cursor-pointer"
                  >
                    Histórico de Pedidos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={
                      isCustomer ? "/api/customer/logout" : "/api/auth/logout"
                    }
                    className="w-full cursor-pointer text-red-600 flex items-center"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/customer/login">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Tudo Fresco</SheetTitle>
                <SheetDescription>
                  Frutas frescas e gourmet na sua porta
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/plans"
                  className="text-sm font-medium text-gray-600 hover:text-green-800"
                >
                  Planos de Assinatura
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-medium text-gray-600 hover:text-green-800"
                >
                  Sobre Nós
                </Link>
                <Link
                  href="/contact"
                  className="text-sm font-medium text-gray-600 hover:text-green-800"
                >
                  Contato
                </Link>
                {user || isCustomer ? (
                  <>
                    <Link
                      href={isCustomer ? "/customer/dashboard" : "/dashboard"}
                      className="text-sm font-medium text-gray-600 hover:text-green-800"
                    >
                      Minha Conta
                    </Link>
                    <Link
                      href={
                        isCustomer ? "/api/customer/logout" : "/api/auth/logout"
                      }
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Sair
                    </Link>
                  </>
                ) : (
                  <Link href="/customer/login">
                    <Button className="w-full bg-green-800 hover:bg-green-700">
                      Entrar
                    </Button>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
