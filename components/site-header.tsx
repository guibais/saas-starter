import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu } from "lucide-react";
import { getUser } from "@/lib/db/queries";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CartButton } from "@/components/cart/cart-button";
import { CartSheet } from "@/components/cart/cart-sheet";

export async function SiteHeader() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-2xl text-green-900">
            Tudo Fresco
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/products"
              className="text-sm font-medium text-gray-600 hover:text-green-800"
            >
              Frutas
            </Link>
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
          <CartButton />
          {user ? (
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
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
                  href="/products"
                  className="text-sm font-medium text-gray-600 hover:text-green-800"
                >
                  Frutas
                </Link>
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
                {user ? (
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-gray-600 hover:text-green-800"
                  >
                    Minha Conta
                  </Link>
                ) : (
                  <Link href="/login">
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
      <CartSheet />
    </header>
  );
}
