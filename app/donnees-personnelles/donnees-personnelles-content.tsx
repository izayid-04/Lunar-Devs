"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  postPrivacyInquiry,
  type PrivacyInquiryType,
  type PrivacyInquiry,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  Lock,
  Database,
  Clock,
  UserCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRINCIPLES = [
  {
    icon: Database,
    title: "Données strictement nécessaires",
    description:
      "Nous ne collectons que vos informations d'identité (nom, prénom, e-mail) et les détails nécessaires au traitement de vos démarches municipales et alertes de sécurité.",
  },
  {
    icon: Lock,
    title: "Chiffrement & Sécurité",
    description:
      "Vos échanges avec les services de Nova Terra sont chiffrés en transit et stockés sur des serveurs municipaux isolés sous notre contrôle exclusif.",
  },
  {
    icon: Clock,
    title: "Durées de conservation claires",
    description:
      "Comptes citoyens conservés pendant toute la durée de résidence sur la planète. Messages et alertes archivés pour une durée maximale de 24 mois avant anonymisation.",
  },
  {
    icon: UserCheck,
    title: "Vos droits garantis",
    description:
      "Droit d'accès, de rectification, d'effacement de vos données, d'opposition ou d'explication sur les traitements automatiques. Réponse sous 72h ouvrées.",
  },
];

const INQUIRY_TYPES: Record<PrivacyInquiryType, string> = {
  explication: "Demande d'explication / Inquiétude",
  acces: "Droit d'accès (copie de mes données)",
  rectification: "Droit de rectification (corriger une information)",
  effacement: "Droit à l'effacement (suppression de mes données)",
  opposition: "Droit d'opposition à un traitement",
  autre: "Autre demande spécifique",
};

