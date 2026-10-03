"use client";

import Protected from "@/components/protected";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
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

type Statut = "nouvelle" | "en_cours" | "resolue";

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

// Données de démonstration — en attente du flux réel des demandes
// (voir D19 / F22, pas encore câblé côté API).
const TRANSMISSIONS: {
  id: string;
  horodatage: string;
  expediteur: string;
  objet: string;
  quartier: string;
  statut: Statut;
}[] = [
  {
    id: "TX-0231",
    horodatage: "08:12",
    expediteur: "N. Aliou",
    objet: "Éclairage public défaillant",
    quartier: "Secteur Résidentiel",
    statut: "nouvelle",
  },
  {
    id: "TX-0230",
    horodatage: "07:58",
    expediteur: "F. Said",
    objet: "Demande de renouvellement de titre",
    quartier: "Centre Administratif",
    statut: "en_cours",
  },
  {
    id: "TX-0229",
    horodatage: "07:41",
    expediteur: "L. Boina",
    objet: "Signalement dépôt sauvage",
    quartier: "Parc Écologique",
    statut: "en_cours",
  },
  {
    id: "TX-0228",
    horodatage: "07:02",
    expediteur: "A. Mroivili",
    objet: "Question horaires navette",
    quartier: "Port Spatial",
    statut: "resolue",
  },
];

function AgentContent() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Centre de contrôle
        </p>
        <h1>Bonjour {user.firstName}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journal des transmissions</CardTitle>
          <CardDescription>
            Demandes entrantes des habitants — données de démonstration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Expéditeur</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead className="hidden sm:table-cell">Quartier</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TRANSMISSIONS.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {tx.id}
                    <div className="text-[10px]">{tx.horodatage}</div>
                  </TableCell>
                  <TableCell>{tx.expediteur}</TableCell>
                  <TableCell className="max-w-48 truncate">{tx.objet}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {tx.quartier}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1.5">
                      <span className={`size-1.5 rounded-full ${STATUT_DOT[tx.statut]}`} />
                      {STATUT_LABEL[tx.statut]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

export default function AgentPage() {
  return (
    <Protected roles={["agent", "admin"]}>
      <AgentContent />
    </Protected>
  );
}
