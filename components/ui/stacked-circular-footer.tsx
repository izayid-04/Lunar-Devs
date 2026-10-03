import Link from "next/link"
import { Icons } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
          <div className="mb-8 flex space-x-4">
            <Button variant="outline" size="icon" className="rounded-full" asChild>
              <a href="#" aria-label="Facebook">
                <Icons.facebook className="h-4 w-4" />
                <span className="sr-only">Facebook</span>
              </a>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full" asChild>
              <a href="#" aria-label="Twitter">
                <Icons.twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </a>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full" asChild>
              <a href="#" aria-label="Instagram">
                <Icons.instagram className="h-4 w-4" />
                <span className="sr-only">Instagram</span>
              </a>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full" asChild>
              <a href="#" aria-label="LinkedIn">
                <Icons.linkedin className="h-4 w-4" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </Button>
          </div>
          <div className="mb-8 w-full max-w-md">
            <form onSubmit={(e) => e.preventDefault()} className="flex space-x-2">
              <div className="flex-grow">
                <Label htmlFor="footer-email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="footer-email"
                  placeholder="exemple@domaine.com"
                  type="email"
                  className="rounded-full"
                />
              </div>
              <Button type="submit" className="rounded-full">
                S&apos;abonner
              </Button>
            </form>
          </div>
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
