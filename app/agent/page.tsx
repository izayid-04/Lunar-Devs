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
import { BorderBeam } from "@/components/ui/border-beam";

type Statut = "nouvelle" | "en_cours" | "resolue";

const STATUT_LABEL: Record<Statut, string> = {
  nouvelle: "Nouvelle",
  en_cours: "En cours",
  resolue: "Résolue",
};

const STATUT_DOT: Record<Statut, string> = {
  nouvelle: "bg-nova-2 shadow-[0_0_6px_var(--nova-2)]",
  en_cours: "bg-warning shadow-[0_0_6px_var(--warning)]",
  resolue: "bg-success shadow-[0_0_6px_var(--success)]",
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-nova-2">
            Centre de contrôle
          </p>
          <h1 className="text-2xl font-semibold tracking-wide">
            Bonjour {user.firstName}
          </h1>
        </div>
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
      </div>

      <Card className="relative overflow-hidden">
        <BorderBeam
          size={80}
          duration={10}
          colorFrom="var(--nova-2)"
          colorTo="var(--nova)"
        />
        <CardHeader>
          <CardTitle className="font-mono text-sm tracking-widest text-muted-foreground">
            JOURNAL DES TRANSMISSIONS
          </CardTitle>
          <CardDescription>
            Demandes entrantes des habitants — données de démonstration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono">ID</TableHead>
                <TableHead>Expéditeur</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead className="hidden sm:table-cell">Quartier</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TRANSMISSIONS.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {tx.id}
                    <div className="font-mono text-[10px]">{tx.horodatage}</div>
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
