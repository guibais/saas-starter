"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      className="relative h-full p-6 rounded-xl bg-white shadow-sm border border-green-100 overflow-hidden"
      whileHover={{
        scale: 1.03,
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)",
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: 0.1,
      }}
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-green-50 opacity-50" />
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-800">
          {icon}
        </div>
        <div>
          <h3 className="responsive-heading-3 text-green-900 mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}
