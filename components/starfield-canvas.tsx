"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

type Star = {
  x: number;
  y: number;
  r: number;
  depth: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
};

/**
 * Ciel étoilé léger en canvas 2D (pas de WebGL/3D) avec parallaxe discrète
 * à la souris. Dessiné une seule fois (sans boucle d'animation) si
 * prefers-reduced-motion est actif, ou si le thème n'est pas sombre.
 */
export default function StarfieldCanvas({
  className,
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container || !isDark) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function buildStars() {
      const count = Math.min(140, Math.round((width * height) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.1 + 0.3,
        depth: Math.random() * 0.6 + 0.2,
        alpha: Math.random() * 0.5 + 0.4,
        twinkleSpeed: Math.random() * 0.002 + 0.0006,
        twinklePhase: Math.random() * Math.PI * 2,
      }));
    }

    function resize() {
      if (!canvas || !container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx!.scale(dpr, dpr);
      buildStars();
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    function onPointerMove(e: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      target.x = (e.clientX - rect.left) / rect.width - 0.5;
      target.y = (e.clientY - rect.top) / rect.height - 0.5;
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, width, height);
      current.x += (target.x - current.x) * 0.04;
      current.y += (target.y - current.y) * 0.04;

      for (const star of stars) {
        const twinkle = reduceMotion
          ? star.alpha
          : star.alpha *
            (0.75 + 0.25 * Math.sin(time * star.twinkleSpeed + star.twinklePhase));
        const dx = current.x * star.depth * 24;
        const dy = current.y * star.depth * 24;
        ctx!.beginPath();
        ctx!.globalAlpha = twinkle;
        ctx!.fillStyle = "#ffffff";
        ctx!.arc(star.x + dx, star.y + dy, star.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    if (reduceMotion) {
      draw(0);
      return () => resizeObserver.disconnect();
    }

    container.addEventListener("pointermove", onPointerMove);
    let raf = 0;
    function loop(time: number) {
      draw(time);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
    };
  }, [isDark]);

  if (!isDark) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
    />
  );
}
