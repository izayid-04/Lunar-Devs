import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import DockNav from "@/components/dock-nav";
import "./globals.css";

// Lisibilité : Geist pour tout le texte courant (vendue localement par
// Next.js, donc aucune requête réseau même au build).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Identité "ville spatiale" : police futuriste réservée aux titres
// (voir --font-heading dans globals.css). Fichiers vendorés dans
// app/fonts/ (next/font/local) plutôt que next/font/google : évite une
// dépendance réseau au moment du `next build` (observé flaky vers
// fonts.googleapis.com) — le rendu final est identique, auto-hébergé.
const orbitron = localFont({
  variable: "--font-orbitron",
  src: [
    { path: "./fonts/orbitron-600.ttf", weight: "600", style: "normal" },
    { path: "./fonts/orbitron-700.ttf", weight: "700", style: "normal" },
    { path: "./fonts/orbitron-800.ttf", weight: "800", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nova Terra",
  description: "La plateforme numérique de la ville de Nova Terra",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <div className="flex flex-1 flex-col pb-24">{children}</div>
            <DockNav />
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
