import { Suspense } from "react";
import type { Metadata } from "next";
import ConnexionForm from "./connexion-form";

export const metadata: Metadata = {
  title: "Connexion — Nova Terra",
};

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <p className="px-6 py-16 text-center text-muted-foreground">
          Chargement…
        </p>
      }
    >
      <ConnexionForm />
    </Suspense>
  );
}
