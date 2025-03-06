"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/debug");
      if (!response.ok) {
        throw new Error("Falha ao carregar informações de diagnóstico");
      }
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Página de Diagnóstico</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações de Sessão</CardTitle>
            <CardDescription>
              Detalhes sobre cookies e estado da sessão
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center">
                <p>Carregando...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                <p>{error}</p>
                <Button
                  onClick={fetchDebugInfo}
                  variant="outline"
                  className="mt-2"
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              debugInfo && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Cookies</h3>
                    <ul className="list-disc pl-5">
                      {debugInfo.cookies.map((cookie: any, index: number) => (
                        <li key={index}>
                          {cookie.name}{" "}
                          {cookie.name === "admin_session" &&
                          debugInfo.hasSessionCookie
                            ? "(presente)"
                            : ""}
                        </li>
                      ))}
                    </ul>
                    {debugInfo.cookies.length === 0 && (
                      <p className="text-yellow-600">
                        Nenhum cookie encontrado
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Estado da Sessão</h3>
                    {debugInfo.sessionValid ? (
                      <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md">
                        <p>Sessão válida</p>
                        <p>
                          <strong>Usuário ID:</strong>{" "}
                          {debugInfo.session.userId}
                        </p>
                        <p>
                          <strong>Função:</strong> {debugInfo.session.userRole}
                        </p>
                        <p>
                          <strong>Expira em:</strong>{" "}
                          {new Date(debugInfo.session.expires).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
                        <p>Sessão inválida ou não encontrada</p>
                        <p>
                          <strong>Cookie de sessão presente:</strong>{" "}
                          {debugInfo.hasSessionCookie ? "Sim" : "Não"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center mt-4">
          <Button onClick={fetchDebugInfo} disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar Informações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
