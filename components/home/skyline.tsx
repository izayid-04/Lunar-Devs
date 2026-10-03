const BUILDINGS = [
  { x: 10, w: 38, h: 64 },
  { x: 54, w: 26, h: 96 },
  { x: 86, w: 42, h: 52 },
  { x: 134, w: 32, h: 118 },
  { x: 172, w: 46, h: 80 },
  { x: 224, w: 28, h: 100 },
  { x: 258, w: 40, h: 68 },
  { x: 304, w: 32, h: 88 },
  { x: 342, w: 48, h: 56 },
];

const BASE_Y = 128;

// Silhouette de ville en SVG plat — pas de planète, pas de dégradé
// "galaxie" : une illustration de quartier simple, cohérente avec
// l'identité neutre + une seule couleur d'action.
export default function Skyline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 136"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <line
        x1="0"
        y1={BASE_Y + 0.5}
        x2="400"
        y2={BASE_Y + 0.5}
        stroke="var(--border)"
      />
      {BUILDINGS.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={BASE_Y - b.h}
          width={b.w}
          height={b.h}
          fill="var(--card)"
          stroke="var(--border)"
        />
      ))}
      {/* Quelques fenêtres, pour la vie du quartier — une seule allumée. */}
      <rect x={100} y={BASE_Y - 40} width="6" height="6" fill="var(--border)" />
      <rect x={146} y={BASE_Y - 90} width="6" height="6" fill="var(--border)" />
      <rect x={236} y={BASE_Y - 70} width="6" height="6" fill="var(--border)" />
      <rect x={316} y={BASE_Y - 60} width="6" height="6" fill="var(--primary)" />
    </svg>
  );
}
