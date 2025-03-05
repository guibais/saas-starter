"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useSubscriptionStore } from "@/lib/state/subscriptionStore";
import { Loader2, Check, ArrowRight, ShoppingCart } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
  productType: string;
  stockQuantity: number;
  isAvailable: boolean;
}

interface FixedItem {
  id: number;
  planId: number;
  productId: number;
  quantity: number;
  product: Product;
}

interface CustomizableRule {
  id: number;
  planId: number;
  productType: string;
  minQuantity: number;
  maxQuantity: number;
}

interface Plan {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  price: string;
  imageUrl: string | null;
  fixedItems: FixedItem[];
  customizableRules: CustomizableRule[];
}

export default function PlanDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  // Acessar o slug diretamente do objeto params
  // Isso será substituído por React.use() em versões futuras do Next.js
  const { slug } = params;

  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  const {
    customizableItems,
    addCustomizationItem,
    removeCustomizationItem,
    updateCustomizationQuantity,
    isCustomizationValid,
    getValidationErrors,
    setSelectedPlan,
    setCustomizationRules,
  } = useSubscriptionStore();

  // Verificar se o usuário adicionou pelo menos um item à cesta
  const hasCustomizedBasket = () => {
    return isCustomizationValid();
  };

  // Buscar detalhes do plano
  useEffect(() => {
    const fetchPlanDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/plans/slug/${slug}`);
        if (!response.ok) {
          throw new Error("Falha ao carregar detalhes do plano");
        }
        const data = await response.json();
        setPlan(data);
        setSelectedPlan(data);

        // Configurar regras de customização
        if (data.customizableRules && data.customizableRules.length > 0) {
          setCustomizationRules(data.customizableRules);
        }

        // Buscar produtos disponíveis para customização
        const productsResponse = await fetch("/api/products?available=true");
        if (!productsResponse.ok) {
          throw new Error("Falha ao carregar produtos disponíveis");
        }
        const productsData = await productsResponse.json();

        // Verificar se a resposta contém a propriedade 'products'
        const productsArray = productsData.products || productsData;

        // Garantir que productsArray seja um array
        if (Array.isArray(productsArray)) {
          setAvailableProducts(productsArray);
        } else {
          console.error("Formato de dados de produtos inválido:", productsData);
          setAvailableProducts([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        toast.error("Não foi possível carregar os detalhes do plano");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanDetails();
  }, [slug, setSelectedPlan, setCustomizationRules]);

  const handleAddToCustomization = (product: Product) => {
    addCustomizationItem(product as any, 1);
  };

  const handleRemoveFromCustomization = (productId: number) => {
    removeCustomizationItem(productId);
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    updateCustomizationQuantity(productId, quantity);
  };

  const handleProceedToCheckout = () => {
    if (!hasCustomizedBasket()) {
      toast.error("Por favor, complete a personalização da sua cesta");
      // Focar na aba de customização
      setActiveTab("customize");
      return;
    }

    if (!isCustomizationValid()) {
      const errors = getValidationErrors();
      toast.error(errors.join("\n"));
      return;
    }

    // Redirecionar para o checkout com o slug do plano como parâmetro
    router.push(`/checkout/subscription?plan=${slug}`);
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  const getNormalProducts = () => {
    if (!availableProducts || !Array.isArray(availableProducts) || !plan) {
      return [];
    }

    // Obter IDs de produtos que já são itens fixos
    const fixedProductIds = plan.fixedItems.map((item) => item.product.id);

    // Filtrar produtos normais, excluindo os que já são itens fixos
    return availableProducts
      .filter((p) => p.productType === "normal")
      .filter((p) => !fixedProductIds.includes(p.id));
  };

  const getExoticProducts = () => {
    if (!availableProducts || !Array.isArray(availableProducts) || !plan) {
      return [];
    }

    // Obter IDs de produtos que já são itens fixos
    const fixedProductIds = plan.fixedItems.map((item) => item.product.id);

    // Filtrar produtos exóticos, excluindo os que já são itens fixos
    return availableProducts
      .filter((p) => p.productType === "exotic")
      .filter((p) => !fixedProductIds.includes(p.id));
  };

  const getNormalRule = () => {
    return plan?.customizableRules?.find((r) => r.productType === "normal");
  };

  const getExoticRule = () => {
    return plan?.customizableRules?.find((r) => r.productType === "exotic");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Carregando detalhes do plano...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-500 mb-4">
          {error || "Não foi possível carregar os detalhes do plano"}
        </p>
        <Button onClick={() => router.push("/plans")}>
          Voltar para Planos
        </Button>
      </div>
    );
  }

  const normalRule = getNormalRule();
  const exoticRule = getExoticRule();
  const normalItems = customizableItems.filter(
    (item) => item.product.productType === "normal"
  );
  const exoticItems = customizableItems.filter(
    (item) => item.product.productType === "exotic"
  );
  const normalCount = normalItems.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const exoticCount = exoticItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-2">{plan.name}</h1>
          <p className="text-muted-foreground mb-6">{plan.description}</p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="customize">Personalizar</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>O que está incluído</CardTitle>
                  <CardDescription>
                    Itens fixos que vêm em todas as entregas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {plan.fixedItems.length === 0 ? (
                    <p className="text-muted-foreground">
                      Este plano não possui itens fixos.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Quantidade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plan.fixedItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.product.name}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Itens Personalizáveis</CardTitle>
                  <CardDescription>
                    Você pode escolher estes itens de acordo com suas
                    preferências
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {normalRule && (
                      <div>
                        <h3 className="font-medium mb-2">Frutas Regulares</h3>
                        <p className="text-sm text-muted-foreground">
                          Escolha entre {normalRule.minQuantity} e{" "}
                          {normalRule.maxQuantity} itens
                        </p>
                      </div>
                    )}

                    {exoticRule && (
                      <div>
                        <h3 className="font-medium mb-2">Frutas Exóticas</h3>
                        <p className="text-sm text-muted-foreground">
                          Escolha entre {exoticRule.minQuantity} e{" "}
                          {exoticRule.maxQuantity} itens
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => setActiveTab("customize")}
                    className="w-full"
                  >
                    Personalizar Minha Cesta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="customize" className="space-y-6">
              {plan.fixedItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Itens Fixos Incluídos</CardTitle>
                    <CardDescription>
                      Estes itens já estão incluídos no seu plano e não podem
                      ser alterados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Quantidade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plan.fixedItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.product.name}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {normalRule && (
                <Card>
                  <CardHeader>
                    <CardTitle>Frutas Regulares</CardTitle>
                    <CardDescription>
                      Escolha entre {normalRule.minQuantity} e{" "}
                      {normalRule.maxQuantity} itens
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {getNormalProducts().map((product) => {
                        const customItem = normalItems.find(
                          (item) => item.product.id === product.id
                        );
                        const isSelected = !!customItem;

                        return (
                          <Card key={product.id} className="overflow-hidden">
                            {product.imageUrl && (
                              <div className="relative h-40 w-full">
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  fill
                                  style={{ objectFit: "cover" }}
                                />
                              </div>
                            )}
                            <CardContent className="p-4">
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                {formatCurrency(product.price)}
                              </p>

                              {!isSelected ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() =>
                                    handleAddToCustomization(product)
                                  }
                                  disabled={
                                    normalCount >=
                                    (normalRule?.maxQuantity || 0)
                                  }
                                >
                                  Adicionar
                                </Button>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        product.id,
                                        Math.max(
                                          1,
                                          (customItem?.quantity || 1) - 1
                                        )
                                      )
                                    }
                                    disabled={customItem?.quantity === 1}
                                  >
                                    -
                                  </Button>
                                  <span>{customItem?.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        product.id,
                                        (customItem?.quantity || 1) + 1
                                      )
                                    }
                                  >
                                    +
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() =>
                                      handleRemoveFromCustomization(product.id)
                                    }
                                  >
                                    ×
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      <Badge
                        variant={
                          normalCount < (normalRule?.minQuantity || 0)
                            ? "destructive"
                            : normalCount > (normalRule?.maxQuantity || 0)
                            ? "destructive"
                            : "default"
                        }
                      >
                        {normalCount} de {normalRule.minQuantity}-
                        {normalRule.maxQuantity} itens selecionados
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {exoticRule && (
                <Card>
                  <CardHeader>
                    <CardTitle>Frutas Exóticas</CardTitle>
                    <CardDescription>
                      Escolha entre {exoticRule.minQuantity} e{" "}
                      {exoticRule.maxQuantity} itens
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {getExoticProducts().map((product) => {
                        const customItem = exoticItems.find(
                          (item) => item.product.id === product.id
                        );
                        const isSelected = !!customItem;

                        return (
                          <Card key={product.id} className="overflow-hidden">
                            {product.imageUrl && (
                              <div className="relative h-40 w-full">
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  fill
                                  style={{ objectFit: "cover" }}
                                />
                              </div>
                            )}
                            <CardContent className="p-4">
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                {formatCurrency(product.price)}
                              </p>

                              {!isSelected ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() =>
                                    handleAddToCustomization(product)
                                  }
                                  disabled={
                                    exoticCount >=
                                    (exoticRule?.maxQuantity || 0)
                                  }
                                >
                                  Adicionar
                                </Button>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        product.id,
                                        Math.max(
                                          1,
                                          (customItem?.quantity || 1) - 1
                                        )
                                      )
                                    }
                                    disabled={customItem?.quantity === 1}
                                  >
                                    -
                                  </Button>
                                  <span>{customItem?.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        product.id,
                                        (customItem?.quantity || 1) + 1
                                      )
                                    }
                                  >
                                    +
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() =>
                                      handleRemoveFromCustomization(product.id)
                                    }
                                  >
                                    ×
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      <Badge
                        variant={
                          exoticCount < (exoticRule?.minQuantity || 0)
                            ? "destructive"
                            : exoticCount > (exoticRule?.maxQuantity || 0)
                            ? "destructive"
                            : "default"
                        }
                      >
                        {exoticCount} de {exoticRule.minQuantity}-
                        {exoticRule.maxQuantity} itens selecionados
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo do Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Preço mensal:</span>
                <span className="text-xl font-bold">
                  {formatCurrency(plan.price)}
                </span>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Itens fixos:</h3>
                <ul className="space-y-1 text-sm">
                  {plan.fixedItems.length === 0 ? (
                    <li className="text-muted-foreground">Nenhum item fixo</li>
                  ) : (
                    plan.fixedItems.map((item) => (
                      <li key={item.id} className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        {item.quantity}x {item.product.name}
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Itens personalizáveis:</h3>
                <ul className="space-y-1 text-sm">
                  {normalRule && (
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      {normalRule.minQuantity}-{normalRule.maxQuantity} frutas
                      regulares
                    </li>
                  )}
                  {exoticRule && (
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      {exoticRule.minQuantity}-{exoticRule.maxQuantity} frutas
                      exóticas
                    </li>
                  )}
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Benefícios:</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Entrega semanal
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Frutas frescas e selecionadas
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Cancele quando quiser
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                className="w-full"
                size="lg"
                onClick={handleProceedToCheckout}
                disabled={!isCustomizationValid()}
              >
                Assinar Agora
                <ShoppingCart className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Ao assinar, você concorda com nossos termos de serviço e
                política de privacidade.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
