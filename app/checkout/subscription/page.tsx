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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Check,
  Loader2,
  ShoppingCart,
  CreditCard,
  Shield,
  Clock,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useSubscriptionStore } from "@/lib/state/subscriptionStore";
import { Checkbox } from "@/components/ui/checkbox";
// Importar Stripe
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Carregar Stripe - substitua com sua chave pública
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

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

interface UserData {
  name: string;
  email: string;
  phone: string;
  address: string;
  zipCode?: string;
  deliveryInstructions?: string;
}

// Schema de validação para o formulário
const checkoutFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  address: z.string().min(10, "Endereço deve ser completo"),
  zipCode: z.string().min(8, "CEP deve ter 8 dígitos"),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .optional(),
  deliveryInstructions: z.string().optional(),
  savePaymentMethod: z.boolean().default(true),
});

// Função para criar o esquema de validação com base no estado de autenticação
const createValidationSchema = (isAuthenticated: boolean) => {
  return isAuthenticated
    ? checkoutFormSchema.omit({ password: true })
    : checkoutFormSchema.refine((data) => !!data.password, {
        message: "Senha é obrigatória para criar uma conta",
        path: ["password"],
      });
};

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

// Adicionando formatadores aos campos de cartão de crédito
const formatCardNumber = (value: string) => {
  if (!value) return "";

  // Remover tudo que não for número
  const numbers = value.replace(/[^\d]/g, "");

  // Limitar a 16 dígitos
  const trimmed = numbers.slice(0, 16);

  // Adicionar espaços a cada 4 dígitos
  const formatted = trimmed.replace(/(\d{4})(?=\d)/g, "$1 ");

  return formatted;
};

const formatExpiryDate = (value: string) => {
  if (!value) return "";

  // Remover tudo que não for número
  const numbers = value.replace(/[^\d]/g, "");

  // Limitar a 4 dígitos
  const trimmed = numbers.slice(0, 4);

  // Adicionar barra após os primeiros 2 dígitos
  if (trimmed.length > 2) {
    return `${trimmed.slice(0, 2)}/${trimmed.slice(2)}`;
  }

  return trimmed;
};

const formatCVC = (value: string) => {
  if (!value) return "";

  // Remover tudo que não for número
  const numbers = value.replace(/[^\d]/g, "");

  // Limitar a 4 dígitos (para Amex que tem CVC de 4 dígitos)
  return numbers.slice(0, 4);
};

// Função para formatar CEP brasileiro (formato: 12345-678)
const formatCEP = (value: string) => {
  if (!value) return "";

  // Remover tudo que não for número
  const numbers = value.replace(/[^\d]/g, "");

  // Limitar a 8 dígitos
  const trimmed = numbers.slice(0, 8);

  // Adicionar hífen após os primeiros 5 dígitos
  if (trimmed.length > 5) {
    return `${trimmed.slice(0, 5)}-${trimmed.slice(5)}`;
  }

  return trimmed;
};

function CheckoutForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    message: string;
    primaryAction: { label: string; href: string };
    secondaryAction: { label: string; href: string };
  } | null>(null);
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] =
    useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Stripe hooks
  const stripe = useStripe();
  const elements = useElements();

  // Get customizable items from store
  const { customizableItems, getCustomizationTotal, clearCustomization } =
    useSubscriptionStore();

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
      zipCode: "",
      password: "",
      deliveryInstructions: "",
      savePaymentMethod: true,
    },
    mode: "onChange", // Validar ao alterar os campos
  });

  // Verificar autenticação separadamente e antes de carregar o plano
  useEffect(() => {
    const initialize = async () => {
      try {
        // Verificar autenticação primeiro
        await checkAuth();

        // Depois de verificar autenticação, buscar plano
        await fetchSelectedPlan();
      } catch (error) {
        console.error("Erro durante a inicialização:", error);
        setError("Erro ao carregar a página de checkout");
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Atualizar o resolver quando o status de autenticação mudar
  useEffect(() => {
    form.clearErrors("password");
  }, [isAuthenticated, form]);

  // Fetch selected plan based on query parameter
  const fetchSelectedPlan = async () => {
    try {
      // Get plan ID from query parameter
      const searchParams = new URLSearchParams(window.location.search);
      const planSlug = searchParams.get("plan");
      const success = searchParams.get("success");

      if (success === "true") {
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
        setIsLoading(false);
        return;
      }

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

  // Check if user is authenticated and fill form with user data
  const checkAuth = async () => {
    try {
      console.log("Iniciando verificação de autenticação do cliente...");

      // Verificar se o cookie de sessão do cliente existe
      const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
      const hasCustomerSession = cookies.some((cookie) =>
        cookie.startsWith("customer_session=")
      );

      console.log(
        "Cookie de sessão do cliente encontrado:",
        hasCustomerSession
      );

      const response = await fetch("/api/customer/check-auth", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const data = await response.json();

      console.log("Resposta da API de verificação:", data);

      if (data.authenticated) {
        const userDetails = data.user;
        console.log("Usuário autenticado, detalhes:", userDetails);

        setIsAuthenticated(true);
        setUserData(userDetails);

        // Preencher formulário com os dados do usuário
        console.log("Preenchendo formulário com dados do usuário");
        if (userDetails.name) {
          console.log("Definindo nome:", userDetails.name);
          form.setValue("name", userDetails.name);
        }
        if (userDetails.email) {
          console.log("Definindo email:", userDetails.email);
          form.setValue("email", userDetails.email);
        }
        if (userDetails.phone) {
          console.log("Definindo telefone:", userDetails.phone);
          form.setValue("phone", userDetails.phone);
        }
        if (userDetails.address) {
          console.log("Definindo endereço:", userDetails.address);
          form.setValue("address", userDetails.address);
        }
        if (userDetails.zipCode) {
          console.log("Definindo CEP:", userDetails.zipCode);
          form.setValue("zipCode", userDetails.zipCode);
        }
        if (userDetails.deliveryInstructions) {
          console.log(
            "Definindo instruções de entrega:",
            userDetails.deliveryInstructions
          );
          form.setValue(
            "deliveryInstructions",
            userDetails.deliveryInstructions
          );
        }

        // Foco no primeiro campo que precisa ser preenchido
        setTimeout(() => {
          if (!userDetails.zipCode) {
            document.getElementById("zipCode")?.focus();
          } else if (!userDetails.address) {
            document.getElementById("address")?.focus();
          } else if (!userDetails.phone) {
            document.getElementById("phone")?.focus();
          } else {
            document.getElementById("deliveryInstructions")?.focus();
          }
        }, 500);

        return true;
      } else if (hasCustomerSession) {
        // Se temos cookie mas a API retornou não autenticado, vamos tentar buscar dados do usuário diretamente
        console.log(
          "Cookie encontrado mas API retornou não autenticado. Tentando rota alternativa..."
        );

        try {
          const userResponse = await fetch("/api/customer/me");
          const userData = await userResponse.json();

          console.log("Dados do usuário pela rota /api/customer/me:", userData);

          if (userData && !userData.error) {
            setIsAuthenticated(true);
            setUserData(userData);

            // Preencher formulário com dados do usuário
            if (userData.name) form.setValue("name", userData.name);
            if (userData.email) form.setValue("email", userData.email);
            if (userData.phone) form.setValue("phone", userData.phone);
            if (userData.address) form.setValue("address", userData.address);
            if (userData.zipCode) form.setValue("zipCode", userData.zipCode);
            if (userData.deliveryInstructions)
              form.setValue(
                "deliveryInstructions",
                userData.deliveryInstructions
              );

            return true;
          }
        } catch (error) {
          console.error(
            "Erro ao buscar dados do usuário pela rota alternativa:",
            error
          );
        }
      }

      console.log("Usuário não autenticado");
      setIsAuthenticated(false);
      setUserData(null);
      return false;
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      setIsAuthenticated(false);
      setUserData(null);
      return false;
    }
  };

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

  // Criar o Payment Intent
  const createPaymentIntent = async (planId, customizableItems) => {
    try {
      const response = await fetch(
        "/api/checkout/subscription/create-payment-intent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planId,
            customizableItems,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar payment intent");
      }

      const data = await response.json();
      console.log("Payment Intent criado:", data);
      return data.clientSecret;
    } catch (error) {
      console.error("Erro ao criar payment intent:", error);
      throw error;
    }
  };

  // Handle form submission
  const onSubmit = async (data: CheckoutFormValues) => {
    console.log("onSubmit iniciado com dados:", data);

    if (!stripe || !elements) {
      toast.error("O Stripe não está carregado. Por favor, tente novamente.");
      return;
    }

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
      setPaymentProcessing(true);

      // 1. Primeiro criar o Payment Intent
      let clientSecret;
      try {
        clientSecret = await createPaymentIntent(
          selectedPlan.id,
          customizableItems
        );
        setPaymentIntentClientSecret(clientSecret);
      } catch (error) {
        throw new Error(
          `Erro ao criar intenção de pagamento: ${error.message}`
        );
      }

      // 2. Confirmar o pagamento com Stripe
      const cardElement = elements.getElement(CardElement);

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: data.name,
              email: data.email,
            },
          },
        });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status !== "succeeded") {
        throw new Error(
          `Pagamento não finalizado. Status: ${paymentIntent.status}`
        );
      }

      // 3. Agora que o pagamento foi bem-sucedido, processar a assinatura
      console.log("Pagamento confirmado, processando assinatura...");

      // Prepare checkout data (sem dados do cartão)
      const checkoutData = {
        planId: selectedPlan.id,
        customizableItems,
        userDetails: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          zipCode: data.zipCode,
          password: isAuthenticated ? undefined : data.password,
          deliveryInstructions: data.deliveryInstructions,
        },
        paymentDetails: {
          savePaymentMethod: data.savePaymentMethod,
        },
        createAccount: !isAuthenticated,
        paymentIntentId: paymentIntent.id, // Enviar o ID do payment intent confirmado
      };

      // Log para depuração
      console.log("Enviando dados para processo de assinatura:", {
        planId: checkoutData.planId,
        paymentIntentId: checkoutData.paymentIntentId,
        createAccount: checkoutData.createAccount,
      });

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
        throw new Error(responseData.error || "Erro ao processar a assinatura");
      }

      // Handle successful checkout
      if (responseData.success) {
        // Clear customization
        clearCustomization();

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
      setPaymentProcessing(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container max-w-5xl py-12 px-6 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Preparando seu checkout...</p>
        </div>
      </div>
    );
  }

  // Show success message
  if (successMessage) {
    return (
      <div className="container max-w-5xl py-12 px-6">
        <Card className="p-8 text-center border-green-200 shadow-md">
          <Check className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-3 text-green-800">
            {successMessage.title}
          </h2>
          <p className="mb-8 text-gray-600 text-lg">{successMessage.message}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => router.push(successMessage.primaryAction.href)}
            >
              {successMessage.primaryAction.label}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-green-200"
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
      <div className="container max-w-5xl py-12 px-6">
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
    <div className="container max-w-6xl py-12 px-6">
      <h1 className="text-3xl font-bold mb-2 text-green-800">
        Finalizar Assinatura
      </h1>
      <p className="text-gray-600 mb-8">
        Complete o checkout para iniciar sua assinatura de frutas frescas
      </p>

      {isAuthenticated && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-8 flex items-center">
          <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
          <div>
            <p className="text-green-800 font-medium">
              Você está logado como {userData?.name || userData?.email}
            </p>
            <p className="text-sm text-green-700">
              Seus dados pessoais foram preenchidos automaticamente. Você só
              precisa confirmar ou atualizar as informações e adicionar os dados
              de pagamento.
            </p>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="shadow-md border-green-100">
                <CardHeader className="bg-green-50 border-b pb-4">
                  <CardTitle className="text-xl text-green-800">
                    Informações Pessoais
                  </CardTitle>
                  {isAuthenticated && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Suas informações foram preenchidas automaticamente. Você
                      pode editar se necessário.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              className={isAuthenticated ? "bg-gray-50" : ""}
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
                              id="phone"
                              placeholder="(00) 00000-0000"
                              {...field}
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
                            id="address"
                            placeholder="Rua, número, bairro, complemento, cidade, estado"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            id="zipCode"
                            placeholder="00000-000"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatCEP(e.target.value);
                              field.onChange(formatted);
                            }}
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
                              id="password"
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
                            id="deliveryInstructions"
                            placeholder="Instruções adicionais para entrega (portaria, pontos de referência, etc)"
                            {...field}
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-md border-green-100">
                <CardHeader className="bg-green-50 border-b pb-4">
                  <CardTitle className="text-xl flex items-center gap-2 text-green-800">
                    <CreditCard className="h-5 w-5" />
                    Informações de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    {/* Componente Stripe Card Element */}
                    <div className="p-4 border rounded-md">
                      <FormLabel className="mb-2 block">
                        Cartão de Crédito
                      </FormLabel>
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: "16px",
                              color: "#424770",
                              "::placeholder": {
                                color: "#aab7c4",
                              },
                            },
                            invalid: {
                              color: "#9e2146",
                            },
                          },
                          hidePostalCode: true,
                        }}
                      />
                    </div>

                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="savePaymentMethod"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Salvar cartão para futuras compras
                              </FormLabel>
                              <FormDescription>
                                Seus dados serão armazenados com segurança
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6">
                <Button
                  type="submit"
                  className="w-full py-6 text-lg bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting || !stripe}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    `Finalizar Assinatura - R$ ${calculateTotal
                      .toFixed(2)
                      .replace(".", ",")}`
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="lg:col-span-1">
          {/* Order Summary Card */}
          <div className="lg:sticky lg:top-6">
            <Card className="shadow-md border-green-100">
              <CardHeader className="bg-green-50 border-b pb-4">
                <CardTitle className="text-xl flex items-center gap-2 text-green-800">
                  <ShoppingCart className="h-5 w-5" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Selected Plan */}
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Plano Selecionado
                  </h3>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
                    {selectedPlan.imageUrl ? (
                      <img
                        src={selectedPlan.imageUrl}
                        alt={selectedPlan.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium">{selectedPlan.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedPlan.description}
                      </p>
                      <p className="font-medium text-green-700">
                        R${" "}
                        {parseFloat(selectedPlan.price)
                          .toFixed(2)
                          .replace(".", ",")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fixed Items in Plan if any */}
                {selectedPlan.fixedItems &&
                  selectedPlan.fixedItems.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900 mb-2">
                        Itens Incluídos
                      </h3>
                      <ul className="space-y-2">
                        {selectedPlan.fixedItems.map((item) => (
                          <li
                            key={item.id}
                            className="flex justify-between text-sm py-2 border-b border-gray-100"
                          >
                            <span>{item.product.name}</span>
                            <span className="font-medium">
                              {item.quantity}x
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Customized Items if any */}
                {customizableItems.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Personalizações
                    </h3>
                    <ul className="space-y-2">
                      {customizableItems.map((item) => (
                        <li
                          key={item.product.id}
                          className="flex justify-between text-sm py-2 border-b border-gray-100"
                        >
                          <div>
                            <span>{item.product.name}</span>
                            {item.product.price && item.quantity > 0 && (
                              <span className="text-gray-500 text-xs block">
                                R${" "}
                                {(
                                  parseFloat(item.product.price) * item.quantity
                                )
                                  .toFixed(2)
                                  .replace(".", ",")}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">{item.quantity}x</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Total */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-green-700">
                      R$ {calculateTotal.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Plano mensal com entrega semanal
                  </p>
                </div>

                {/* Trust badges */}
                <div className="mt-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div className="text-sm">
                        <p className="font-medium">Pagamento Seguro</p>
                        <p className="text-xs text-muted-foreground">
                          Criptografado
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      <div className="text-sm">
                        <p className="font-medium">Entregas Semanais</p>
                        <p className="text-xs text-muted-foreground">
                          Fresquinho sempre
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper com o provedor do Stripe
export default function SubscriptionCheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
