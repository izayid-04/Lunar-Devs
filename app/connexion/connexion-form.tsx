"use client";

import { useState, type FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import {
  Orbit,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Radio,
  Activity,
  KeyRound,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export default function ConnexionForm() {
  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Si l'utilisateur est déjà connecté, rediriger immédiatement
  useEffect(() => {
    if (user && !submitting) {
      router.replace(next);
    }
  }, [user, submitting, router, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      const msg = "Email et mot de passe sont requis.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);

    if (!result.ok) {
      setSubmitting(false);
      setError(result.message);
      toast.error(result.message);
      return;
    }

    // Connexion réussie : bloquer l'interface et afficher le spinner pendant la transition
    setRedirecting(true);
    toast.success("Authentification réussie. Chargement de votre espace personnel…");
    router.push(next);
  }

  // Permet de remplir rapidement un compte démo pour tester
  function fillDemo(demoEmail: string, demoPass: string) {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  }

  if (redirecting) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <LoadingSpinner />
        <p className="text-sm font-medium text-muted-foreground animate-pulse" role="status">
          Ouverture de votre session orbitale Nova Terra…
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center mx-auto w-full max-w-6xl px-4 py-8 md:py-14 min-h-[calc(100vh-10rem)]">
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:grid-cols-12 my-auto">
        {/* Colonne gauche créative : Vitrine orbitale & statut de la colonie */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-sidebar via-background to-sidebar p-6 sm:p-10 lg:col-span-7">
          {/* Cercles d'ambiance et glow */}
          <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-accent/20 blur-3xl" />

          {/* En-tête gauche */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                  <Orbit className="size-5" />
                </div>
                <div>
                  <span className="font-bold tracking-tight text-foreground text-base">Nova Terra</span>
                  <span className="block text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                    Passerelle d&apos;accès
                  </span>
                </div>
              </Link>
              <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary text-xs">
                <span className="size-1.5 rounded-full bg-primary animate-ping" />
                Passerelle V2.4 Sécurisée
              </Badge>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                Bienvenue sur le réseau central de la colonie
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                Connectez-vous pour accéder à vos démarches citoyennes, suivre vos requêtes en temps réel et participer à la vie municipale de Nova Terra.
              </p>
            </div>

            {/* Carte visuelle de la planète et surveillance orbitale */}
            <div className="group relative overflow-hidden rounded-xl border border-border/80 bg-background/60 p-4 backdrop-blur-sm transition-all hover:border-primary/40">
              <div className="flex items-center gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border">
                  <Image
                    src="/nova-terra-planet.webp"
                    alt="Planète Nova Terra"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Radio className="size-3.5 text-primary animate-pulse" />
                    <span>Télémétrie Orbitale Active</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    Dôme Alpha • Pression 1.013 bar • O₂ stabilisé
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1 text-success">
                      <span className="size-1.5 rounded-full bg-success" /> En ligne
                    </span>
                    <span>Latence: 12ms</span>
                    <span>Chiffrement: SHA-256</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges de fonctionnalités */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <ShieldCheck className="size-4 shrink-0 text-primary mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">Accès Biométrique</p>
                  <p className="text-[11px] text-muted-foreground">Passeport Citoyen chiffré</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <Activity className="size-4 shrink-0 text-success mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">Guichet Express</p>
                  <p className="text-[11px] text-muted-foreground">Réponses sous 24h par nos agents</p>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'accès rapide / comptes de test */}
          <div className="relative z-10 mt-8 rounded-xl border border-dashed border-border/80 bg-background/40 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-primary" />
                Comptes de test (remplissage automatique) :
              </span>
              <span className="text-[10px] text-muted-foreground">Cliquer pour tester</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDemo("citoyen@novaterra.sol", "citoyen1234")}
                className="rounded-md border border-border/80 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
              >
                Habitant
              </button>
              <button
                type="button"
                onClick={() => fillDemo("agent@novaterra.sol", "agent1234")}
                className="rounded-md border border-border/80 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
              >
                Agent municipal
              </button>
              <button
                type="button"
                onClick={() => fillDemo("admin@novaterra.sol", "admin1234")}
                className="rounded-md border border-border/80 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
              >
                Administrateur
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite : Formulaire de connexion moderne */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:col-span-5 border-t lg:border-t-0 lg:border-l border-border bg-card">
          <div className="mx-auto w-full max-w-sm space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Connexion
              </h1>
              <p className="text-sm text-muted-foreground">
                Entrez vos identifiants pour rejoindre votre console.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <p className="text-xs text-muted-foreground">
                Tous les champs sont <span className="font-semibold text-foreground">obligatoires</span>.
              </p>

              {error && (
                <div
                  id="connexion-error"
                  role="alert"
                  aria-live="assertive"
                  className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-medium flex items-start gap-2"
                >
                  <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Adresse email <span className="text-muted-foreground font-normal">(obligatoire)</span>
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!error}
                    aria-describedby={error ? "connexion-error" : undefined}
                    placeholder="exemple@novaterra.sol"
                    className="pl-9"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold">
                    Mot de passe <span className="text-muted-foreground font-normal">(obligatoire)</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Min. 8 caractères</span>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={!!error}
                    aria-describedby={error ? "connexion-error" : undefined}
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gap-2 mt-2" disabled={submitting}>
                {submitting ? (
                  "Vérification des accès…"
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-border text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                Pas encore citoyen enregistré ?{" "}
                <Link
                  href="/inscription"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Créer un compte
                </Link>
              </p>
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Retourner à l&apos;accueil public</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

