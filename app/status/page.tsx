import type { Metadata } from "next";
import HealthCheck from "./health-check";

export const metadata: Metadata = {
  title: "Status — Nova Terra",
};

export default function StatusPage() {
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1>État du déploiement</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Page de test technique : build courant + connexion à l&apos;API.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Build
        </h2>
        <p className="mt-2 font-mono text-sm">
          {buildDate
            ? new Date(buildDate).toLocaleString("fr-FR", {
                dateStyle: "long",
                timeStyle: "medium",
              })
            : "Date de build inconnue"}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          API ({"NEXT_PUBLIC_API_URL"})
        </h2>
        <div className="mt-2">
          <HealthCheck />
        </div>
      </section>
    </div>
  );
}
