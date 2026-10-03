"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "motion/react";
import {
  Zap,
  Vote,
  HeartHandshake,
  TrainFront,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

const CITIZEN_PERKS = [
  {
    icon: TrainFront,
    title: "Navettes Maglev Gratuites",
    subtitle: "Réseau Inter-Dômes",
    desc: "Déplacez-vous à haute vitesse entre les six dômes de la colonie avec vos crédits de transport mensuels illimités.",
    badge: "Mobilité 100% Décarbonée",
  },
  {
    icon: Zap,
    title: "Allocation Énergétique Solaire",
    subtitle: "Tokamak & Photovoltaïque",
    desc: "Chaque résident bénéficie d'une part garantie d'énergie propre issue de la centrale Solaria pour son habitat.",
    badge: "Énergie 100% renouvelable",
  },
  {
    icon: Vote,
    title: "Démocratie Directe & Agora",
    subtitle: "Gouvernance Décentralisée",
    desc: "Votez directement sur les budgets d'aménagement, les parcs bio-hydroponiques et les projets de lois locales.",
    badge: "1 Citoyen = 1 Voix",
  },
  {
    icon: HeartHandshake,
    title: "Assistance Municipale 24/7",
    subtitle: "Intervention Immédiate",
    desc: "Des agents techniques et environnementaux veillent en continu sur la sécurité atmosphérique et vos demandes.",
    badge: "Disponible 24h/24",
  },
];

export default function CitizenPrivileges() {
  return (
    <section className="relative overflow-hidden border-b border-border py-24 px-6 bg-card/20">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] rounded-full bg-primary/5 blur-[160px]" />

      <div className="mx-auto max-w-6xl relative">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="border-primary/40 text-primary px-3 py-1 text-xs">
            Avantages & Droits Résidentiels
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            Pourquoi créer votre Passeport Citoyen ?
          </h2>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
            Rejoindre Nova Terra, ce n&apos;est pas seulement habiter une ville spatiale : c&apos;est être copropriétaire
            d&apos;une société pionnière pensée pour l&apos;autonomie, l&apos;abondance et le bien-être.
          </p>
        </div>

        {/* Dynamic feature cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CITIZEN_PERKS.map((perk, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full border border-border/70 bg-card/60 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <perk.icon className="size-5" />
                      </div>
                      <span className="text-[10px] font-mono font-medium rounded-full bg-muted/60 px-2 py-0.5 text-muted-foreground">
                        {perk.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground">
                      {perk.title}
                    </h3>
                    <p className="text-xs text-primary/80 font-medium mt-0.5">
                      {perk.subtitle}
                    </p>

                    <p className="text-xs text-muted-foreground leading-relaxed mt-3">
                      {perk.desc}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-border/40 pt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="size-3 text-success shrink-0" />
                    <span>Inclus dans le passeport civique</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Futuristic CTA Banner */}
        <div className="mt-14 rounded-3xl border border-primary/40 bg-gradient-to-r from-card via-primary/10 to-card p-8 sm:p-10 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-radial from-primary/20 to-transparent blur-2xl" />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative">
            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary font-medium">
                <ShieldCheck className="size-3.5" />
                Validation d&apos;identité instantanée
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Votre nouvelle vie extraterrestre commence maintenant
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Moins de 60 secondes suffisent pour créer votre profil, choisir votre dôme d&apos;attache et débloquer vos accès citoyens.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
              <Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/20">
                <Link href="/inscription">
                  Obtenir mon passeport
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/connexion">
                  Déjà citoyen ? Se connecter
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
