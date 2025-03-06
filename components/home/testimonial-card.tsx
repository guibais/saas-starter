"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface Testimonial {
  stars: number;
  text: string;
  name: string;
  duration: string;
  initials: string;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
}

export function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  return (
    <motion.div
      className="relative bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{
        y: -5,
        boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="absolute top-0 right-0 h-20 w-20 bg-green-100 rounded-bl-full opacity-50" />

      <div className="p-6 relative z-10">
        <div className="flex text-yellow-400 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="fill-current" size={20} />
          ))}
        </div>
        <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-bold"
            whileHover={{ scale: 1.1 }}
          >
            {testimonial.initials}
          </motion.div>
          <div>
            <h4 className="font-bold">{testimonial.name}</h4>
            <p className="text-sm text-gray-500">{testimonial.duration}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
