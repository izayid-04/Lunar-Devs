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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ConnexionForm() {
  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (!email.trim() || !password) {
      toast.error("Email et mot de passe sont requis.");
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);

    if (!result.ok) {
      setSubmitting(false);
      toast.error(result.message);
      return;
    }

    // Connexion réussie : bloquer l'interface et afficher le spinner pendant la transition
    setRedirecting(true);
    toast.success("Authentification réussie. Chargement de votre cockpit…");
    router.push(next);
  }

  if (redirecting) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <LoadingSpinner />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Ouverture de votre session Nova Terra…
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-h2">Connexion</CardTitle>
          <CardDescription>
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-primary underline">
              Inscrivez-vous
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="exemple@domaine.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="mt-2" disabled={submitting}>
              {submitting ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
