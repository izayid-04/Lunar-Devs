import { UserPlus, LogIn, ListChecks } from "lucide-react";
import Reveal from "@/components/home/reveal";

const STEPS = [
  {
    icon: UserPlus,
    title: "Créez votre compte",
    text: "Prénom, nom, email et mot de passe — moins d'une minute.",
  },
  {
    icon: LogIn,
    title: "Connectez-vous",
    text: "Retrouvez un espace personnel clairement identifié.",
  },
  {
    icon: ListChecks,
    title: "Suivez vos démarches",
    text: "Vos informations et services municipaux au même endroit.",
  },
];

export default function HowItWorks() {
  return (
    <section className="border-b border-border px-6 py-20">
      <Reveal className="mx-auto max-w-xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          En pratique
        </p>
        <h2 className="mt-2">
          Comment ça marche
        </h2>
      </Reveal>

      <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.1}>
            <div className="flex h-full flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <step.icon className="size-5" aria-hidden="true" />
              </span>
              <p className="font-heading text-sm font-semibold">
                {i + 1}. {step.title}
              </p>
              <p className="text-sm text-muted-foreground">{step.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
