"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { MagicText } from "./magic-text";

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);

  return (
    <motion.section
      ref={heroRef}
      className="relative w-full bg-gradient-to-r from-green-900 to-green-700 py-10 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 opacity-5 sm:opacity-10 md:opacity-20"
      >
        <Image
          src="/images/fruits-pattern.svg"
          alt="Padrão de frutas"
          fill
          className="object-cover opacity-75"
          priority
        />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-green-900/10 to-green-900/50" />

      <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-8">
        <motion.div
          className="flex-1 text-white w-full md:max-w-[60%]"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="responsive-heading-1 text-white mb-2 sm:mb-3 md:mb-4 leading-tight">
            <MagicText>Descubra o Sabor Autêntico da Natureza</MagicText>
          </h1>
          <motion.p
            className="text-sm sm:text-base md:text-xl mb-4 sm:mb-5 md:mb-8 text-white max-w-md md:max-w-xl lg:max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Experimente a sensação de ter as frutas mais frescas e saborosas do
            mercado entregues diretamente na sua porta, selecionadas
            especialmente para você.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                asChild
                className="bg-white text-green-900 hover:bg-green-50 font-bold"
              >
                <Link href="/plans">
                  <span className="flex items-center">
                    Ver Planos
                    <motion.span
                      className="ml-2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        repeatType: "reverse",
                      }}
                    >
                      <ArrowRight size={18} />
                    </motion.span>
                  </span>
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex-1 relative h-[200px] sm:h-[250px] md:h-[400px] w-full mt-4 md:mt-0 rounded-lg overflow-hidden"
          initial={{ opacity: 0, scale: 0.8, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.4,
            type: "spring",
            stiffness: 100,
          }}
        >
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-transparent"
              animate={{
                x: ["0%", "100%", "0%"],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <Image
              src="/images/hero-fruits.svg"
              alt="Seleção de frutas gourmet"
              fill
              className="object-cover"
              priority
            />
          </div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-0 left-0 w-full h-20 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <svg
          viewBox="0 0 1440 74"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 24L60 29.3C120 35 240 45 360 53.3C480 61 600 67 720 64C840 61 960 48 1080 42.7C1200 37 1320 40 1380 42.7L1440 45V74H1380C1320 74 1200 74 1080 74C960 74 840 74 720 74C600 74 480 74 360 74C240 74 120 74 60 74H0V24Z"
            fill="#f0fdf4"
          />
        </svg>
      </motion.div>
    </motion.section>
  );
}
