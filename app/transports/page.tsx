import type { Metadata } from "next";
import TransportsContent from "./transports-content";

export const metadata: Metadata = {
  title: "Transports & Liaisons Urbaines — Nova Terra",
  description:
    "Réseau de transports en commun de Nova Terra : navettes orbitales, maglevs, bus atmosphériques et liaisons maritimes.",
};

export default function TransportsPage() {
  return <TransportsContent />;
}
