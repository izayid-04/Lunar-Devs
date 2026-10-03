import type { Metadata } from "next";
import DonneesPersonnellesContent from "./donnees-personnelles-content";

export const metadata: Metadata = {
  title: "Vos données personnelles & RGPD — Nova Terra",
  description:
    "Comprendre les données collectées par la ville de Nova Terra, leurs durées de conservation, vos droits et formuler une demande d'exercice de droits RGPD.",
};

export default function DonneesPersonnellesPage() {
  return <DonneesPersonnellesContent />;
}
