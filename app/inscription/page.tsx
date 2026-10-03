"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Orbit,
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  FileText,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type Errors = Partial<Record<keyof Fields, string>>;

function validate(fields: Fields): Errors {
  const errors: Errors = {};
  if (!fields.firstName.trim()) errors.firstName = "Le prénom est requis.";
  if (!fields.lastName.trim()) errors.lastName = "Le nom est requis.";
  if (!fields.email.trim()) {
    errors.email = "L'email est requis.";
  } else if (!EMAIL_RE.test(fields.email.trim())) {
    errors.email = "Cet email ne semble pas valide.";
  }
  if (!fields.password) {
    errors.password = "Le mot de passe est requis.";
  } else if (fields.password.length < 8) {
    errors.password = "8 caractères minimum.";
  }
  if (fields.confirmPassword !== fields.password) {
    errors.confirmPassword = "Les mots de passe ne correspondent pas.";
  }
  return errors;
}

export default function InscriptionPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fields, setFields] = useState<Fields>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof Fields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors = validate(fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await register({
      firstName: fields.firstName.trim(),
      lastName: fields.lastName.trim(),
      email: fields.email.trim(),
      password: fields.password,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Compte créé avec succès. Vous pouvez maintenant vous connecter.");
    router.push("/connexion");
  }

  return (
    <div className="flex-1 flex flex-col justify-center mx-auto w-full max-w-6xl px-4 py-8 md:py-12 min-h-[calc(100vh-10rem)]">
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:grid-cols-12 my-auto">
        {/* Colonne gauche créative : Enrôlement citoyen & identité Nova Terra */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-sidebar via-background to-sidebar p-6 sm:p-10 lg:col-span-7">
          {/* Halos d'ambiance cosmique */}
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
                    Registre Civique Sol-04
                  </span>
                </div>
              </Link>
              <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary text-xs">
                <span className="size-1.5 rounded-full bg-primary animate-ping" />
                Inscription Ouverte
              </Badge>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                Rejoignez les citoyens de la cité planétaire
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                Créez votre compte en moins d&apos;une minute pour obtenir votre accès résidentiel, déclarer vos demandes municipales et bénéficier des services de nos six dômes.
              </p>
            </div>

            {/* Carte visuelle d'aperçu de la colonie */}
            <div className="group relative overflow-hidden rounded-xl border border-border/80 bg-background/60 p-4 backdrop-blur-sm transition-all hover:border-primary/40">
              <div className="flex items-center gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border">
                  <Image
                    src="/dome-alpha.webp"
                    alt="Vue du Dôme Alpha de Nova Terra"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Sparkles className="size-3.5 text-primary" />
                    <span>Passeport Citoyen Unifié</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    Attribution automatique du titre de résidence à la création
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1 text-success">
                      <span className="size-1.5 rounded-full bg-success" /> Gratuit & Immédiat
                    </span>
                    <span>Accès 24/7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Privilèges accordés aux nouveaux résidents */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <ShieldCheck className="size-4 shrink-0 text-primary mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">Sécurité & Chiffrement</p>
                  <p className="text-[11px] text-muted-foreground">Vos données personnelles protégées</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <FileText className="size-4 shrink-0 text-success mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">Guichet Municipal</p>
                  <p className="text-[11px] text-muted-foreground">Suivi en direct de toutes vos démarches</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rassurance / Déjà membre */}
          <div className="relative z-10 mt-8 rounded-xl border border-dashed border-border/80 bg-background/40 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Vous possédez déjà un identifiant municipal ?
              </span>
              <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                <Link href="/connexion">Se connecter</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Colonne droite : Formulaire d'inscription accessible */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:col-span-5 border-t lg:border-t-0 lg:border-l border-border bg-card">
          <div className="mx-auto w-full max-w-sm space-y-5">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Créer un compte habitant
              </h1>
              <p className="text-sm text-muted-foreground">
                Complétez les informations requises pour votre inscription.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
              <p className="text-xs text-muted-foreground">
                Tous les champs ci-dessous sont <span className="font-semibold text-foreground">obligatoires</span>.
              </p>

              {Object.keys(errors).length > 0 && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2"
                >
                  <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">Le formulaire contient des erreurs à corriger :</p>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5">
                      {Object.entries(errors).map(([field, err]) => (
                        <li key={field}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-xs font-semibold">
                    Prénom <span className="text-muted-foreground font-normal">(obligatoire)</span>
                  </Label>
                  <Input
                    id="firstName"
                    autoComplete="given-name"
                    aria-invalid={!!errors.firstName}
                    aria-describedby={errors.firstName ? "firstName-error" : undefined}
                    placeholder="Votre prénom"
                    value={fields.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                  />
                  {errors.firstName && (
                    <p id="firstName-error" role="alert" className="text-[11px] text-destructive flex items-center gap-1">
                      <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
                      <span>{errors.firstName}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-xs font-semibold">
                    Nom <span className="text-muted-foreground font-normal">(obligatoire)</span>
                  </Label>
                  <Input
                    id="lastName"
                    autoComplete="family-name"
                    aria-invalid={!!errors.lastName}
                    aria-describedby={errors.lastName ? "lastName-error" : undefined}
                    placeholder="Votre nom"
                    value={fields.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                  />
                  {errors.lastName && (
                    <p id="lastName-error" role="alert" className="text-[11px] text-destructive flex items-center gap-1">
                      <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
                      <span>{errors.lastName}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Adresse email <span className="text-muted-foreground font-normal">(obligatoire)</span>
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    placeholder="exemple@domaine.com"
                    className="pl-9"
                    value={fields.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" role="alert" className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold">
                    Mot de passe <span className="text-muted-foreground font-normal">(obligatoire)</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Min. 8 car.</span>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    placeholder="Minimum 8 caractères"
                    className="pl-9"
                    value={fields.password}
                    onChange={(e) => update("password", e.target.value)}
                  />
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                  Confirmer le mot de passe <span className="text-muted-foreground font-normal">(obligatoire)</span>
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                    placeholder="Confirmez votre mot de passe"
                    className="pl-9"
                    value={fields.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                  />
                </div>
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" role="alert" className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full gap-2 mt-2" disabled={submitting}>
                {submitting ? (
                  "Création du compte…"
                ) : (
                  <>
                    <span>Créer mon compte</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-3 border-t border-border text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Déjà inscrit ?{" "}
                <Link
                  href="/connexion"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Se connecter
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
