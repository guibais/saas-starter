"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/state/cartStore";
import { usePaymentStore } from "@/lib/state/paymentStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();
  const { resetPaymentState, sessionId } = usePaymentStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    const processCheckoutSuccess = async () => {
      try {
        // Obter o ID da sessão da URL ou do estado
        const sessionIdFromUrl = searchParams.get("session_id");
        const finalSessionId = sessionIdFromUrl || sessionId;

        if (!finalSessionId) {
          setError("ID da sessão não encontrado");
          setIsLoading(false);
          return;
        }

        // Chamar a API para processar o pedido
        const response = await fetch(
          `/api/stripe/checkout/order?session_id=${finalSessionId}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao processar o pedido");
        }

        const data = await response.json();
        setOrderNumber(data.orderNumber || "N/A");

        // Limpar o carrinho e o estado de pagamento
        clearCart();
        resetPaymentState();
      } catch (err) {
        console.error("Erro ao processar sucesso do checkout:", err);
        setError(
          err instanceof Error ? err.message : "Erro ao processar o pedido"
        );
      } finally {
        setIsLoading(false);
      }
    };

    processCheckoutSuccess();
  }, [searchParams, sessionId, clearCart, resetPaymentState]);

  if (isLoading) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 text-green-800 animate-spin mb-8" />
        <h1 className="text-2xl font-bold mb-2">Processando seu pedido</h1>
        <p className="text-muted-foreground">
          Aguarde enquanto confirmamos seu pagamento...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">
              Ocorreu um erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              Se você acredita que seu pagamento foi processado, entre em
              contato com nosso suporte.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/products">Voltar para produtos</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-20">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle2 className="h-16 w-16 text-green-800 mx-auto mb-4" />
          <CardTitle className="text-2xl">Pedido Confirmado!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6">
            Seu pedido #{orderNumber} foi confirmado e está sendo preparado.
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            Você receberá um e-mail com os detalhes do seu pedido.
          </p>
          <p className="text-sm text-muted-foreground">
            Obrigado por comprar na Tudo Fresco!
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full bg-green-800 hover:bg-green-700">
            <Link href="/dashboard/orders">Ver Meus Pedidos</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continuar Comprando
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
