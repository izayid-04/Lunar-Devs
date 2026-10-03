import type { Metadata } from "next";
import DistrictsContent from "./districts-content";

export const metadata: Metadata = {
  title: "Services par quartier — Nova Terra",
  description: "Retrouvez les services municipaux de Nova Terra, quartier par quartier.",
};

export default function DistrictsPage() {
  return <DistrictsContent />;
}
