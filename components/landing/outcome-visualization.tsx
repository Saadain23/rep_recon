"use client";

import { motion } from "framer-motion";
import { Award, AlertCircle, Shield, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Mock software logos - using favicon URLs
const softwareLogos = [
  { name: "Slack", url: "https://www.google.com/s2/favicons?domain=slack.com&sz=64" },
  { name: "Zoom", url: "https://www.google.com/s2/favicons?domain=zoom.us&sz=64" },
  { name: "Salesforce", url: "https://www.google.com/s2/favicons?domain=salesforce.com&sz=64" },
  { name: "Microsoft", url: "https://www.google.com/s2/favicons?domain=microsoft.com&sz=64" },
];

// Mock metric cards data
const metricCards = [
  {
    id: 1,
    title: "Trust Score",
    value: "85",
    max: "100",
    icon: Award,
    color: "emerald",
    delay: 0.2,
  },
  {
    id: 2,
    title: "Risk Level",
    value: "Low",
    icon: AlertCircle,
    color: "emerald",
    delay: 0.4,
  },
  {
    id: 3,
    title: "CVEs",
    value: "12",
    subtitle: "2 Critical",
    icon: Shield,
    color: "amber",
    delay: 0.6,
  },
  {
    id: 4,
    title: "Alternatives",
    value: "3",
    subtitle: "Recommended",
    icon: TrendingUp,
    color: "blue",
    delay: 0.8,
  },
];

const getColorClasses = (color: string) => {
  switch (color) {
    case "emerald":
      return {
        text: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50/50 dark:bg-emerald-950/30",
        border: "border-emerald-200/50 dark:border-emerald-800/50",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      };
    case "amber":
      return {
        text: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50/50 dark:bg-amber-950/30",
        border: "border-amber-200/50 dark:border-amber-800/50",
        iconBg: "bg-amber-100 dark:bg-amber-900/30",
      };
    case "blue":
      return {
        text: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50/50 dark:bg-blue-950/30",
        border: "border-blue-200/50 dark:border-blue-800/50",
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
      };
    default:
      return {
        text: "text-muted-foreground",
        bg: "bg-muted/50",
        border: "border-border",
        iconBg: "bg-muted",
      };
  }
};

export function OutcomeVisualization() {
  return (
    <div className="relative w-full h-full min-h-[600px] flex items-center justify-center overflow-visible">
      {/* SVG overlay for connecting lines - positioned behind logos and cards but visible */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(156, 163, 175)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="rgb(156, 163, 175)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="rgb(156, 163, 175)" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Lines from logos to center */}
        {softwareLogos.map((_, idx) => {
          const logoOffset = (idx - (softwareLogos.length - 1) / 2) * 80;
          const startY = 50 + (logoOffset / 600) * 100;
          return (
            <motion.line
              key={`line-in-${idx}`}
              x1="10%"
              y1={`${startY}%`}
              x2="45%"
              y2="50%"
              stroke="url(#lineGradient)"
              strokeWidth="1.5"
              className="dark:opacity-70"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 1.5,
                delay: 0.5 + idx * 0.1,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* Lines from center to metric cards */}
        {metricCards.map((_, idx) => {
          const cardOffset = (idx - (metricCards.length - 1) / 2) * 90;
          const endY = 50 + (cardOffset / 600) * 100;
          return (
            <motion.line
              key={`line-out-${idx}`}
              x1="55%"
              y1="50%"
              x2="82%"
              y2={`${endY}%`}
              stroke="url(#lineGradient)"
              strokeWidth="1.5"
              className="dark:opacity-70"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 1.5,
                delay: 1.2 + idx * 0.1,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* Animated dots moving along lines - slower and more subtle */}
        {softwareLogos.map((_, idx) => {
          const logoOffset = (idx - (softwareLogos.length - 1) / 2) * 80;
          const startY = 50 + (logoOffset / 600) * 100;
          return (
            <motion.circle
              key={`dot-in-${idx}`}
              r="3"
              fill="currentColor"
              className="text-gray-400 dark:text-gray-500"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.6, 0.6, 0],
                cx: ["10%", "45%"],
                cy: [`${startY}%`, "50%"],
              }}
              transition={{
                duration: 3,
                delay: 1.5 + idx * 0.2,
                repeat: Infinity,
                repeatDelay: 4,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {metricCards.map((_, idx) => {
          const cardOffset = (idx - (metricCards.length - 1) / 2) * 90;
          const endY = 50 + (cardOffset / 600) * 100;
          return (
            <motion.circle
              key={`dot-out-${idx}`}
              r="3"
              fill="currentColor"
              className="text-gray-400 dark:text-gray-500"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.6, 0.6, 0],
                cx: ["55%", "82%"],
                cy: ["50%", `${endY}%`],
              }}
              transition={{
                duration: 3,
                delay: 2 + idx * 0.2,
                repeat: Infinity,
                repeatDelay: 4,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </svg>

      {/* Software Logos on the Left */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-8 z-10">
        {softwareLogos.map((logo, idx) => (
          <motion.div
            key={logo.name}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.15, duration: 0.6 }}
            whileHover={{ scale: 1.1, x: 5 }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-xl border border-border/50 bg-card backdrop-blur-sm p-3 flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
              <img
                src={logo.url}
                alt={logo.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Center Node - Rep Recon Logo */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6, type: "spring", stiffness: 200 }}
      >
        <div className="relative w-20 h-20 rounded-xl border-2 border-border bg-card backdrop-blur-sm shadow-xl flex items-center justify-center overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <Image
            src="/rep_logo.png"
            alt="Rep Recon"
            width={56}
            height={56}
            className="relative z-10 object-contain p-1.5"
          />
        </div>
      </motion.div>

      {/* Metric Cards on the Right */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
        {metricCards.map((card) => {
          const colors = getColorClasses(card.color);
          const Icon = card.icon;

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: card.delay, duration: 0.6 }}
              whileHover={{ scale: 1.05, x: -5 }}
              className={cn(
                "w-48 rounded-lg border backdrop-blur-sm p-3 bg-card shadow-md hover:shadow-lg transition-all",
                colors.border
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </p>
                <div className={cn("p-1.5 rounded-md", colors.iconBg)}>
                  <Icon className={cn("w-3.5 h-3.5", colors.text)} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <p className={cn("text-2xl font-bold", colors.text)}>
                  {card.value}
                </p>
                {card.max && (
                  <span className="text-xs font-medium text-muted-foreground">
                    /{card.max}
                  </span>
                )}
              </div>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                  {card.subtitle}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}