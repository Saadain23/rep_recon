"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { OutcomeVisualization } from "./outcome-visualization";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
    },
  },
};

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32 min-h-screen flex items-center">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Text content */}
        <motion.div
          className="text-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            variants={itemVariants}
          >
            <motion.span
              className="block text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              AI-Powered Security Analysis
            </motion.span>
            <motion.span
              className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              In Minutes, Not Hours
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed"
            variants={itemVariants}
          >
            Make informed decisions with automated multi-agent analysis. Get
            comprehensive security assessments, CVE analysis, compliance checks,
            and risk scoring—all powered by AI and ready in minutes.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            variants={itemVariants}
          >
            <Link href="/signup">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-black dark:bg-white text-white dark:text-black border border-input hover:opacity-90 shadow-sm text-base px-8"
                >
                  Start Assessment
                </Button>
              </motion.div>
            </Link>
            <Link href="/login">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-base px-8 border-input text-foreground hover:bg-accent"
                >
                  Sign in
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Right side - Visualization */}
        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <OutcomeVisualization />
        </motion.div>
      </div>
    </section>
  );
}