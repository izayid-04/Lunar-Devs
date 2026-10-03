"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
  pulseSpeed: number;
  pulseVal: number;
  color: string;
}

interface Drone {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  color: string;
  tailColor: string;
  size: number;
  altitude: number; // for slight scale / opacity depth
}

export default function SpaceDustTraffic() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const onResize = () => {
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = width * (window.devicePixelRatio || 1);
      canvas.height = height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };

    onResize();
    window.addEventListener("resize", onResize);

    // 1. Initialise les poussières stellaires / bio-spores
    const particleCount = 45;
    const particles: Particle[] = [];
    const colors = ["#e05d38", "#ff9e58", "#688fb5", "#ffffff"];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.6 + 0.2,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.2 - 0.1, // légère dérive ascensionnelle
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulseVal: Math.random() * Math.PI,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // 2. Initialise les micro-navettes / drones de transport
    const drones: Drone[] = [];
    const droneCount = 4;

    const spawnDrone = (): Drone => {
      const fromLeft = Math.random() > 0.3; // 70% vont de gauche à droite
      const speed = Math.random() * 1.4 + 0.8;
      const angle = (Math.random() - 0.5) * 0.35; // trajectoire légèrement inclinée
      const isCargo = Math.random() > 0.5;

      return {
        x: fromLeft ? -40 : width + 40,
        y: Math.random() * (height * 0.85) + 40,
        vx: fromLeft ? speed : -speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 28 + 20,
        color: isCargo ? "#e05d38" : "#8ab4f8",
        tailColor: isCargo ? "rgba(224, 93, 56, 0.4)" : "rgba(138, 180, 248, 0.4)",
        size: Math.random() * 1.5 + 1.5,
        altitude: Math.random() * 0.5 + 0.5,
      };
    };

    for (let i = 0; i < droneCount; i++) {
      const d = spawnDrone();
      d.x = Math.random() * width; // départ déjà en cours de vol
      drones.push(d);
    }

    // 3. Boucle d'animation à 60 FPS
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // A. Dessiner les poussières stellaires
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulseVal += p.pulseSpeed;

        // Wrap around borders
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dynamicAlpha = p.alpha * (0.6 + Math.sin(p.pulseVal) * 0.4);

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = dynamicAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Léger halo pour les plus grosses particules
        if (p.size > 1.8) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = dynamicAlpha * 0.25;
          ctx.fill();
        }
        ctx.restore();
      });

      // B. Dessiner les navettes / drones avec traînée de propulsion lumineuse
      drones.forEach((d, idx) => {
        d.x += d.vx;
        d.y += d.vy;

        const isGoingRight = d.vx > 0;
        const tailX = isGoingRight ? d.x - d.length : d.x + d.length;

        ctx.save();

        // Traînée de réacteur (gradient fondu)
        const trailGrad = ctx.createLinearGradient(d.x, d.y, tailX, d.y);
        trailGrad.addColorStop(0, d.color);
        trailGrad.addColorStop(0.3, d.tailColor);
        trailGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = d.size * 0.8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(tailX, d.y);
        ctx.stroke();

        // Tête de la navette (point blanc étincelant)
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Halo du cockpit / réacteur
        ctx.fillStyle = d.color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Si la navette sort de l'écran, on en fait réapparaître une nouvelle
        if (
          (isGoingRight && d.x > width + 60) ||
          (!isGoingRight && d.x < -60) ||
          d.y < -30 ||
          d.y > height + 30
        ) {
          drones[idx] = spawnDrone();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-70"
    />
  );
}
