"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 relative overflow-hidden">
      {/* Subtle background animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Image
              src="/rep_logo.png"
              alt="Rep Recon Logo"
              width={24}
              height={24}
              className="rounded-lg border border-border"
            />
            <span className="font-semibold">Rep Recon</span>
          </motion.div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/login">
              <motion.span
                className="hover:text-foreground transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign in
              </motion.span>
            </Link>
            <Link href="/signup">
              <motion.span
                className="hover:text-foreground transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign up
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

