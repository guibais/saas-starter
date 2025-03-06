"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function TesteCheckout() {
  const [planId, setPlanId] = useState("1");
  const [customizableItems, setCustomizableItems] = useState(
    JSON.stringify(
      [
        {
          product: {
            id: 2,
            name: "Banana Nanica",
            price: "0",
            productType: "normal",
          },
          quantity: 1,
        },
        {
          product: {
            id: 1,
            name: "Maça",
            price: "0",
            productType: "normal",
          },
          quantity: 2,
        },
      ],
      null,
      2
    )
  );
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [endpoint, setEndpoint] = useState("/api/checkout/subscription/debug");

  const handleTest = async () => {
    try {
      setIsLoading(true);
      setResponse("Processando...");

      const parsedItems = JSON.parse(customizableItems);

      const body = {
        planId: parseInt(planId),
        customizableItems: parsedItems,
      };

      console.log("Enviando dados:", body);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Erro ao testar:", error);
      setResponse(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-6">Teste de Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Teste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="planId">ID do Plano</Label>
              <Input
                id="planId"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="customizableItems">
                Itens Personalizados (JSON)
              </Label>
              <Textarea
                id="customizableItems"
                value={customizableItems}
                onChange={(e) => setCustomizableItems(e.target.value)}
                rows={10}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleTest}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Testar Endpoint"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px] text-sm">
              {response || "Aguardando teste..."}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
