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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-h2">Créer un compte habitant</CardTitle>
          <CardDescription>
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="text-primary underline">
              Connectez-vous
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  aria-invalid={!!errors.firstName}
                  placeholder="Amina"
                  value={fields.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  aria-invalid={!!errors.lastName}
                  placeholder="Ali"
                  value={fields.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                placeholder="amina.ali@novaterra.sol"
                value={fields.email}
                onChange={(e) => update("email", e.target.value)}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                placeholder="Au moins 8 caractères"
                value={fields.password}
                onChange={(e) => update("password", e.target.value)}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                placeholder="Répétez votre mot de passe"
                value={fields.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="mt-2" disabled={submitting}>
              {submitting ? "Création…" : "Créer mon compte"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
