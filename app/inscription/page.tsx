"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

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
    toast.success("Compte créé. Vous pouvez vous connecter.");
    router.push("/connexion");
  }

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-6 py-16">
      <Card>
        <CardHeader>
          <h1 className="font-heading text-h2 font-semibold tracking-tight">
            Créer un compte habitant
          </h1>
          <CardDescription>
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="text-primary underline">
              Connectez-vous
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName">
                  Prénom <span className="text-xs text-muted-foreground font-normal">(obligatoire)</span>
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
                  <p id="firstName-error" role="alert" className="text-sm text-destructive">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName">
                  Nom <span className="text-xs text-muted-foreground font-normal">(obligatoire)</span>
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
                  <p id="lastName-error" role="alert" className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.lastName}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">
                Email <span className="text-xs text-muted-foreground font-normal">(obligatoire)</span>
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                placeholder="exemple@domaine.com"
                value={fields.email}
                onChange={(e) => update("email", e.target.value)}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">
                Mot de passe <span className="text-xs text-muted-foreground font-normal">(obligatoire, min. 8 car.)</span>
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                placeholder="Minimum 8 caractères"
                value={fields.password}
                onChange={(e) => update("password", e.target.value)}
              />
              {errors.password && (
                <p id="password-error" role="alert" className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">
                Confirmer le mot de passe <span className="text-xs text-muted-foreground font-normal">(obligatoire)</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                placeholder="Confirmez votre mot de passe"
                value={fields.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" role="alert" className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>

            <Button type="submit" className="mt-2" disabled={submitting}>
              {submitting ? "Création…" : "Créer mon compte"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