export default function DonneesPersonnellesContent() {
  const { user, token } = useAuth();

  const [type, setType] = useState<PrivacyInquiryType>("explication");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedInquiry, setConfirmedInquiry] = useState<PrivacyInquiry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user || !token) {
      toast.error("Veuillez vous connecter pour transmettre une demande RGPD.");
      return;
    }

    if (user.role !== "citizen") {
      toast.error("Ce formulaire est réservé aux comptes citoyens.");
      return;
    }

    if (subject.trim().length < 5) {
      setError("L'objet de votre demande doit comporter au moins 5 caractères.");
      return;
    }

    if (description.trim().length < 15) {
      setError("Veuillez détailler votre demande (au moins 15 caractères).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await postPrivacyInquiry(token, {
        type,
        subject: subject.trim(),
        description: description.trim(),
      });
      setConfirmedInquiry(res);
      toast.success("Votre demande a été enregistrée.");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible de transmettre votre demande pour le moment.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setConfirmedInquiry(null);
    setSubject("");
    setDescription("");
    setType("explication");
    setError(null);
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* En-tête */}
      <section className="border-b border-border px-6 py-12 sm:py-16 text-center bg-card/40">
        <div className="mx-auto max-w-3xl">
          <Badge variant="outline" className="border-primary/40 text-primary gap-1.5 px-3 py-1 text-xs">
            <ShieldCheck className="size-3" />
            Transparence & RGPD Sol-04
          </Badge>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-foreground">
            Vos données personnelles à Nova Terra
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg max-w-2xl mx-auto">
            La municipalité s&apos;engage à protéger votre vie privée et à garantir un contrôle total sur vos données citoyennes.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 space-y-12">
        {/* Les 4 piliers d'information */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Ce que nous collectons et pourquoi</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Une charte simple et claire sans jargon juridique inutile.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {PRINCIPLES.map((principle, idx) => {
              const IconComp = principle.icon;
              return (
                <Card key={idx} className="border-border/80">
                  <CardHeader className="pb-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 mb-3">
                      <IconComp className="size-5" />
                    </div>
                    <CardTitle className="text-base font-bold">{principle.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {principle.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Formulaire citoyen de demande ou d'inquiétude RGPD */}
        <section className="border-t border-border pt-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Badge variant="outline" className="text-xs mb-2 gap-1 text-primary border-primary/30">
                <HelpCircle className="size-3" />
                Délégué à la Protection des Données (DPO)
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight">
                Une question ou une inquiétude sur vos données ?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Exercez vos droits ou demandez des éclaircissements à nos délégués municipaux.
              </p>
            </div>

            {/* Confirmation si transmise avec succès */}
            {confirmedInquiry ? (
              <Card className="border-success/40 bg-success/5 p-6 text-center space-y-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-success/20 text-success mx-auto">
                  <CheckCircle2 className="size-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">Demande transmise avec succès !</h3>
                  <p className="text-sm text-muted-foreground">
                    Votre demande a été prise en charge par les équipes de la ville.
                  </p>
                </div>

                <div className="bg-background/80 p-4 rounded-xl border border-border inline-block max-w-sm mx-auto my-2">
                  <span className="text-xs text-muted-foreground uppercase font-mono block">Référence de suivi :</span>
                  <span className="text-xl font-bold font-mono text-primary tracking-wider">
                    {confirmedInquiry.reference}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Vous pouvez suivre l&apos;évolution de cette demande et la réponse officielle directement dans votre espace personnel.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button asChild size="sm">
                    <Link href="/espace">
                      Consulter mes demandes
                      <ArrowRight className="size-3.5 ml-1.5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    Formuler une autre demande
                  </Button>
                </div>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    Formulaire d&apos;exercice des droits RGPD
                  </CardTitle>
                  <CardDescription>
                    Tous les champs sont obligatoires. Une référence officielle vous sera délivrée.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!user ? (
                    <div className="text-center py-6 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Vous devez disposer d&apos;un compte citoyen pour formuler une demande sécurisée et suivre sa réponse.
                      </p>
                      <Button asChild>
                        <Link href="/connexion">Se connecter à mon compte</Link>
                      </Button>
                    </div>
                  ) : user.role !== "citizen" ? (
                    <div className="p-4 rounded-lg bg-muted text-sm text-center text-muted-foreground">
                      Vous êtes connecté en tant qu&apos;agent ou administrateur. Pour traiter les demandes reçues, rendez-vous dans l&apos;espace de traitement.
                      <div className="mt-3">
                        <Button asChild variant="outline" size="sm">
                          <Link href="/agent/privacy">Traiter les demandes RGPD</Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <div
                          role="alert"
                          aria-live="assertive"
                          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                        >
                          <AlertCircle className="size-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="inquiry-type">
                          Nature de votre démarche <span className="text-xs text-muted-foreground">(obligatoire)</span>
                        </Label>
                        <Select
                          value={type}
                          onValueChange={(val) => setType(val as PrivacyInquiryType)}
                        >
                          <SelectTrigger id="inquiry-type" className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(INQUIRY_TYPES).map(([k, label]) => (
                              <SelectItem key={k} value={k}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="inquiry-subject">
                          Objet de votre demande <span className="text-xs text-muted-foreground">(obligatoire)</span>
                        </Label>
                        <Input
                          id="inquiry-subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Ex. Inquiétude sur la conservation des données de signalement"
                          className="mt-1.5"
                          required
                          aria-invalid={!!error && subject.trim().length < 5}
                        />
                      </div>

                      <div>
                        <Label htmlFor="inquiry-description">
                          Description détaillée <span className="text-xs text-muted-foreground">(obligatoire)</span>
                        </Label>
                        <textarea
                          id="inquiry-description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Expliquez précisément votre requête ou la préoccupation relative à vos données..."
                          rows={4}
                          required
                          className={cn(
                            "w-full mt-1.5 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors",
                            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                            error && description.trim().length < 15 && "border-destructive ring-destructive/20"
                          )}
                          aria-invalid={!!error && description.trim().length < 15}
                        />
                      </div>

                      <div className="pt-2">
                        <Button type="submit" disabled={submitting} className="w-full gap-2">
                          <Send className="size-4" />
                          {submitting ? "Transmission en cours…" : "Transmettre ma demande au DPO"}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
