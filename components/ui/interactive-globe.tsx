"use client";

import React, { useEffect, useRef } from "react";
import createGlobe from "cobe";

interface MarkerLocation {
  location: [number, number]; // [lat, lon]
  size: number;
}

interface InteractiveGlobeProps {
  markers?: MarkerLocation[];
  focusLocation?: [number, number]; // [lat, lon] to rotate toward
  className?: string;
}

export default function InteractiveGlobe({
  markers = [],
  focusLocation,
  className = "",
}: InteractiveGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const currentPhi = useRef(0);
  const currentTheta = useRef(0.2);

  // Focus targets
  const targetPhi = useRef<number | null>(null);
  const targetTheta = useRef<number | null>(null);

  useEffect(() => {
    if (focusLocation) {
      const [lat, lon] = focusLocation;
      // Convert lat/lon to sphere coordinates (radians)
      targetPhi.current = -(lon * Math.PI) / 180;
      targetTheta.current = (lat * Math.PI) / 180;
    }
  }, [focusLocation]);

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

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: (width || 360) * 2,
      height: (width || 360) * 2,
      phi: 0,
      theta: 0.2,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 4.5,
      baseColor: [0.15, 0.15, 0.18],
      markerColor: [0.88, 0.36, 0.22], // Primary Nova Terra #e05d38
      glowColor: [0.88, 0.36, 0.22],
      markers: markers.map((m) => ({
        location: m.location,
        size: m.size,
      })),
    });

    let animationFrameId: number;

    const animate = () => {
      // If user isn't dragging
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
          // Idle auto rotation
          currentPhi.current += 0.003;
        }
      } else {
        // Manual drag rotation
        currentPhi.current += pointerInteractionMovement.current;
        pointerInteractionMovement.current = 0;
      }

      globe.update({
        phi: currentPhi.current,
        theta: currentTheta.current,
        width: (width || 360) * 2,
        height: (width || 360) * 2,
      });

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
      className={`relative flex items-center justify-center select-none cursor-grab active:cursor-grabbing ${className}`}
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
          const delta = (e.clientX - pointerInteracting.current) * 0.005;
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
          opacity: 0.95,
        }}
      />
    </div>
  );
}
