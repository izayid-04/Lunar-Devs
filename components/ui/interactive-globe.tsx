"use client";

import React, { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";

export interface MarkerLocation {
  id: string;
  name: string;
  location: [number, number]; // [lat, lon]
  size: number;
}

interface InteractiveGlobeProps {
  markers?: MarkerLocation[];
  selectedIndex?: number;
  onSelectMarker?: (index: number) => void;
  className?: string;
}

// Convert lat/long to 3D Cartesian coords on a unit sphere
function toCartesian(lat: number, lon: number): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180 - Math.PI;
  const cosPhi = Math.cos(phi);
  return [-cosPhi * Math.cos(lambda), Math.sin(phi), cosPhi * Math.sin(lambda)];
}

export default function InteractiveGlobe({
  markers = [],
  selectedIndex = 0,
  onSelectMarker,
  className = "",
}: InteractiveGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const currentPhi = useRef(0);
  const currentTheta = useRef(0.2);

  // Target angles when clicking or focusing on a city
  const targetPhi = useRef<number | null>(null);
  const targetTheta = useRef<number | null>(null);

  // Screen positions for 2D clickable overlays (percentage 0 to 100)
  const [projectedMarkers, setProjectedMarkers] = useState<
    { id: string; name: string; x: number; y: number; visible: boolean; index: number }[]
  >([]);

  // When selected index changes, smooth rotate globe to that marker
  useEffect(() => {
    if (markers[selectedIndex]) {
      const [lat, lon] = markers[selectedIndex].location;
      targetPhi.current = -(lon * Math.PI) / 180;
      targetTheta.current = (lat * Math.PI) / 180;
    }
  }, [selectedIndex, markers]);

  useEffect(() => {
    let width = 0;
    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    if (!canvasRef.current) return;

    // Config Cobe customisée aux couleurs de NOVA TERRA :
    // baseColor sombre cobalt/spatial, glow orange vif #e05d38, mapSamples denses
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: (width || 360) * 2,
      height: (width || 360) * 2,
      phi: 0,
      theta: 0.2,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 24000,
      mapBrightness: 6,
      mapBaseBrightness: 0.08,
      baseColor: [0.18, 0.22, 0.32], // Teinte cobalt extraterrestre
      markerColor: [0.95, 0.45, 0.22], // Orange Nova Terra
      glowColor: [0.95, 0.4, 0.18], // Halo atmosphérique orange
      markers: markers.map((m) => ({
        location: m.location,
        size: m.size,
      })),
      // Anneaux orbitaux reliant les cités de Nova Terra (donne l'aspect d'une colonie spatiale)
      arcs: [
        { from: [45.2, 12.8], to: [-15.5, 48.2] },
        { from: [45.2, 12.8], to: [22.4, -40.6] },
        { from: [-15.5, 48.2], to: [22.4, -40.6] },
      ],
      arcColor: [0.95, 0.5, 0.25],
      arcWidth: 1.2,
      arcHeight: 0.25,
    });

    let animationFrameId: number;
    let tickCount = 0;

    const animate = () => {
      // Rotation physics
      if (pointerInteracting.current === null) {
        if (targetPhi.current !== null && targetTheta.current !== null) {
          const dPhi = targetPhi.current - currentPhi.current;
          const dTheta = targetTheta.current - currentTheta.current;
          currentPhi.current += dPhi * 0.05;
          currentTheta.current += dTheta * 0.05;

          if (Math.abs(dPhi) < 0.01 && Math.abs(dTheta) < 0.01) {
            targetPhi.current = null;
            targetTheta.current = null;
          }
        } else {
          currentPhi.current += 0.003;
        }
      } else {
        currentPhi.current += pointerInteractionMovement.current;
        pointerInteractionMovement.current = 0;
      }

      globe.update({
        phi: currentPhi.current,
        theta: currentTheta.current,
        width: (width || 360) * 2,
        height: (width || 360) * 2,
      });

      // Calculate 2D screen projections for interactive clickable markers (throttle to every 2 frames)
      tickCount++;
      if (tickCount % 2 === 0 && markers.length > 0) {
        const f = currentPhi.current;
        const l = currentTheta.current;
        const cosL = Math.cos(l);
        const cosF = Math.cos(f);
        const sinL = Math.sin(l);
        const sinF = Math.sin(f);
        const R = 0.85; // Cobe sphere radius

        const projected = markers.map((m, idx) => {
          const t = toCartesian(m.location[0], m.location[1]);
          const px = t[0] * R;
          const py = t[1] * R;
          const pz = t[2] * R;

          const c = cosF * px + sinF * pz;
          const s = sinF * sinL * px + cosL * py - cosF * sinL * pz;
          const isFront = -sinF * cosL * px + sinL * py + cosF * cosL * pz >= 0;

          // x and y in percentage 0..100
          const x = ((c + 1) / 2) * 100;
          const y = ((-s + 1) / 2) * 100;

          return {
            id: m.id,
            name: m.name,
            x,
            y,
            visible: isFront,
            index: idx,
          };
        });

        setProjectedMarkers(projected);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [markers]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none ${className}`}
    >
      {/* 3D Planet Canvas */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX;
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
        }}
        onPointerMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = (e.clientX - pointerInteracting.current) * 0.006;
            pointerInteractionMovement.current = delta;
            pointerInteracting.current = e.clientX;
          }
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            contain: "layout paint size",
            opacity: 0.98,
          }}
        />
      </div>

      {/* Interactive Clickable Pins Overlay */}
      {projectedMarkers.map((pin) => {
        if (!pin.visible) return null;
        const isCurrent = pin.index === selectedIndex;

        return (
          <button
            key={pin.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectMarker?.(pin.index);
            }}
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none z-20 pointer-events-auto"
            title={`Cliquer pour explorer : ${pin.name}`}
          >
            {/* Pulsing halo */}
            <span
              className={`absolute -inset-2 rounded-full transition-all ${
                isCurrent
                  ? "bg-primary/40 animate-ping opacity-75"
                  : "bg-primary/20 group-hover:bg-primary/40"
              }`}
            />
            {/* Center beacon pin */}
            <span
              className={`relative flex size-4 items-center justify-center rounded-full border border-white/80 shadow-lg transition-transform group-hover:scale-125 ${
                isCurrent ? "bg-white ring-2 ring-primary scale-110" : "bg-primary"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  isCurrent ? "bg-primary" : "bg-white"
                }`}
              />
            </span>

            {/* Floating Label */}
            <span
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap rounded-md border border-border/80 bg-background/95 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-md backdrop-blur-md transition-opacity pointer-events-none ${
                isCurrent
                  ? "opacity-100 border-primary text-primary"
                  : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {pin.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
