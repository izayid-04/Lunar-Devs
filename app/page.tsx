import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Lunar Devs</h1>
      <p className="mt-3 max-w-md text-zinc-600 dark:text-zinc-400">
        Squelette technique en place. L&apos;application du hackathon reste à
        écrire au lancement.
      </p>
      <Link
        href="/status"
        className="mt-8 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Vérifier le déploiement →
      </Link>
    </main>
  );
}
