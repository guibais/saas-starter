"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Check, ArrowRight } from "lucide-react";

interface Plan {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  price: string;
  imageUrl: string | null;
  fixedItems: any[];
  customizableRules: any[];
}

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "comparison">("cards");

  // Buscar planos
  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/plans");
        if (!response.ok) {
          throw new Error("Falha ao carregar planos");
        }
        const data = await response.json();

        // Verificar se a resposta contém a propriedade 'plans'
        const plansData = data.plans || data;

        // Garantir que plansData seja um array
        if (Array.isArray(plansData)) {
          setPlans(plansData);
        } else {
          console.error("Formato de dados inválido:", data);
          setPlans([]);
          setError("Formato de dados inválido");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        toast.error("Não foi possível carregar os planos disponíveis");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  const getNormalRule = (plan: Plan) => {
    if (!plan.customizableRules || !Array.isArray(plan.customizableRules)) {
      return { minQuantity: 0, maxQuantity: 0 };
    }
    return (
      plan.customizableRules.find((r) => r.productType === "normal") || {
        minQuantity: 0,
        maxQuantity: 0,
      }
    );
  };

  const getExoticRule = (plan: Plan) => {
    if (!plan.customizableRules || !Array.isArray(plan.customizableRules)) {
      return { minQuantity: 0, maxQuantity: 0 };
    }
    return (
      plan.customizableRules.find((r) => r.productType === "exotic") || {
        minQuantity: 0,
        maxQuantity: 0,
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Carregando planos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => router.refresh()}>Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Planos de Assinatura</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Escolha o plano que melhor se adapta às suas necessidades e receba
          frutas frescas e selecionadas diretamente na sua porta.
        </p>
      </div>

      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as "cards" | "comparison")}
        className="mb-8"
      >
        <div className="flex justify-center mb-6">
          <TabsList>
            <TabsTrigger value="cards">Cartões</TabsTrigger>
            <TabsTrigger value="comparison">Comparação</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="cards">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col h-full">
                {plan.imageUrl && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={plan.imageUrl}
                      alt={plan.name}
                      fill
                      style={{ objectFit: "cover" }}
                      className="rounded-t-lg"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-center mb-6">
                    <span className="text-3xl font-bold">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Inclui:</h3>
                      <ul className="space-y-2">
                        {plan.fixedItems.length > 0 && (
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                            <span>
                              {plan.fixedItems.length}{" "}
                              {plan.fixedItems.length === 1
                                ? "item fixo"
                                : "itens fixos"}{" "}
                              incluídos
                            </span>
                          </li>
                        )}

                        {getNormalRule(plan) && (
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                            <span>
                              {getNormalRule(plan).minQuantity}-
                              {getNormalRule(plan).maxQuantity} frutas regulares
                              personalizáveis
                            </span>
                          </li>
                        )}

                        {getExoticRule(plan) && (
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                            <span>
                              {getExoticRule(plan).minQuantity}-
                              {getExoticRule(plan).maxQuantity} frutas exóticas
                              personalizáveis
                            </span>
                          </li>
                        )}

                        <li className="flex items-start">
                          <Check className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                          <span>Entrega semanal</span>
                        </li>

                        <li className="flex items-start">
                          <Check className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                          <span>Cancele quando quiser</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/plans/${plan.slug}`}>
                      Escolher Plano
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b">Plano</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center p-4 border-b">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-4 border-b font-medium">Preço Mensal</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4 border-b">
                      {formatCurrency(plan.price)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b font-medium">Itens Fixos</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4 border-b">
                      {plan.fixedItems.length} itens
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b font-medium">Frutas Regulares</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4 border-b">
                      {getNormalRule(plan)
                        ? `${getNormalRule(plan).minQuantity}-${
                            getNormalRule(plan).maxQuantity
                          } itens`
                        : "Não inclui"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b font-medium">Frutas Exóticas</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4 border-b">
                      {getExoticRule(plan)
                        ? `${getExoticRule(plan).minQuantity}-${
                            getExoticRule(plan).maxQuantity
                          } itens`
                        : "Não inclui"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b font-medium">Entrega</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4 border-b">
                      Semanal
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b font-medium">Cancelamento</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4 border-b">
                      A qualquer momento
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4"></td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4">
                      <Button asChild>
                        <Link href={`/plans/${plan.slug}`}>Escolher</Link>
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center mt-12">
        <h2 className="text-2xl font-bold mb-4">Ainda com dúvidas?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
          Entre em contato conosco para saber mais sobre nossos planos de
          assinatura e como podemos atender às suas necessidades.
        </p>
        <Button variant="outline" asChild>
          <Link href="/contact">Fale Conosco</Link>
        </Button>
      </div>
    </div>
  );
}
