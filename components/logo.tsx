// Logo "Nova Terra" : un petit emblème SVG original (planète + deux orbites
// croisées + une étoile), pas une image — quelques octets, net à toute taille.
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="nt-logo-planet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--nova)" />
          <stop offset="100%" stopColor="var(--nova-2)" />
        </linearGradient>
      </defs>
      <ellipse
        cx="24"
        cy="24"
        rx="21"
        ry="8.5"
        transform="rotate(-25 24 24)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.85"
      />
      <ellipse
        cx="24"
        cy="24"
        rx="21"
        ry="8.5"
        transform="rotate(25 24 24)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.45"
      />
      <circle cx="24" cy="24" r="7.5" fill="url(#nt-logo-planet)" />
      <circle cx="40" cy="14" r="1.6" fill="currentColor" />
    </svg>
  );
}
