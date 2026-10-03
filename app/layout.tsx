import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/lib/auth-context";
import { AccessibilityProvider } from "@/lib/accessibility-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import PublicFooter from "@/components/public-footer";
import DockNav from "@/components/dock-nav";
import MobileTopNavSpacer from "@/components/mobile-top-nav-spacer";
import AlertBanner from "@/components/alert-banner";
import "./globals.css";

// Une seule famille, pour les titres et le texte courant. Fichier vendoré
// dans app/fonts/ (next/font/local, police variable 400-700) plutôt que
// next/font/google : évite une dépendance réseau au moment du `next build`
// (déjà observé flaky vers fonts.googleapis.com) — rendu identique,
// auto-hébergé.
const inter = localFont({
  variable: "--font-inter",
  src: "./fonts/inter.woff2",
  weight: "400 700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nova Terra — Plateforme Numérique Citoyenne",
  description: "La plateforme numérique de la ville de Nova Terra pour les habitants, agents et administrateurs.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased text-size-normal`}
    >
      <body className="min-h-full flex flex-col">
        {/* Lien d'évitement clavier pour les lecteurs d'écran (F24) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Aller au contenu principal
        </a>

        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AccessibilityProvider>
            <TooltipProvider delayDuration={150}>
              <AuthProvider>
                {/* pb-24 : la barre de navigation flottante est fixe, elle ne
                    doit jamais recouvrir le bas du contenu ou du pied de page. */}
                <div className="flex flex-1 flex-col pb-24">
                  <MobileTopNavSpacer />
                  <AlertBanner scope="public" />
                  <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
                    {children}
                  </main>
                  <PublicFooter />
                </div>
                <DockNav />
              </AuthProvider>
              <Toaster />
            </TooltipProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
