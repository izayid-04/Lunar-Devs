"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  Vote,
  HeartHandshake,
  TrainFront,
  ArrowRight
} from "lucide-react";

const CITIZEN_PERKS = [
  {
    icon: TrainFront,
    title: "Navettes Maglev Gratuites",
    desc: "Déplacez-vous à haute vitesse entre les six dômes de la colonie avec vos crédits de transport mensuels.",
  },
  {
    icon: Zap,
    title: "Quota d'Énergie Solaire Propre",
    desc: "Chaque résident bénéficie d'une allocation d'énergie issue des réacteurs à fusion et panneaux photovoltaïques.",
  },
  {
    icon: Vote,
    title: "Démocratie Directe par Dôme",
    desc: "Votez sur les projets municipaux d'aménagement, les créations de parcs bio-hydroponiques et les budgets locaux.",
  },
  {
    icon: HeartHandshake,
    title: "Assistance Municipale 24/7",
    desc: "Des agents dédiés interviennent en temps réel sur les transmissions techniques et urgences environnementales.",
  },
];

export default function CitizenPrivileges() {
  return (
    <section className="border-b border-border py-24 px-6 bg-card/30">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <Badge variant="outline" className="border-primary/40 text-primary px-3 py-1 text-xs">
            Avantages & Droits Résidentiels
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            Pourquoi créer votre Passeport Citoyen ?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Rejoindre Nova Terra, c&apos;est intégrer une société spatiale pionnière pensée pour le bien-être,
            la résilience écologique et l&apos;autonomie de chaque habitant.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CITIZEN_PERKS.map((perk, i) => (
            <Card key={i} className="border border-border/80 transition-all hover:border-primary/50 hover:shadow-lg">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <perk.icon className="size-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{perk.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{perk.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-primary/30 bg-gradient-to-r from-card via-primary/5 to-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Inscription simplifiée et validation instantanée
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-lg">
              Moins de 60 secondes pour enregistrer votre identité et débloquer immédiatement l&apos;accès au Cockpit et aux services municipaux.
            </p>
          </div>
          <Button asChild className="gap-2 shrink-0">
            <Link href="/inscription">
              Obtenir mon passeport
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
