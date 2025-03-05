"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, Loader2, ShoppingCart } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useSubscriptionStore } from "@/lib/state/subscriptionStore";

// Schema de validação para o formulário
const checkoutFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  address: z.string().min(10, "Endereço deve ser completo"),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .optional(),
  deliveryInstructions: z.string().optional(),
  // Campos de cartão de crédito
  cardNumber: z
    .string()
    .min(13, "Número do cartão inválido")
    .max(19, "Número do cartão inválido"),
  cardName: z
    .string()
    .min(3, "Nome no cartão deve ter pelo menos 3 caracteres"),
  cardExpiry: z
    .string()
    .regex(
      /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
      "Data de validade inválida (MM/AA)"
    ),
  cardCvc: z.string().min(3, "CVC inválido").max(4, "CVC inválido"),
});

// Função para criar o esquema de validação com base no estado de autenticação
const createValidationSchema = (isAuthenticated: boolean) => {
  return isAuthenticated
    ? checkoutFormSchema
    : checkoutFormSchema.refine((data) => !!data.password, {
        message: "Senha é obrigatória para criar uma conta",
        path: ["password"],
      });
};

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

interface FixedItem {
  id: number;
  product: {
    name: string;
    productType?: string;
  };
  quantity: number;
}

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
  fixedItems?: FixedItem[];
  customizableRules?: any[];
}

interface CustomizableItem {
  product: {
    id: number;
    name: string;
    price: string;
    productType?: string;
  };
  quantity: number;
}

