"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MagicText } from "./magic-text";

export function AnimatedCTA() {
  return (
    <motion.section
      className="py-20 px-4 md:px-6 lg:px-8 bg-gradient-to-br from-green-900 to-green-800 text-white relative overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
    >
      {/* Padrão de frutas com animação */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Image
            src="/images/fruits-pattern.svg"
            alt="Padrão de frutas"
            fill
            className="object-cover"
          />
        </motion.div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.h2
          className="responsive-heading-2 text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <MagicText>Desperte seus Sentidos com Sabores Autênticos</MagicText>
        </motion.h2>
        <motion.p
          className="text-lg text-green-50 mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Junte-se aos milhares de clientes satisfeitos que transformaram sua
          alimentação com nossas assinaturas de frutas premium. Seu paladar
          agradecerá.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative overflow-hidden rounded-lg"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
              animate={{
                x: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <Button
              size="lg"
              asChild
              className="bg-white text-green-900 hover:bg-green-50 font-bold relative z-10"
            >
              <Link href="/plans" className="px-8">
                Assinar Agora
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
