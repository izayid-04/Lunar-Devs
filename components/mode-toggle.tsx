"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <label className="flex items-center gap-2 text-muted-foreground">
      <span className="sr-only">Activer le mode sombre</span>
      <Sun className="size-4" aria-hidden="true" />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Basculer entre mode clair et mode sombre"
      />
      <Moon className="size-4" aria-hidden="true" />
    </label>
  );
}