export default function SubscriptionCheckoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    message: string;
    primaryAction: { label: string; href: string };
    secondaryAction: { label: string; href: string };
  } | null>(null);

  // Get customizable items from store
  const { customizableItems, getCustomizationTotal } = useSubscriptionStore();

  // Log customizable items for debugging
  useEffect(() => {
    console.log("Customizable items in checkout:", customizableItems);
  }, [customizableItems]);

  // Form with validation
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(createValidationSchema(isAuthenticated)),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      deliveryInstructions: "",
      cardNumber: "",
      cardName: "",
      cardExpiry: "",
      cardCvc: "",
    },
    mode: "onChange", // Validar ao alterar os campos
  });

  // Fetch selected plan based on query parameter
  useEffect(() => {
    const fetchSelectedPlan = async () => {
      try {
        // Get plan ID from query parameter
        const searchParams = new URLSearchParams(window.location.search);
        const planSlug = searchParams.get("plan");

        if (!planSlug) {
          setError("Nenhum plano selecionado");
          setIsLoading(false);
          return;
        }

        // Fetch plan details from API
        const response = await fetch(`/api/plans/slug/${planSlug}`);
        if (!response.ok) {
          throw new Error("Falha ao carregar detalhes do plano");
        }

        const data = await response.json();
        setSelectedPlan(data);
        console.log("Plano selecionado carregado:", data);
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao carregar plano:", error);
        setError("Erro ao carregar detalhes do plano");
        setIsLoading(false);
      }
    };

    fetchSelectedPlan();
  }, []);

  // Check if user is authenticated and fill form with user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/customer/check-auth");
        const data = await response.json();

        console.log("Verificação de autenticação:", data);

        if (data.authenticated) {
          const userData = data.user;
          setIsAuthenticated(true);
          setUserData(userData);

          // Fill form with user data
          form.setValue("name", userData.name || "");
          form.setValue("email", userData.email || "");
          form.setValue("phone", userData.phone || "");
          form.setValue("address", userData.address || "");
        } else {
          setIsAuthenticated(false);
          setUserData(null);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsAuthenticated(false);
        setUserData(null);
      }
    };

    if (selectedPlan) {
      checkAuth();
    }
  }, [selectedPlan, form]);

  // Calculate total price (plan price + customizable items)
  const calculateTotal = useMemo(() => {
    if (!selectedPlan) return 0;

    const planPrice = parseFloat(selectedPlan.price);
    const customizationTotal = getCustomizationTotal();

    console.log("Calculating total:", {
      planPrice,
      customizationTotal,
      total: planPrice + customizationTotal,
    });

    return planPrice + customizationTotal;
  }, [selectedPlan, getCustomizationTotal]);

  // Handle form submission
  const onSubmit = async (data: CheckoutFormValues) => {
    console.log("onSubmit iniciado com dados:", data);
    console.log("Estado de autenticação:", isAuthenticated);

    if (!selectedPlan) {
      console.error("Erro: Nenhum plano selecionado");
      setError("Nenhum plano selecionado");
      return;
    }

    // Verificar se o usuário não está autenticado e não forneceu senha
    if (!isAuthenticated && !data.password) {
      console.error("Erro: Senha obrigatória para criar conta");
      form.setError("password", {
        type: "manual",
        message: "Senha obrigatória para criar conta",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Estado isSubmitting definido como true");

      // Prepare checkout data
      const checkoutData = {
        planId: selectedPlan.id,
        customizableItems,
        userDetails: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          password: isAuthenticated ? undefined : data.password,
          deliveryInstructions: data.deliveryInstructions,
        },
        paymentDetails: {
          cardNumber: data.cardNumber,
          cardName: data.cardName,
          cardExpiry: data.cardExpiry,
          cardCvc: data.cardCvc,
        },
        createAccount: !isAuthenticated,
      };

      // Send checkout request
      console.log("Enviando dados para checkout:", {
        planId: checkoutData.planId,
        customizableItems: checkoutData.customizableItems,
        createAccount: checkoutData.createAccount,
        hasPaymentDetails: !!checkoutData.paymentDetails,
        userDetails: {
          ...checkoutData.userDetails,
          hasPassword: !!checkoutData.userDetails.password,
        },
        isAuthenticated,
      });

      try {
        console.log("Iniciando requisição para a API");
        const response = await fetch(
          "/api/checkout/subscription/process-payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(checkoutData),
          }
        );
        console.log("Resposta da API recebida:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        const responseData = await response.json();
        console.log("Dados da resposta da API:", responseData);

        if (!response.ok) {
          console.error("Erro na resposta da API:", {
            status: response.status,
            statusText: response.statusText,
            data: responseData,
          });
          throw new Error(responseData.error || "Erro ao processar o checkout");
        }

        // Handle successful checkout
        if (responseData.success) {
          // Clear customization
          useSubscriptionStore.getState().clearCustomization();

          // Show success message
          setSuccessMessage({
            title: "Assinatura realizada com sucesso!",
            message:
              "Sua assinatura foi processada com sucesso. Você receberá um email com os detalhes.",
            primaryAction: {
              label: "Ver minhas assinaturas",
              href: "/customer/dashboard/subscription",
            },
            secondaryAction: {
              label: "Voltar para a página inicial",
              href: "/",
            },
          });
        }
      } catch (error) {
        console.error("Erro no checkout:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao processar sua assinatura"
        );
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao processar sua assinatura"
      );
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container max-w-5xl py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando informações do plano...</p>
        </div>
      </div>
    );
  }

  // Show success message
  if (successMessage) {
    return (
      <div className="container max-w-5xl py-8">
        <Card className="p-8 text-center">
          <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{successMessage.title}</h2>
          <p className="mb-6 text-muted-foreground">{successMessage.message}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push(successMessage.primaryAction.href)}
            >
              {successMessage.primaryAction.label}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push(successMessage.secondaryAction.href)}
            >
              {successMessage.secondaryAction.label}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show error if no plan selected
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

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault(); // Prevenir o comportamento padrão
                console.log("Form submit event triggered");
                console.log("Form validation state:", form.formState);
                console.log("Form errors:", form.formState.errors);
                console.log("Form values:", form.getValues());

                // Verificar se o formulário é válido
                const isValid = form.formState.isValid;
                console.log("Formulário é válido?", isValid);

                if (isValid) {
                  console.log("Formulário válido, prosseguindo com o envio");
                  form.handleSubmit(onSubmit)(e);
                } else {
                  console.error("Formulário inválido. Corrigindo erros...");
                  // Trigger validation manually
                  form.trigger().then((isValid) => {
                    console.log("Resultado da validação manual:", isValid);
                    console.log(
                      "Erros após validação manual:",
                      form.formState.errors
                    );
                    if (isValid) {
                      console.log(
                        "Formulário agora é válido, prosseguindo com o envio"
                      );
                      form.handleSubmit(onSubmit)(e);
                    }
                  });
                }
              }}
              className="space-y-6"
            >
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

                  {/* Password field only for non-authenticated users */}
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

              <Card>
                <CardHeader>
                  <CardTitle>Informações de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cardName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome no Cartão</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome como está no cartão"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Cartão</FormLabel>
                        <FormControl>
                          <Input placeholder="0000 0000 0000 0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cardExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Validade</FormLabel>
                          <FormControl>
                            <Input placeholder="MM/AA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cardCvc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CVC</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={() => console.log("Submit button clicked")}
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

                {process.env.NODE_ENV === "development" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      console.log("Estado do formulário:", {
                        values: form.getValues(),
                        errors: form.formState.errors,
                        isValid: form.formState.isValid,
                        isDirty: form.formState.isDirty,
                        isSubmitting: form.formState.isSubmitting,
                        isAuthenticated,
                        selectedPlan,
                        customizableItems,
                      });
                    }}
                  >
                    Depurar Formulário
                  </Button>
                )}
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
              <div className="flex justify-between">
                <span className="font-medium">Plano:</span>
                <span>{selectedPlan.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Preço base:</span>
                <span>
                  R${" "}
                  {parseFloat(selectedPlan.price).toFixed(2).replace(".", ",")}
                </span>
              </div>

              <Separator />

              {selectedPlan.fixedItems && selectedPlan.fixedItems.length > 0 ? (
                <div className="space-y-2">
                  <span className="font-medium">Itens inclusos no plano:</span>
                  <ul className="text-sm space-y-1">
                    {selectedPlan.fixedItems.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>
                          {item.product.name} x {item.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Separator />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-2">
                  <p>Este plano não inclui itens fixos.</p>
                  <Separator className="my-2" />
                </div>
              )}

              {customizableItems.length > 0 ? (
                <>
                  <div>
                    <h3 className="font-medium mb-2">Itens personalizados:</h3>
                    <ul className="space-y-1 text-sm">
                      {customizableItems.map((item) => (
                        <li
                          key={item.product.id}
                          className="flex justify-between"
                        >
                          <span>{item.product.name}</span>
                          <span>
                            {item.quantity} x R${" "}
                            {parseFloat(item.product.price)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">
                      Subtotal personalização:
                    </span>
                    <span>
                      R$ {getCustomizationTotal().toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  <Separator />
                </>
              ) : (
                <div className="text-sm text-muted-foreground py-2">
                  <p>Nenhum item personalizado selecionado.</p>
                </div>
              )}

              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>R$ {calculateTotal.toFixed(2).replace(".", ",")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
