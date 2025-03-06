"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    console.log(info);
    setDebugInfo((prev) => [...prev, info]);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      addDebugInfo(`[AdminLogin] Iniciando login com email: ${data.email}`);

      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        // Importante: não seguir redirecionamentos automaticamente
        redirect: "manual",
      });

      addDebugInfo(
        `[AdminLogin] Resposta do servidor: status ${response.status}`
      );

      if (!response.ok) {
        const error = await response.json();
        addDebugInfo(
          `[AdminLogin] Erro na resposta: ${error.message || "Desconhecido"}`
        );
        throw new Error(error.message || "Falha ao fazer login");
      }

      // Verificar resposta e cookies
      const userData = await response.json();
      addDebugInfo(
        `[AdminLogin] Login bem-sucedido para usuário: ${userData.id} (${userData.role})`
      );

      // Verificar se há redirecionamento
      if (response.redirected) {
        addDebugInfo(
          `[AdminLogin] Redirecionamento detectado para: ${response.url}`
        );
      }

      toast.success("Login efetuado com sucesso!");

      // Configurar um atraso curto antes do redirecionamento
      addDebugInfo(`[AdminLogin] Aguardando 500ms antes de redirecionar...`);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirecionar para o dashboard administrativo
      addDebugInfo(`[AdminLogin] Redirecionando para /dashboard/admin...`);
      router.push("/dashboard/admin");

      // Evitar o refresh imediato, que pode causar problemas com o estado dos cookies
      await new Promise((resolve) => setTimeout(resolve, 300));
      addDebugInfo(
        `[AdminLogin] Executando router.refresh() após redirecionamento`
      );
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao fazer login";
      addDebugInfo(`[AdminLogin] Erro: ${errorMessage}`);
      toast.error(errorMessage);
      console.error("Erro de login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Login Administrativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </Form>

          {/* Debug info - apenas em desenvolvimento */}
          {process.env.NODE_ENV !== "production" && debugInfo.length > 0 && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-48">
              <h4 className="font-bold mb-1">Debug:</h4>
              {debugInfo.map((info, i) => (
                <div key={i}>{info}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
