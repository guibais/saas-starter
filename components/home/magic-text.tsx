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
        staggerChildren: 0.015,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.015,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.span
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      style={{ display: "inline-flex", flexWrap: "wrap" }}
    >
      {words.map((word, wordIndex) => (
        <motion.span
          key={wordIndex}
          className="mr-1 mb-1 inline-flex whitespace-pre-wrap"
          variants={wordVariants}
        >
          {Array.from(word).map((char, charIndex) => (
            <motion.span
              key={charIndex}
              variants={childVariants}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      ))}
    </motion.span>
  );
}
