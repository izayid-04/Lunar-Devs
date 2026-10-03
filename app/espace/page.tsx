"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Award, FileText, CheckCircle2, Send, Plus, Clock } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  citizen: "Habitant",
  agent: "Agent municipal",
  admin: "Administrateur",
};

interface UserRequest {
  id: string;
  type: string;
  date: string;
  status: "En attente" | "En cours" | "Approuvé";
}

export default function EspacePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<UserRequest[]>([
    {
      id: "REQ-901",
      type: "Permis de déplacement Dôme Beta",
      date: "03/10 09:14",
      status: "En cours",
    },
    {
      id: "REQ-842",
      type: "Recharge forfait Maglev urbain",
      date: "01/10 14:22",
      status: "Approuvé",
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState("Signalement technique");
  const [requestSubject, setRequestSubject] = useState("");
  const [requestQuarter, setRequestQuarter] = useState("Dôme Alpha");

  if (!user) return null;

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestSubject.trim()) {
      toast.error("Veuillez préciser l'objet de votre démarche.");
      return;
    }

    const newReq: UserRequest = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      type: `${requestType} (${requestQuarter})`,
      date: "Aujourd'hui",
      status: "En attente",
    };

    setRequests([newReq, ...requests]);
    setRequestSubject("");
    setDialogOpen(false);
    toast.success("Votre demande a été transmise au centre de contrôle municipal !");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Espace Citoyen — {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez votre titre de résidence à Nova Terra, vos quotas d&apos;énergie et vos démarches.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Nouvelle Démarche
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Transmettre une démarche aux services municipaux</DialogTitle>
              <DialogDescription>
                Remplissez les détails ci-dessous pour alerter les agents municipaux du dôme.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitRequest} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="type">Type de démarche</Label>
                <select
                  id="type"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Signalement technique">Signalement technique / incident</option>
                  <option value="Permis de transit">Permis de transit Dôme Beta / Sas Maglev</option>
                  <option value="Allocation Énergie">Demande d&apos;extension de quota énergétique</option>
                  <option value="Certificat biométrique">Renouvellement titre de résidence</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quarter">Secteur concerné</Label>
                <select
                  id="quarter"
                  value={requestQuarter}
                  onChange={(e) => setRequestQuarter(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Dôme Alpha">Dôme Alpha (Centre)</option>
                  <option value="Dôme Beta">Dôme Beta (Bio-Agri)</option>
                  <option value="Port Spatial Gamma">Port Spatial Gamma</option>
                  <option value="Secteur Solaria">Secteur Solaria (Énergie)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject">Détail ou description</Label>
                <Input
                  id="subject"
                  placeholder="Ex: Éclairage balise clignotant, dysfonctionnement sas..."
                  value={requestSubject}
                  onChange={(e) => setRequestSubject(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="submit" className="w-full gap-2">
                  <Send className="size-4" />
                  Transmettre la requête
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Identité Citoyen */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5 text-primary" />
                  Passeport Citoyen Nova Terra
                </CardTitle>
                <CardDescription>
                  Identifiant biométrique et données du registre municipal.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary">
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3.5">
                <span className="text-xs text-muted-foreground">Nom officiel</span>
                <p className="text-base font-semibold">{user.firstName} {user.lastName}</p>
              </div>

              <div className="rounded-lg border border-border p-3.5">
                <span className="text-xs text-muted-foreground">Canal de contact</span>
                <p className="text-base font-semibold">{user.email}</p>
              </div>

              <div className="rounded-lg border border-border p-3.5">
                <span className="text-xs text-muted-foreground">Secteur assigné</span>
                <p className="text-base font-semibold">Dôme Alpha — Quartier Résidentiel</p>
              </div>

              <div className="rounded-lg border border-border p-3.5">
                <span className="text-xs text-muted-foreground">Identifiant Unique (UUID)</span>
                <p className="font-mono text-xs text-muted-foreground truncate">{user.id}</p>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-border p-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-success" />
                <div>
                  <p className="text-sm font-medium">Statut de Résidence Valide</p>
                  <p className="text-xs text-muted-foreground">
                    Accès illimité aux sas de transit Maglev et aux protocoles médicaux du Dôme Alpha.
                  </p>
                </div>
              </div>
            </div>

            {/* Suivi des démarches récentes */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Mes Démarches Municipales en Cours
                </span>
                <span className="text-xs text-muted-foreground">{requests.length} requêtes</span>
              </div>
              <div className="space-y-2">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{req.id}</span>
                        <span className="text-muted-foreground font-normal">• {req.type}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="size-3" /> {req.date}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        req.status === "Approuvé"
                          ? "border-success/40 text-success bg-success/10"
                          : req.status === "En cours"
                          ? "border-primary/40 text-primary bg-primary/10"
                          : "text-muted-foreground"
                      }
                    >
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quotas & Accès Rapides */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="size-4 text-primary" />
                Quotas de Consommation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Quota Énergie (Mensuel)</span>
                  <span className="font-semibold text-foreground">320 / 500 kWh</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-[64%] rounded-full bg-primary" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Crédits de Transport Maglev</span>
                  <span className="font-semibold text-foreground">45 / 50 trajets</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-[90%] rounded-full bg-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sas de Téléportation Rapide</CardTitle>
              <CardDescription>Actions directes vers les autres interfaces</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-xs" asChild>
                <a href="/dashboard">Visualiser le Cockpit Général</a>
              </Button>
              {user.role !== "citizen" && (
                <Button variant="outline" className="w-full justify-start text-xs" asChild>
                  <a href={`/${user.role}`}>Accéder au poste {user.role === "admin" ? "Admin" : "Agent"}</a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
