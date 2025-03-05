"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSubscriptionStore } from "@/lib/state/subscriptionStore";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Esquema de validação para o formulário de checkout
const checkoutFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  address: z.string().min(10, "Endereço deve ter pelo menos 10 caracteres"),
  deliveryInstructions: z.string().optional(),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

// Interface para os itens fixos do plano
interface FixedItem {
  id: number;
  product: {
    name: string;
  };
  quantity: number;
}

// Interface para o plano selecionado - ajustada para corresponder ao objeto real
interface SelectedPlan {
  id: number;
  name: string;
  description: string | null;
  price: string;
  slug: string;
  imageUrl: string | null;
  stripeProductId: string | null;
  stripePriceId: string | null;
  createdAt: Date;
  updatedAt: Date;
  fixedItems?: FixedItem[]; // Tornando opcional para evitar erros
}

interface CustomizableItem {
  product: {
    id: number;
    name: string;
    price: string;
  };
  quantity: number;
}

export default function SubscriptionCheckoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [customizableItems, setCustomizableItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    message: string;
    primaryAction: {
      label: string;
      href: string;
    };
    secondaryAction: {
      label: string;
      href: string;
    };
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { getCustomizationTotal, isCustomizationValid, clearCustomization } =
    useSubscriptionStore();

  // Formulário com validação
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      deliveryInstructions: "",
    },
  });

  // Buscar o plano selecionado com base no parâmetro de query
  useEffect(() => {
    const fetchSelectedPlan = async () => {
      try {
        setIsLoading(true);

        // Obter o slug do plano da URL
        const urlParams = new URLSearchParams(window.location.search);
        const planSlug = urlParams.get("plan");

        if (!planSlug) {
          setError("Nenhum plano selecionado");
          return;
        }

        // Buscar detalhes do plano
        const response = await fetch(`/api/plans/slug/${planSlug}`);

        if (!response.ok) {
          throw new Error("Falha ao carregar o plano");
        }

        const planData = await response.json();
        setSelectedPlan(planData);

        // Inicializar os itens customizáveis se existirem
        if (
          planData.customizableItems &&
          planData.customizableItems.length > 0
        ) {
          setCustomizableItems(planData.customizableItems);
        }
      } catch (error) {
        console.error("Erro ao buscar plano:", error);
        setError("Erro ao carregar o plano selecionado");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSelectedPlan();
  }, []);

  // Verificar autenticação e carregar dados do usuário
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthLoading(true);
        // Verificar se é um cliente autenticado
        const authResponse = await fetch("/api/customer/check-auth");
        const authData = await authResponse.json();

        if (authData.authenticated) {
          // Buscar dados do cliente
          const userResponse = await fetch("/api/customer/user");
          const userData = await userResponse.json();

          if (userData) {
            setIsAuthenticated(true);
            setUserData(userData);

            // Preencher o formulário com os dados do usuário
            form.setValue("name", userData.name || "");
            form.setValue("email", userData.email || "");
            form.setValue("phone", userData.phone || "");
            form.setValue("address", userData.address || "");
          }
        } else {
          setIsAuthenticated(false);
          setUserData(null);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsAuthenticated(false);
        setUserData(null);
      } finally {
        setAuthLoading(false);
      }
    };

    // Verificar se há um plano selecionado
    if (!selectedPlan) {
      setValidationError(
        "Selecione um plano antes de prosseguir com o checkout"
      );
      return;
    }

    checkAuth();
    setIsLoading(false);
  }, [router, selectedPlan, form]);

  // Verificar se há um plano selecionado
  useEffect(() => {
    setIsLoading(authLoading);

    if (!authLoading) {
      if (!selectedPlan) {
        setValidationError("Nenhum plano selecionado");
        return;
      }

      if (!isCustomizationValid()) {
        setValidationError("Sua personalização não está completa");
        return;
      }
    }
  }, [authLoading, selectedPlan, isCustomizationValid]);

  // Função para processar o checkout
  const onSubmit = async (data: CheckoutFormValues) => {
    if (!selectedPlan) {
      setValidationError("Nenhum plano selecionado");
      return;
    }

    if (!isCustomizationValid()) {
      setValidationError("Por favor, complete a personalização do seu plano");
      return;
    }

    try {
      setIsSubmitting(true);

      // Preparar os dados para o checkout
      const checkoutData = {
        planId: selectedPlan.id,
        customizableItems,
        userDetails: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          password: data.password,
          deliveryInstructions: data.deliveryInstructions,
        },
        // Adicionar flag para criar conta apenas se o usuário não estiver autenticado
        createAccount: !isAuthenticated,
      };

      // Enviar para a API
      const response = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao processar o checkout");
      }

      // Limpar o estado de customização
      clearCustomization();

      // Mostrar um alerta de sucesso com botões para navegação
      setSuccessMessage({
        title: "Assinatura criada com sucesso!",
        message: isAuthenticated
          ? "Sua assinatura foi criada e já está disponível no seu painel."
          : "Sua conta foi criada. Faça login para acessar sua assinatura.",
        primaryAction: {
          label: isAuthenticated ? "Ver minhas assinaturas" : "Fazer login",
          href: isAuthenticated
            ? "/customer/dashboard/subscription"
            : "/customer/login",
        },
        secondaryAction: {
          label: "Voltar para os planos",
          href: "/plans",
        },
      });
    } catch (error: any) {
      console.error("Erro no checkout:", error);
      setError(error.message || "Erro ao processar assinatura");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-5xl py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <p>{error}</p>
            <div className="flex gap-4 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setError(null)}
              >
                Fechar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/plans")}>
          Voltar para os planos
        </Button>
      </div>
    );
  }

  // Mostrar mensagem de sucesso com botões de navegação
  if (successMessage) {
    return (
      <div className="container max-w-5xl py-8">
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>{successMessage.title}</AlertTitle>
          <AlertDescription>{successMessage.message}</AlertDescription>
        </Alert>
        <div className="flex gap-4 mt-6">
          <Button
            onClick={() => router.push(successMessage.primaryAction.href)}
          >
            {successMessage.primaryAction.label}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(successMessage.secondaryAction.href)}
          >
            {successMessage.secondaryAction.label}
          </Button>
        </div>
      </div>
    );
  }

  // Garantir que temos acesso às propriedades necessárias do plano
  if (!selectedPlan) {
    return (
      <div className="container max-w-5xl py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>Nenhum plano selecionado</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/plans")}>Escolher um plano</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-3xl font-bold mb-6">Finalizar Assinatura</h1>

      {validationError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de validação</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <p>{validationError}</p>
            <div className="flex gap-4 mt-2">
              {selectedPlan && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/plans/${selectedPlan.slug}`)}
                >
                  Voltar para personalização
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/plans")}
              >
                Ver todos os planos
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  {isAuthenticated && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Suas informações foram preenchidas automaticamente com
                      base no seu perfil.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Seu nome completo"
                            {...field}
                            disabled={isAuthenticated}
                            className={isAuthenticated ? "bg-gray-100" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="seu@email.com"
                              type="email"
                              {...field}
                              disabled={isAuthenticated}
                              className={isAuthenticated ? "bg-gray-100" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(00) 00000-0000"
                              {...field}
                              disabled={isAuthenticated}
                              className={isAuthenticated ? "bg-gray-100" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço Completo</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Rua, número, bairro, cidade, estado, CEP"
                            {...field}
                            disabled={isAuthenticated}
                            className={isAuthenticated ? "bg-gray-100" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo de senha apenas para usuários não autenticados */}
                  {!isAuthenticated && (
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Crie uma senha para sua conta"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Uma conta será criada automaticamente para você
                            acompanhar suas assinaturas.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="deliveryInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instruções de Entrega (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Instruções adicionais para entrega"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Finalizar Assinatura"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPlan && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Plano:</span>
                    <span>{selectedPlan.name}</span>
                  </div>

                  <Separator />

                  {selectedPlan.fixedItems &&
                    selectedPlan.fixedItems.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-medium">Itens inclusos:</span>
                        <ul className="text-sm space-y-1">
                          {selectedPlan.fixedItems.map((item: FixedItem) => (
                            <li key={item.id} className="flex justify-between">
                              <span>
                                {item.product.name} x {item.quantity}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">Itens personalizados:</h3>
                    <ul className="space-y-1 text-sm">
                      {customizableItems.map((item: CustomizableItem) => (
                        <li
                          key={item.product.id}
                          className="flex justify-between"
                        >
                          <span>{item.product.name}</span>
                          <span>x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>
                      R$ {getCustomizationTotal().toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
