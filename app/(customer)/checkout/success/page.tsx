"use client";

import { useState, useEffect } from "react";
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

export default function CheckoutSuccessPage() {
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
                    ? "/dashboard/subscriptions"
                    : "/dashboard/orders"
                }
              >
                {type === "subscription"
                  ? "Ver Minhas Assinaturas"
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
