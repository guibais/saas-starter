"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function R2DiagnosticPage() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testR2Connection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/r2/test");
      const data = await response.json();
      setTestResults(data);

      if (data.connectionTest?.success) {
        toast({
          title: "Conexão estabelecida!",
          description: "A conexão com o R2 foi bem-sucedida.",
          variant: "default",
        });
      } else {
        toast({
          title: "Falha na conexão",
          description:
            "Houve um problema na conexão com o R2. Verifique os logs.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao testar R2:", error);
      toast({
        title: "Erro no teste",
        description: "Não foi possível realizar o teste de conexão com o R2.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Diagnóstico do R2</h1>
        <p className="text-muted-foreground">
          Verificar a configuração e conectividade com o Cloudflare R2
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico do Cloudflare R2</CardTitle>
            <CardDescription>
              Teste a conectividade com o R2 e verifique as configurações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Button onClick={testR2Connection} disabled={isLoading}>
                {isLoading ? "Testando..." : "Testar conexão com R2"}
              </Button>
            </div>

            {testResults && (
              <div className="mt-6 space-y-4">
                <h3 className="font-medium text-lg">Resultados do teste</h3>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Variáveis de ambiente</h4>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(testResults.envVars, null, 2)}
                  </pre>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Teste de conexão</h4>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(testResults.connectionTest, null, 2)}
                  </pre>
                </div>

                {testResults.buckets && (
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
                    <h4 className="font-medium mb-2">Buckets disponíveis</h4>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(testResults.buckets, null, 2)}
                    </pre>
                  </div>
                )}

                {testResults.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                    <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">
                      Erro
                    </h4>
                    <pre className="text-xs overflow-auto text-red-600 dark:text-red-400">
                      {testResults.error}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
