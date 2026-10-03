import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import DockNav from "@/components/dock-nav";
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
  title: "Nova Terra",
  description: "La plateforme numérique de la ville de Nova Terra",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
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
