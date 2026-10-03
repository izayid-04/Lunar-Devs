"use client";

import { motion } from "motion/react";
import { UserPlus, Compass, Activity, ArrowRight } from "lucide-react";
import Reveal from "@/components/home/reveal";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    step: "01",
    icon: UserPlus,
    badge: "30 secondes",
    title: "Créez votre Passeport",
    text: "Enregistrement d'identité civique immédiat, sans paperasse, sécurisé par cryptographie.",
    linkText: "Créer un compte",
    href: "/inscription",
  },
  {
    step: "02",
    icon: Compass,
    badge: "Personnalisé",
    title: "Choisissez votre Dôme",
    text: "Rattachez-vous à l'un des 6 districts (Dôme Alpha, Port Spatial, Biocentre, etc.) selon vos activités.",
    linkText: "Voir les districts",
    href: "/districts",
  },
  {
    step: "03",
    icon: Activity,
    badge: "Temps réel",
    title: "Pilotez votre Quotidien",
    text: "Participez aux consultations, signalez des incidents et profitez de vos crédits d'énergie.",
    linkText: "Découvrir le Cockpit",
    href: "/connexion",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden border-b border-border px-6 py-24">
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e05d38_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />

      <div className="relative mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Parcours d&apos;accueil
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Comment rejoindre Nova Terra en 3 étapes
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            De votre arrivée à votre participation active dans la vie de la colonie, tout a été pensé pour être limpide, rapide et fluide.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.step} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group relative flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/60 p-6 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <step.icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-2xl font-bold text-muted-foreground/30 group-hover:text-primary/40 transition-colors">
                      {step.step}
                    </span>
                  </div>

                  <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {step.badge}
                  </span>

                  <h3 className="mt-3 text-base font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </div>

                <div className="mt-6 border-t border-border/50 pt-4">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto text-xs font-semibold text-primary hover:text-primary/80 hover:bg-transparent gap-1.5"
                  >
                    <Link href={step.href}>
                      {step.linkText}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
