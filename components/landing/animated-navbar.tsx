"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function AnimatedNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          animate={{
            paddingLeft: scrolled ? "2rem" : "0rem",
            paddingRight: scrolled ? "2rem" : "0rem",
            borderRadius: scrolled ? "1.5rem" : "0rem",
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ overflow: "hidden" }}
          className={`${
            scrolled
              ? "bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg mx-auto max-w-6xl"
              : "bg-transparent border-transparent"
          } mt-4`}
        >
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="logo-container">
                <Image
                  src="/rep_logo.png"
                  alt="Rep Recon Logo"
                  width={36}
                  height={36}
                  className="logo-image rounded-lg border border-border"
                />
              </div>
              <span className="text-xl font-bold text-foreground">
                Rep Recon
              </span>
            </motion.div>
            
            <div className="flex items-center gap-4">
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="hidden sm:inline-flex">
                    Sign in
                  </Button>
                </motion.div>
              </Link>
              <Link href="/signup">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-black dark:bg-white text-white dark:text-black border border-input hover:opacity-90 shadow-sm">
                    Get Started
                  </Button>
                </motion.div>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}