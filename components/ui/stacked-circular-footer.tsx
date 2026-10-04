import Link from "next/link"
import { Icons } from "@/components/ui/icons"
import { Siren } from "lucide-react"

function StackedCircularFooter() {
  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center">
          <div className="mb-8 rounded-full bg-primary/10 p-6 flex items-center justify-center">
            <Icons.logo className="size-8 text-primary" />
          </div>
          <nav className="mb-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-primary">
              Accueil
            </Link>
            <Link href="/districts" className="transition-colors hover:text-primary">
              Districts
            </Link>
            <Link href="/transports" className="transition-colors hover:text-primary">
              Transports
            </Link>
            <Link href="/donnees-personnelles" className="transition-colors hover:text-primary">
              Vos données
            </Link>
            <Link href="/a-propos" className="transition-colors hover:text-primary">
              À propos
            </Link>
            <Link href="/connexion" className="transition-colors hover:text-primary">
              Connexion
            </Link>
            <Link href="/inscription" className="transition-colors hover:text-primary">
              Inscription
            </Link>
          </nav>
          <Link
            href="/alertes"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
          >
            <Siren className="size-4" />
            Rester informé — Alertes et annonces
          </Link>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 Nova Terra • Équipe Lunar Devs. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { StackedCircularFooter }

