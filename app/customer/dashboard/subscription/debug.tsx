"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function SubscriptionDebug({ userId }: { userId: number }) {
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Verifica a sessão atual
      const sessionResponse = await fetch("/api/debug", {
        cache: "no-store",
        next: { revalidate: 0 },
      });
      const sessionData = await sessionResponse.json();

      // Verifica diagnóstico da assinatura
      const subscriptionResponse = await fetch("/api/debug/subscription", {
        cache: "no-store",
        next: { revalidate: 0 },
      });
      const subscriptionData = await subscriptionResponse.json();

      // Verifica API direta de assinatura
      const directApiResponse = await fetch(
        `/api/subscriptions/customer/${userId}`,
        {
          cache: "no-store",
          next: { revalidate: 0 },
        }
      );
      let directApiData = null;
      let directApiStatus = directApiResponse.status;

      try {
        directApiData = await directApiResponse.json();
      } catch (e) {
        console.error("Erro ao parsear resposta da API:", e);
      }

      setDebugData({
        timestamp: new Date().toISOString(),
        userId,
        session: sessionData,
        subscriptionDiagnostic: subscriptionData,
        directApiCall: {
          status: directApiStatus,
          data: directApiData,
        },
      });
    } catch (error) {
      console.error("Erro na depuração:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, [userId]);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle size={18} />
            Erro na depuração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={fetchDebugData}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />{" "}
                Verificando...
              </>
            ) : (
              "Tentar novamente"
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-700">
          Diagnóstico da Assinatura
        </CardTitle>
        <CardDescription>
          Verificação técnica do funcionamento da API de assinaturas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {debugData ? (
          <div className="overflow-auto max-h-96 text-xs">
            <pre className="whitespace-pre-wrap bg-blue-100 p-3 rounded">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="flex justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={fetchDebugData}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Atualizando...
            </>
          ) : (
            "Atualizar diagnóstico"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
