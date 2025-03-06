"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Home, ShoppingBag, Calendar } from "lucide-react";

// Loading fallback component
function CheckoutSuccessLoading() {
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-md mx-auto">
        <Card className="border-green-200">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 animate-pulse" />
            </div>
            <div className="h-8 w-48 bg-gray-200 animate-pulse mx-auto mb-2" />
            <div className="h-4 w-64 bg-gray-200 animate-pulse mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <div className="h-5 w-32 bg-gray-200 animate-pulse" />
              <div className="h-4 w-56 bg-gray-200 animate-pulse mt-2" />
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="h-5 w-40 bg-gray-200 animate-pulse" />
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="h-5 w-5 bg-gray-200 animate-pulse mr-2" />
                  <div className="h-4 w-full bg-gray-200 animate-pulse" />
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 bg-gray-200 animate-pulse mr-2" />
                  <div className="h-4 w-full bg-gray-200 animate-pulse" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="h-10 w-full bg-green-100 animate-pulse rounded-md" />
            <div className="h-10 w-full bg-gray-200 animate-pulse rounded-md" />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Main component content
function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  useEffect(() => {
    if (!type || !id) {
      router.push("/");
    }
  }, [type, id, router]);

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-md mx-auto">
        <Card className="border-green-200">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Pedido Confirmado!</CardTitle>
            <CardDescription>
              {type === "subscription"
                ? "Sua assinatura foi criada com sucesso."
                : "Seu pedido foi realizado com sucesso."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium">
                {type === "subscription"
                  ? `Assinatura #${id}`
                  : `Pedido #${id}`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {type === "subscription"
                  ? "Você receberá um email com os detalhes da sua assinatura."
                  : "Você receberá um email com os detalhes do seu pedido."}
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-medium">Próximos passos:</h3>

              {type === "subscription" ? (
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <Calendar className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                    <span>
                      Sua primeira entrega será agendada em breve. Você receberá
                      uma notificação com a data exata.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <ShoppingBag className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                    <span>
                      Você pode gerenciar sua assinatura a qualquer momento
                      através do seu painel de controle.
                    </span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <Calendar className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                    <span>
                      Seu pedido será preparado e enviado em breve. Você
                      receberá atualizações sobre o status da entrega.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <ShoppingBag className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                    <span>
                      Você pode acompanhar o status do seu pedido através do seu
                      histórico de pedidos.
                    </span>
                  </li>
                </ul>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link
                href={
                  type === "subscription"
                    ? "/customer/dashboard/subscription"
                    : "/customer/dashboard/orders"
                }
              >
                {type === "subscription"
                  ? "Ver Minha Assinatura"
                  : "Ver Meus Pedidos"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar para a Página Inicial
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessLoading />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
