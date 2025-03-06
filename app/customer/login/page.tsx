"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import Head from "next/head";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/customer/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Falha no login");
      }

      // Redirecionar para o dashboard do cliente em caso de sucesso
      router.push("/customer/dashboard");
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro durante o login");
    } finally {
      setIsLoading(false);
    }
  };

  // Variantes para animação
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <>
      <Head>
        <title>Login | Tudo Fresco - Assinatura de Frutas Frescas</title>
        <meta
          name="description"
          content="Acesse sua conta Tudo Fresco para gerenciar assinaturas, entregas e aproveitar o melhor das frutas frescas."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div
        className="min-h-[100dvh] flex flex-col lg:flex-row overflow-hidden"
        role="main"
      >
        {/* Seção de imagem (visível apenas em telas médias e maiores) */}
        <div
          className="hidden lg:flex lg:w-1/2 relative bg-green-50"
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-full flex items-center justify-center p-12"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-100/80 to-transparent z-0" />
            <div className="relative z-10">
              <Image
                src="/images/hero-fruits.svg"
                alt="Ilustração de frutas frescas"
                width={500}
                height={500}
                className="max-w-md mx-auto"
                priority
              />
              <div className="mt-8 text-center">
                <h2 className="text-3xl font-bold text-green-800">
                  Tudo Fresco
                </h2>
                <p className="mt-4 text-green-700 max-w-md">
                  Assinaturas de frutas frescas entregues na sua porta. Faça
                  login para gerenciar suas entregas e pedidos.
                </p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0">
              <Image
                src="/images/fruits-pattern.svg"
                alt=""
                width={1200}
                height={200}
                className="w-full opacity-20"
                aria-hidden="true"
              />
            </div>
          </motion.div>
        </div>

        {/* Seção de formulário */}
        <motion.div
          className="flex-1 flex flex-col justify-center p-8 sm:p-12 md:p-16 lg:p-20 bg-white"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="max-w-md w-full mx-auto">
            {/* Logo e título em dispositivos móveis */}
            <div className="lg:hidden text-center mb-8">
              <Image
                src="/images/logo.jpeg"
                alt="Tudo Fresco Logo"
                width={64}
                height={64}
                className="mx-auto h-16 w-16 rounded-xl"
                priority
              />
              <h2 className="mt-4 text-2xl font-bold text-green-800">
                Tudo Fresco
              </h2>
            </div>

            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Bem-vindo de volta
              </h1>
              <p className="mt-3 text-gray-600">
                Faça login na sua conta para gerenciar suas assinaturas
              </p>
            </motion.div>

            <motion.form
              variants={itemVariants}
              className="space-y-6"
              onSubmit={handleSubmit}
              aria-label="Formulário de login"
            >
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email
                  </Label>
                  <div className="mt-1 relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 h-11 rounded-lg border-gray-300 bg-gray-50 focus:ring-green-500 focus:border-green-500 w-full"
                      placeholder="Seu email"
                      aria-required="true"
                      aria-invalid={error ? "true" : "false"}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Senha
                    </Label>
                    <Link
                      href="/customer/forgot-password"
                      className="text-sm font-medium text-green-600 hover:text-green-500"
                    >
                      Esqueceu?
                    </Link>
                  </div>
                  <div className="mt-1 relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 h-11 rounded-lg border-gray-300 bg-gray-50 focus:ring-green-500 focus:border-green-500 w-full"
                      placeholder="Sua senha"
                      aria-required="true"
                      aria-invalid={error ? "true" : "false"}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm p-3 rounded-lg bg-red-50 text-red-600 font-medium"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </motion.div>
              )}

              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full h-11 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium flex items-center justify-center"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2
                        className="animate-spin mr-2 h-4 w-4"
                        aria-hidden="true"
                      />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.form>

            <motion.div variants={itemVariants} className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Ainda não tem uma conta?
                  </span>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/customer/register"
                  className="text-green-600 hover:text-green-800 font-medium"
                >
                  Cadastre-se agora
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
