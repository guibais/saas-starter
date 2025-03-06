"use client";

import { motion } from "framer-motion";

export function MagicText({
  children,
  className = "",
  delay = 0,
}: {
  children: string;
  className?: string;
  delay?: number;
}) {
  const words = children.split(" ");

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.02,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.02,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <motion.span
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      style={{ display: "inline-flex", flexWrap: "wrap" }}
    >
      {words.map((word, wordIndex) => (
        <motion.span
          key={wordIndex}
          className="mr-1 inline-flex whitespace-pre-wrap"
          variants={wordVariants}
        >
          {Array.from(word).map((char, charIndex) => (
            <motion.span key={charIndex} variants={childVariants}>
              {char}
            </motion.span>
          ))}
        </motion.span>
      ))}
    </motion.span>
  );
}
