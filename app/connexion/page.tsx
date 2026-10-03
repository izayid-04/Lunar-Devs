import { Suspense } from "react";
import type { Metadata } from "next";
import ConnexionForm from "./connexion-form";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";

export const metadata: Metadata = {
  title: "Connexion — Nova Terra",
};

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center"
        >
          <LoadingSpinner />
          <span className="sr-only">Chargement…</span>
        </div>
      }
    >
      <ConnexionForm />
    </Suspense>
  );
}
