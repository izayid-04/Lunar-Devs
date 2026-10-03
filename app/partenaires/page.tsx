import type { Metadata } from "next";
import PartenairesContent from "./partenaires-content";

export const metadata: Metadata = {
  title: "Associations partenaires — Nova Terra",
  description: "Répertoire des associations et acteurs partenaires de Nova Terra, par quartier.",
};

export default function PartenairesPage() {
  return <PartenairesContent />;
}
