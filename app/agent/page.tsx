"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Radio, CheckCircle, Clock, RotateCw, Filter, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Statut = "nouvelle" | "en_cours" | "resolue";

interface Transmission {
  id: string;
  horodatage: string;
  expediteur: string;
  objet: string;
  quartier: string;
  statut: Statut;
  priorite: "Normale" | "Urgente" | "Critique";
}

const INITIAL_TRANSMISSIONS: Transmission[] = [
  {
    id: "TX-0231",
    horodatage: "08:12",
    expediteur: "N. Aliou",
    objet: "Éclairage public et balise défaillante",
    quartier: "Dôme Alpha",
    statut: "nouvelle",
    priorite: "Critique",
  },
  {
    id: "TX-0230",
    horodatage: "07:58",
    expediteur: "F. Said",
    objet: "Demande de renouvellement de titre Maglev",
    quartier: "Centre Administratif",
    statut: "en_cours",
    priorite: "Normale",
  },
  {
    id: "TX-0229",
    horodatage: "07:41",
    expediteur: "L. Boina",
    objet: "Signalement fuite micro-sas recyclage",
    quartier: "Biocentre Nova",
    statut: "en_cours",
    priorite: "Urgente",
  },
  {
    id: "TX-0228",
    horodatage: "07:02",
    expediteur: "A. Mroivili",
    objet: "Question horaires navette orbitale",
    quartier: "Port Spatial Gamma",
    statut: "resolue",
    priorite: "Normale",
  },
];

const STATUT_LABEL: Record<Statut, string> = {
  nouvelle: "Nouvelle",
  en_cours: "En cours",
  resolue: "Résolue",
};

const STATUT_DOT: Record<Statut, string> = {
  nouvelle: "bg-primary",
  en_cours: "bg-muted-foreground",
  resolue: "bg-success",
};

export default function AgentPage() {
  const { user } = useAuth();
  const [transmissions, setTransmissions] = useState<Transmission[]>(INITIAL_TRANSMISSIONS);
  const [filterQuarter, setFilterQuarter] = useState<string>("all");

  if (!user) return null;

  const cycleStatus = (id: string) => {
    setTransmissions((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextStatut: Statut =
          t.statut === "nouvelle"
            ? "en_cours"
            : t.statut === "en_cours"
            ? "resolue"
            : "nouvelle";
        
        toast.success(`Dossier ${id} mis à jour : ${STATUT_LABEL[nextStatut]}`);
        return { ...t, statut: nextStatut };
      })
    );
  };

  const filtered = filterQuarter === "all"
    ? transmissions
    : transmissions.filter((t) => t.quartier === filterQuarter);

  const pendingCount = transmissions.filter((t) => t.statut !== "resolue").length;

  return (
    <DashboardLayout roles={["agent", "admin"]}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/40 gap-1.5">
              <Radio className="size-3" />
              Opérations Municipales
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl mt-1">
            Console de Traitement — Agent Municipal
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi et intervention sur les dossiers citoyens en direct. Cliquez sur un statut pour le faire progresser.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
            <Sparkles className="size-3.5 text-primary" />
            {pendingCount} dossiers en attente
          </Badge>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground font-semibold">Nouvelles demandes</p>
            <p className="text-2xl font-bold mt-1 text-primary">
              {transmissions.filter((t) => t.statut === "nouvelle").length}
            </p>
          </div>
          <Clock className="size-6 text-primary/60" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground font-semibold">En cours d&apos;intervention</p>
            <p className="text-2xl font-bold mt-1">
              {transmissions.filter((t) => t.statut === "en_cours").length}
            </p>
          </div>
          <RotateCw className="size-6 text-muted-foreground" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground font-semibold">Dossiers Résolus</p>
            <p className="text-2xl font-bold mt-1 text-success">
              {transmissions.filter((t) => t.statut === "resolue").length}
            </p>
          </div>
          <CheckCircle className="size-6 text-success/60" />
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Journal des Transmissions Entrantes</CardTitle>
                <CardDescription>
                  Intervenez en temps réel sur les signalements reçus des quartiers.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="size-3.5 text-muted-foreground" />
                <select
                  value={filterQuarter}
                  onChange={(e) => setFilterQuarter(e.target.value)}
                  className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Tous les secteurs</option>
                  <option value="Dôme Alpha">Dôme Alpha</option>
                  <option value="Centre Administratif">Centre Administratif</option>
                  <option value="Biocentre Nova">Biocentre Nova</option>
                  <option value="Port Spatial Gamma">Port Spatial Gamma</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code ID</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Habitant</TableHead>
                  <TableHead>Objet du signalement</TableHead>
                  <TableHead className="hidden sm:table-cell">Secteur</TableHead>
                  <TableHead className="text-right">Action / Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {tx.id}
                      <div className="text-[10px]">{tx.horodatage}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          tx.priorite === "Critique"
                            ? "bg-destructive/15 text-destructive font-semibold text-[10px]"
                            : tx.priorite === "Urgente"
                            ? "bg-primary/15 text-primary text-[10px]"
                            : "text-[10px]"
                        }
                      >
                        {tx.priorite}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{tx.expediteur}</TableCell>
                    <TableCell className="max-w-56 truncate">{tx.objet}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {tx.quartier}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => cycleStatus(tx.id)}
                        className="gap-1.5 h-8 px-2 text-xs"
                      >
                        <span className={`size-2 rounded-full ${STATUT_DOT[tx.statut]}`} />
                        {STATUT_LABEL[tx.statut]}
                        <RotateCw className="size-3 text-muted-foreground ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
