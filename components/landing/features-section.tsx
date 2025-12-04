"use client";

import { motion } from "framer-motion";
import { Search, AlertTriangle, Shield, CheckCircle2, TrendingUp, FileText, LucideIcon } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const features = [
  {
    icon: Search,
    title: "Entity & Classification",
    description:
      "Automated identification of product details, vendor information, and software classification to understand what you're assessing.",
    area: "md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]",
  },
  {
    icon: AlertTriangle,
    title: "CVE Analysis",
    description:
      "Comprehensive vulnerability analysis with severity categorization, trend analysis, and patch response time evaluation.",
    area: "md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]",
  },
  {
    icon: Shield,
    title: "Incident Analysis",
    description:
      "Track security incidents, data breaches, and abuse signals to evaluate the vendor's security track record.",
    area: "md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]",
  },
  {
    icon: CheckCircle2,
    title: "Compliance Analysis",
    description:
      "Evaluate certifications, data handling practices, encryption standards, and compliance documentation availability.",
    area: "md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]",
  },
  {
    icon: TrendingUp,
    title: "Risk Scoring",
    description:
      "Get comprehensive trust scores with detailed rationale and actionable recommendations for your decision-making process.",
    area: "md:[grid-area:3/1/4/7] xl:[grid-area:2/8/3/11]",
  },
  {
    icon: FileText,
    title: "Executive Reports",
    description:
      "Receive executive-ready briefs with all findings, risk assessments, and alternative recommendations in one comprehensive document.",
    area: "md:[grid-area:3/7/4/13] xl:[grid-area:2/11/3/13]",
  },
];

interface GridItemProps {
  area: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const GridItem = ({ area, icon: Icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="border-0.75 relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-gray-600 p-2">
              <Icon className="h-4 w-4 text-black dark:text-neutral-400" />
            </div>
            <div className="space-y-3">
              <h3 className="-tracking-4 pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-balance text-black md:text-2xl/[1.875rem] dark:text-white">
                {title}
              </h3>
              <h2 className="font-sans text-sm/[1.125rem] text-black md:text-base/[1.125rem] dark:text-neutral-400 [&_b]:md:font-semibold [&_strong]:md:font-semibold">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export function FeaturesSection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -50, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      <div className="mx-auto max-w-6xl relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need for Security Assessment
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our multi-agent workflow system analyzes software across multiple
            security dimensions to provide you with comprehensive, actionable
            insights.
          </p>
        </motion.div>

        <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
          {features.map((feature) => (
            <GridItem
              key={feature.title}
              area={feature.area}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

