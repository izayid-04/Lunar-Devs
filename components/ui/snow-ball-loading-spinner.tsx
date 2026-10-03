import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({
  className,
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-12",
    lg: "size-16",
  };

  const planetSizes = {
    sm: "size-3",
    md: "size-4.5",
    lg: "size-6",
  };

  const satelliteSizes = {
    sm: "size-1.5",
    md: "size-2",
    lg: "size-2.5",
  };

  return (
    <div
      role="status"
      aria-label="Chargement en cours"
      className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      {/* Orbite extérieure continue avec dégradé Tangerine */}
      <div className="absolute inset-0 rounded-full border border-primary/20" />

      {/* Anneau orbital tournant */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-spin spinner-spin" />

      {/* Deuxième anneau orbital pulsant */}
      <div
        className="absolute inset-1.5 rounded-full border border-dashed border-primary/40 animate-spin spinner-spin-reverse"
      />

      {/* Planète centrale Nova Terra avec halo lumineux */}
      <div
        className={cn(
          "relative z-10 rounded-full bg-gradient-to-br from-primary via-primary/90 to-amber-600 shadow-[0_0_14px_rgba(255,140,0,0.5)] flex items-center justify-center",
          planetSizes[size]
        )}
      >
        {/* Reflet sphérique interne */}
        <div className="size-full rounded-full bg-gradient-to-tr from-transparent via-white/25 to-white/40" />
      </div>

      {/* Petit satellite orbital en rotation */}
      <div
        className="absolute inset-0 animate-spin spinner-spin-slow"
      >
        <div
          className={cn(
            "rounded-full bg-primary shadow-[0_0_6px_var(--primary)] -translate-x-1/2 -translate-y-1/2",
            satelliteSizes[size]
          )}
          style={{ top: "0%", left: "50%" }}
        />
      </div>

      <span className="sr-only">Chargement…</span>
    </div>
  );
}
