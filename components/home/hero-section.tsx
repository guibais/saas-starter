"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Star,
  Leaf,
  Truck,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { MagicText } from "./magic-text";

// Componente para exibir imagens de frutas com destaques em dispositivos móveis
function MobileFruitHighlight() {
  return (
    <div className="relative md:hidden mt-6 mb-2">
      <div className="flex justify-center">
        <motion.div
          className="relative rounded-full bg-white/5 backdrop-blur-sm p-1 border border-white/10"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative h-28 w-28 rounded-full overflow-hidden">
            <Image
              src="/images/hero-fruits.svg"
              alt="Frutas frescas"
              fill
              className="object-cover scale-150 object-center"
            />
          </div>
          <motion.div
            className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Star className="h-3 w-3 text-green-900" fill="#166534" />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="flex justify-center mt-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full inline-flex items-center space-x-1">
          <Star className="h-3 w-3 text-yellow-300" fill="#fcd34d" />
          <Star className="h-3 w-3 text-yellow-300" fill="#fcd34d" />
          <Star className="h-3 w-3 text-yellow-300" fill="#fcd34d" />
          <Star className="h-3 w-3 text-yellow-300" fill="#fcd34d" />
          <Star className="h-3 w-3 text-yellow-300" fill="#fcd34d" />
          <span className="text-xs text-white ml-1">Qualidade premium</span>
        </div>
      </motion.div>
    </div>
  );
}

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);

  return (
    <motion.section
      ref={heroRef}
      className="relative w-full bg-gradient-to-br from-green-900 via-green-800 to-green-700 pt-8 pb-16 sm:py-16 md:py-20 overflow-hidden"
    >
      {/* Background pattern */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 1 }}
        className="absolute inset-0"
      >
        <Image
          src="/images/fruits-pattern.svg"
          alt="Padrão de frutas"
          fill
          className="object-cover"
          priority
        />
      </motion.div>

      {/* Background overlay with radial gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-green-900/20 to-green-900/50" />

      {/* Floating decorative elements - mobile only */}
      <div className="md:hidden absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 blur-lg opacity-60"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{ top: "15%", left: "10%" }}
        />
        <motion.div
          className="absolute h-20 w-20 rounded-full bg-gradient-to-br from-green-300 to-green-600 blur-lg opacity-60"
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{ top: "30%", right: "10%" }}
        />
      </div>

      <div className="relative px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Mobile-optimized content layout */}
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Text content - optimized for mobile */}
          <motion.div
            className="w-full md:w-1/2 text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge for mobile visibility */}
            <motion.div
              className="inline-flex items-center mb-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 mr-2 text-yellow-300" />
              <span className="text-xs font-medium text-white">
                Do produtor à sua porta em 24h
              </span>
            </motion.div>

            {/* Circular fruit highlight for mobile */}
            <MobileFruitHighlight />

            <h1 className="responsive-heading-1 text-white mb-3 sm:mb-4 leading-tight">
              <MagicText>Descubra o Sabor Autêntico da Natureza</MagicText>
            </h1>

            <motion.p
              className="text-base md:text-xl mb-6 md:mb-8 text-white/90 mx-auto md:mx-0 max-w-md md:max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Experimente a sensação de ter as frutas mais frescas e saborosas
              do mercado entregues diretamente na sua porta, selecionadas
              especialmente para você.
            </motion.p>

            <motion.div
              className="flex justify-center md:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  asChild
                  className="bg-white text-green-900 hover:bg-green-50 font-bold shadow-lg"
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

          {/* Image container - desktop only */}
          <motion.div
            className="relative w-full md:w-1/2 h-[280px] sm:h-[320px] md:h-[400px] mt-6 md:mt-0 hidden md:block"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-green-400/30 to-green-800/30 backdrop-blur-sm">
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                  repeatDelay: 1,
                }}
              />
              <Image
                src="/images/hero-fruits.svg"
                alt="Seleção de frutas gourmet"
                fill
                className="object-cover object-center"
                priority
              />
            </div>
          </motion.div>
        </div>

        {/* Mobile feature highlights */}
        <div className="md:hidden mt-8">
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {[
              { icon: <Leaf />, text: "Cultivo sustentável" },
              { icon: <Truck />, text: "Entrega em 24h" },
              { icon: <Sparkles />, text: "Frutas premium" },
              { icon: <Calendar />, text: "Assinatura flexível" },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center text-center"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <div className="mb-2 text-white/90">{feature.icon}</div>
                <p className="text-xs text-white/90">{feature.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Improved wave for mobile - smoother curve */}
      <motion.div
        className="absolute -bottom-1 left-0 right-0 w-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 90C1200 100 1320 110 1380 115L1440 120V120H0V120Z"
            fill="#f0fdf4"
          />
        </svg>
      </motion.div>
    </motion.section>
  );
}
