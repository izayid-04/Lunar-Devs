import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  Shield,
  TrainFront,
  Compass,
  Activity,
  Trees,
  CheckCircle2
} from "lucide-react";

export const metadata: Metadata = {
  title: "Les Six Districts — Nova Terra",
  description: "Explorez les dômes et secteurs vitaux de la ville spatiale de Nova Terra.",
};

const DISTRICTS_FULL = [
  {
    name: "Dôme Alpha (Capitale Urbaine)",
    type: "Centre Administratif & Culturel",
    icon: Compass,
    pop: "24 100 résidents",
    pressure: "1013 hPa",
    energy: "1.8 GW",
    desc: "Cœur politique et social abritant le Haut Conseil, les universités quantiques, les bibliothèques holographiques et le grand forum citoyen.",
    features: [
      "Siège des services municipaux",
      "Terminus central du réseau Maglev",
      "Bouclier magnétique renforcé",
    ],
  },
  {
    name: "Secteur Solaria",
    type: "Centrale Énergétique Stellaire",
    icon: Zap,
    pop: "3 200 ingénieurs",
    pressure: "1008 hPa",
    energy: "5.0 GW produit",
    desc: "Vastes champs de concentrateurs photovoltaïques et réacteurs tokamak à confinement magnétique alimentant tous les dômes de Nova Terra.",
    features: [
      "Stockage thermique en sels fondus",
      "Distribution haute tension supraconductrice",
      "Surveillance continue 24/7",
    ],
  },
  {
    name: "Biocentre Nova (Dôme Beta)",
    type: "Biosphère & Agriculture Hydroponique",
    icon: Trees,
    pop: "8 400 biologistes & résidents",
    pressure: "1015 hPa",
    energy: "0.9 GW",
    desc: "Complexe de tours végétales, serres aéroponiques et bassins d'algues générant 85% de la nourriture fraîche et régénérant l'oxygène colonial.",
    features: [
      "Cycles de photopériode automatisés",
      "Recyclage de l'eau à 99.4%",
      "Parcs botaniques ouverts au public",
    ],
  },
  {
    name: "Port Spatial Gamma",
    type: "Logistique & Transit Orbital",
    icon: TrainFront,
    pop: "6 500 agents & équipages",
    pressure: "1010 hPa",
    energy: "1.4 GW",
    desc: "Plateforme d'amarrage des navettes cargo, ascenseurs orbitaux et hangars de fret assurant le ravitaillement interplanétaire.",
    features: [
      "Sas de dépressurisation grande capacité",
      "Douanes et contrôles de biosécurité",
      "Liaison directe avec la navette vers la Terre",
    ],
  },
  {
    name: "Quartier Résidentiel Céleste",
    type: "Habitat & Espaces Familiaux",
    icon: Activity,
    pop: "14 200 résidents",
    pressure: "1012 hPa",
    energy: "1.1 GW",
    desc: "Modules résidentiels suspendus avec régulation acoustique, jardins suspendus et micro-marchés de quartier autonomes.",
    features: [
      "Écoles et centres de santé connectés",
      "Domotique à consommation optimisée",
      "Espaces de vie calmes et sécurisés",
    ],
  },
  {
    name: "Parc Technologique & Innovation",
    type: "Recherche & Fablabs",
    icon: Shield,
    pop: "4 100 chercheurs",
    pressure: "1011 hPa",
    energy: "1.3 GW",
    desc: "Laboratoires de métallurgie en gravité allégée, prototypage robotique et développement des futures extensions de la colonie.",
    features: [
      "Accélérateurs de particules modulaires",
      "Salles blanches de classe 1",
      "Incubateur de projets citoyens",
    ],
  },
];

export default function DistrictsPage() {
  return (
    <main className="flex flex-1 flex-col pb-24">
      {/* Header */}
      <section className="border-b border-border px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <Badge variant="outline" className="border-primary/40 text-primary px-3 py-1 text-xs">
            Géographie de la Cité Spatiale
          </Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            Les Six Districts de Nova Terra
          </h1>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
            Chaque secteur remplit une mission vitale dans l&apos;écosystème de Nova Terra.
            Découvrez leurs spécialités, leurs équipements et les conditions de vie sous les dômes.
          </p>
        </div>
      </section>

      {/* Grid of districts */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {DISTRICTS_FULL.map((d, i) => (
              <Card key={i} className="flex flex-col justify-between border-border hover:border-primary/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <d.icon className="size-5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {d.pressure}
                    </Badge>
                  </div>

                  <h2 className="text-lg font-bold text-foreground">{d.name}</h2>
                  <p className="text-xs text-primary font-medium mt-0.5">{d.type}</p>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{d.desc}</p>

                  <div className="mt-4 border-t border-border/60 pt-4 space-y-2">
                    {d.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="size-3.5 text-success shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-lg bg-muted/40 p-2.5 flex justify-between text-[11px] text-muted-foreground font-mono">
                    <span>Pop: {d.pop}</span>
                    <span>Charge: {d.energy}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="mt-16 rounded-2xl border border-border bg-card p-8 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold">Envie de vous installer dans l&apos;un des dômes ?</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Choisissez votre quartier de rattachement lors de votre inscription et accédez immédiatement à vos services de proximité.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button asChild>
                <Link href="/inscription">Créer mon passeport résident</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/a-propos">En savoir plus</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
