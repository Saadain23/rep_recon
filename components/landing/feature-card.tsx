"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative rounded-lg border bg-card p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Gradient overlay on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={false}
      />

      <motion.div
        className="mb-4 rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center relative z-10"
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        <Icon className="h-6 w-6 text-primary" />
      </motion.div>

      <h3 className="text-xl font-semibold mb-2 relative z-10">{title}</h3>
      <p className="text-muted-foreground leading-relaxed relative z-10">
        {description}
      </p>

      {/* Decorative element */}
      <motion.div
        className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-0"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}

