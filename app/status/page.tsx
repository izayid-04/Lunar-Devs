import type { Metadata } from "next";
import HealthCheck from "./health-check";

export const metadata: Metadata = {
  title: "Status — Lunar Devs",
};

export default function StatusPage() {
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold">État du déploiement</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Page de test technique : build courant + connexion à l&apos;API.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
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
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          API ({"NEXT_PUBLIC_API_URL"})
        </h2>
        <div className="mt-2">
          <HealthCheck />
        </div>
      </section>
    </div>
  );
}
