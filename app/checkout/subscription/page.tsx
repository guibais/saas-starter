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
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  deliveryInstructions: z.string().optional(),
});

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

  // Fetch selected plan based on query parameter
  useEffect(() => {
    const fetchSelectedPlan = async () => {
      try {
        setIsLoading(true);

        // Get plan slug from URL
        const urlParams = new URLSearchParams(window.location.search);
        const planSlug = urlParams.get("plan");

        if (!planSlug) {
          setError("Nenhum plano selecionado");
          return;
        }

        // Fetch plan details
        const response = await fetch(`/api/plans/slug/${planSlug}`);

        if (!response.ok) {
          throw new Error("Falha ao carregar o plano");
        }

        const planData = await response.json();
        console.log("Plan data loaded:", planData);

        // Check if fixedItems exists and has data
        if (planData.fixedItems) {
          console.log("Fixed items:", planData.fixedItems);
        } else {
          console.log("No fixed items found in plan data");
        }

        setSelectedPlan(planData);
      } catch (error) {
        console.error("Erro ao buscar plano:", error);
        setError("Erro ao carregar o plano selecionado");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSelectedPlan();
  }, []);

  // Check authentication and load user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const authResponse = await fetch("/api/customer/check-auth");
        const authData = await authResponse.json();

        if (authData.authenticated) {
          // Fetch user data
          const userResponse = await fetch("/api/customer/user");
          const userData = await userResponse.json();

          if (userData) {
            setIsAuthenticated(true);
            setUserData(userData);

            // Fill form with user data
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
      }
    };

    if (selectedPlan) {
      checkAuth();
    }
  }, [selectedPlan, form]);

  // Calculate total price (plan price + customizable items)
  const calculateTotal = () => {
    if (!selectedPlan) return 0;

    const planPrice = parseFloat(selectedPlan.price);
    const customizationTotal = getCustomizationTotal();

    console.log("Calculating total:", {
      planPrice,
      customizationTotal,
      total: planPrice + customizationTotal,
    });

    return planPrice + customizationTotal;
  };

  // Handle form submission
  const onSubmit = async (data: CheckoutFormValues) => {
    if (!selectedPlan) {
      setError("Nenhum plano selecionado");
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare checkout data
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
        createAccount: !isAuthenticated,
      };

      // Send checkout request
      const response = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      const responseData = await response.json();

      if (!response.ok) {
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
            href: "/customer/subscriptions",
          },
          secondaryAction: {
            label: "Voltar para a página inicial",
            href: "/",
          },
        });
      } else if (responseData.redirectUrl) {
        // Redirect to payment page if needed
        window.location.href = responseData.redirectUrl;
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
                <span>R$ {calculateTotal().toFixed(2).replace(".", ",")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
