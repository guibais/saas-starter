"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubscriptionStore } from "@/lib/state/subscriptionStore";
import { useAuthContext } from "@/lib/state/AuthProvider";
import { Loader2, ArrowLeft, Check, CreditCard } from "lucide-react";

// Esquema de validação para o formulário de checkout
const checkoutFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  address: z.string().min(10, "Endereço deve ter pelo menos 10 caracteres"),
  deliveryInstructions: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export default function SubscriptionCheckoutPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    selectedPlan,
    customizableItems,
    clearCustomization,
    isCustomizationValid,
  } = useSubscriptionStore();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

  // Formulário com validação
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      deliveryInstructions: user?.deliveryInstructions || "",
    },
  });

  // Atualizar valores do formulário quando o usuário for carregado
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        deliveryInstructions: user.deliveryInstructions || "",
      });
    }
  }, [user, form]);

  // Verificar se o usuário está autenticado e se há um plano selecionado
  useEffect(() => {
    setIsLoading(authLoading);

    if (!authLoading) {
      if (!selectedPlan) {
        toast.error("Nenhum plano selecionado");
        router.push("/plans");
        return;
      }

      if (!isCustomizationValid()) {
        toast.error("Sua personalização não está completa");
        router.push(`/plans/${selectedPlan.slug}`);
        return;
      }
    }
  }, [authLoading, selectedPlan, router, isCustomizationValid]);

  const onSubmit = async (data: CheckoutFormValues) => {
    if (!selectedPlan || !isCustomizationValid()) {
      toast.error("Plano inválido ou personalização incompleta");
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar os dados da assinatura
      const subscriptionData = {
        planId: selectedPlan.id,
        customizableItems: customizableItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        userDetails: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          deliveryInstructions: data.deliveryInstructions,
        },
        createAccount: !isAuthenticated,
      };

      // Enviar para a API
      const response = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao processar assinatura");
      }

      const responseData = await response.json();

      // Limpar o carrinho de customização
      clearCustomization();

      // Redirecionar para a página de sucesso
      toast.success("Assinatura realizada com sucesso!");
      router.push(
        `/checkout/success?type=subscription&id=${responseData.subscriptionId}`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao processar assinatura"
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Carregando...</p>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-500 mb-4">Nenhum plano selecionado</p>
        <Button onClick={() => router.push("/plans")}>
          Ver Planos Disponíveis
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/plans/${selectedPlan.slug}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Finalizar Assinatura
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Entrega</CardTitle>
              <CardDescription>
                Preencha seus dados para receber sua assinatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" {...field} />
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
                            <Input placeholder="(00) 00000-0000" {...field} />
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
                            placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instruções de Entrega (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Instruções especiais para entrega"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Informe detalhes que possam ajudar na entrega, como
                          referências ou horários preferidos.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <h3 className="text-lg font-medium mb-4">
                      Método de Pagamento
                    </h3>
                    <div className="border rounded-md p-4 bg-muted/50">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="font-medium">Cartão de Crédito</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        O pagamento será processado de forma segura pelo nosso
                        parceiro Stripe. Você será redirecionado para completar
                        o pagamento após confirmar a assinatura.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Confirmar Assinatura"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedPlan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedPlan.description}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Itens selecionados:</h3>
                <ul className="space-y-1 text-sm">
                  {customizableItems.map((item) => (
                    <li
                      key={item.product.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        <span>
                          {item.quantity}x {item.product.name}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatCurrency(
                          parseFloat(item.product.price) * item.quantity
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="flex justify-between items-center font-medium">
                <span>Total mensal:</span>
                <span className="text-xl">
                  {formatCurrency(selectedPlan.price)}
                </span>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Sua assinatura será renovada automaticamente a cada mês.</p>
                <p>Você pode cancelar a qualquer momento.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
