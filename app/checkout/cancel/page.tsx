"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { XCircle, Loader2 } from "lucide-react";

function CheckoutCancelContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subscriptionId = searchParams.get("subscription_id");

  useEffect(() => {
    const cancelSubscription = async () => {
      if (!subscriptionId) {
        setError("ID da assinatura não encontrado");
        setIsLoading(false);
        return;
      }

      try {
        // Cancelar a assinatura pendente
        const response = await fetch("/api/checkout/cancel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriptionId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao cancelar assinatura");
        }
      } catch (error) {
        console.error("Erro ao cancelar assinatura:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao cancelar sua assinatura"
        );
      } finally {
        setIsLoading(false);
      }
    };

    cancelSubscription();
  }, [subscriptionId]);

  return (
    <div className="container max-w-4xl py-12">
      <Card className="mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Pagamento Cancelado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <div className="flex flex-col items-center space-y-4 py-8 text-center">
            <div className="rounded-full bg-amber-100 p-3">
              <XCircle className="h-12 w-12 text-amber-600" />
            </div>
            <h3 className="text-2xl font-medium text-amber-700">
              Pagamento não concluído
            </h3>
            <p className="max-w-md text-gray-600">
              {error ||
                "Seu pagamento foi cancelado. Nenhum valor foi cobrado."}
            </p>
            <div className="mt-8 flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Button asChild>
                <Link href="/plans">Ver planos disponíveis</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Voltar para a Página Inicial</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-4xl py-12">
          <Card className="mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Pagamento Cancelado</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              <div className="flex flex-col items-center space-y-4 py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg">Carregando...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <CheckoutCancelContent />
    </Suspense>
  );
}
