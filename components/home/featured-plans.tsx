"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Plan {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  price: string;
  imageUrl: string | null;
}

interface FeaturedPlansProps {
  plans: Plan[];
}

export function FeaturedPlans({ plans }: FeaturedPlansProps) {
  // Função para determinar se planos estão carregando
  const isLoading = plans.length === 0;

  // Função para formatar moeda
  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {isLoading
        ? // Skeletons para carregamento
          Array.from({ length: 3 }).map((_, index) => (
            <motion.div
              key={`skeleton-${index}`}
              className="overflow-hidden rounded-xl bg-white shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="h-48 w-full bg-gray-200 animate-pulse"></div>
              <div className="p-6">
                <div className="h-6 w-3/4 bg-gray-200 animate-pulse mb-2"></div>
                <div className="h-4 w-full bg-gray-200 animate-pulse mb-2"></div>
                <div className="h-4 w-2/3 bg-gray-200 animate-pulse mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-8 w-1/3 bg-gray-200 animate-pulse"></div>
                  <div className="h-10 w-1/4 bg-gray-200 animate-pulse"></div>
                </div>
              </div>
            </motion.div>
          ))
        : // Planos carregados
          plans.map((plan: Plan, index) => (
            <motion.div
              key={plan.id}
              className="overflow-hidden rounded-xl bg-white shadow-sm border border-green-100"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              whileHover={{
                y: -5,
                boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.1)",
                transition: { duration: 0.3 },
              }}
            >
              <div className="relative h-48 w-full overflow-hidden">
                {plan.imageUrl ? (
                  <Image
                    src={plan.imageUrl}
                    alt={plan.name}
                    fill
                    className="object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center">
                    <span className="text-green-800 font-medium">
                      Tudo Fresco
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-green-900">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {plan.description ||
                    "Plano de assinatura de frutas frescas e selecionadas."}
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-2xl font-bold text-green-800">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-sm font-normal text-gray-500">
                      /mês
                    </span>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      asChild
                      variant="outline"
                      className="border-green-800 text-green-800 hover:bg-green-50"
                    >
                      <Link href={`/plans/${plan.slug}`}>Ver Detalhes</Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
    </div>
  );
}
