"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Cookies from "js-cookie";
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

// Stripe será instalado posteriormente. Por enquanto, vamos usar uma abordagem mais simples
// para evitar erros de compilação

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
  deliveryInstructions?: string;
}

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

export default function SubscriptionCheckoutPage() {
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
      password: "",
      deliveryInstructions: "",
      cardNumber: "",
      cardName: "",
      cardExpiry: "",
      cardCvc: "",
      savePaymentMethod: true,
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

        // Verificar autenticação
        await checkAuth();

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
  const checkAuth = async () => {
    try {
      const response = await fetch("/api/customer/check-auth");
      const data = await response.json();

      console.log("Verificação de autenticação:", data);

      if (data.authenticated) {
        const userDetails = data.user;
        setIsAuthenticated(true);
        setUserData(userDetails);

        // Fill form with user data
        form.setValue("name", userDetails.name || "");
        form.setValue("email", userDetails.email || "");
        form.setValue("phone", userDetails.phone || "");
        form.setValue("address", userDetails.address || "");
        form.setValue(
          "deliveryInstructions",
          userDetails.deliveryInstructions || ""
        );

        // Foco no primeiro campo que precisa ser preenchido ou no campo de instruções de entrega
        setTimeout(() => {
          if (!userDetails.address) {
            document.getElementById("address")?.focus();
          } else if (!userDetails.phone) {
            document.getElementById("phone")?.focus();
          } else {
            document.getElementById("deliveryInstructions")?.focus();
          }
        }, 500);
      } else {
        setIsAuthenticated(false);
        setUserData(null);
      }

      return data.authenticated;
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
          savePaymentMethod: data.savePaymentMethod,
        },
        createAccount: !isAuthenticated,
      };

      // Log para depuração, removendo dados sensíveis
      console.log("Enviando dados para checkout:", {
        planId: checkoutData.planId,
        customizableItems: checkoutData.customizableItems,
        createAccount: checkoutData.createAccount,
        isAuthenticated,
        userDetails: {
          name: checkoutData.userDetails.name,
          email: checkoutData.userDetails.email,
          hasPassword: !!checkoutData.userDetails.password,
        },
        hasPaymentInfo: true,
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
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao processar sua assinatura"
      );
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container max-w-5xl py-12 flex justify-center items-center min-h-[60vh]">
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
      <div className="container max-w-5xl py-12">
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
      <div className="container max-w-5xl py-12">
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
    <div className="container max-w-6xl py-12">
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
                            placeholder="Rua, número, bairro, cidade, estado, CEP"
                            {...field}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              <Input
                                placeholder="0000 0000 0000 0000"
                                {...field}
                                value={formatCardNumber(field.value)}
                                onChange={(e) => {
                                  field.onChange(
                                    formatCardNumber(e.target.value)
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="cardExpiry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Validade</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="MM/AA"
                                {...field}
                                value={formatExpiryDate(field.value)}
                                onChange={(e) => {
                                  field.onChange(
                                    formatExpiryDate(e.target.value)
                                  );
                                }}
                              />
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
                              <Input
                                placeholder="123"
                                {...field}
                                value={formatCVC(field.value)}
                                onChange={(e) => {
                                  field.onChange(formatCVC(e.target.value));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
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
                  disabled={isSubmitting}
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
