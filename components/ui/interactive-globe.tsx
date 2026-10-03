"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

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

// Convert latitude and longitude to 3D Cartesian coordinates on sphere
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export default function InteractiveGlobe({
  markers = [],
  selectedIndex = 0,
  onSelectMarker,
  className = "",
}: InteractiveGlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);

  const [projectedMarkers, setProjectedMarkers] = useState<
    { id: string; name: string; x: number; y: number; visible: boolean; index: number }[]
  >([]);

  // Refs for smooth animation & full 360° drag interaction
  const targetRotation = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const prevPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotationVelocity = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update target rotation when selectedIndex changes
  useEffect(() => {
    if (markers[selectedIndex]) {
      const [lat, lon] = markers[selectedIndex].location;
      const targetY = -(lon * Math.PI) / 180;
      const targetX = (lat * Math.PI) / 180 * 0.45;
      targetRotation.current = { x: targetX, y: targetY };
    }
  }, [selectedIndex, markers]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    // 1. Three.js Scene, Camera, WebGLRenderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group that rotates
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // 2. Custom Texture Extraterrestre pour Nova Terra (Nuances mandarine, cuivre et cobalt profond)
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Fond marin / canyons extraterrestres bleu cobalt
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#0b101c");
    grad.addColorStop(0.5, "#151f38");
    grad.addColorStop(1, "#0b101c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Reliefs et continents cuivrés & terracotta de Solaria
    ctx.fillStyle = "#d46238";
    for (let i = 0; i < 48; i++) {
      const cx = (Math.sin(i * 3.7) * 0.5 + 0.5) * 1024;
      const cy = (Math.cos(i * 2.1) * 0.4 + 0.5) * 512;
      const rad = 45 + (i % 6) * 20;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crêtes géothermiques et failles dorées lumineuses
    ctx.strokeStyle = "#e8824f";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(100, 200);
    ctx.bezierCurveTo(300, 80, 500, 380, 750, 180);
    ctx.stroke();

    ctx.strokeStyle = "#ff9e58";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(250, 320);
    ctx.bezierCurveTo(450, 420, 650, 150, 900, 260);
    ctx.stroke();

    const planetTexture = new THREE.CanvasTexture(canvas);

    // 3. Sphère de la Planète
    const sphereGeo = new THREE.SphereGeometry(1.4, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
      map: planetTexture,
      roughness: 0.65,
      metalness: 0.25,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphereMesh);

    // 4. Atmosphère & Bouclier magnétique polygonal
    const cloudsGeo = new THREE.SphereGeometry(1.43, 40, 40);
    const cloudsMat = new THREE.MeshStandardMaterial({
      color: 0xe05d38,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      wireframe: true,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    globeGroup.add(cloudsMesh);

    // 5. Anneaux Planétaires de Nova Terra
    const ringGeo = new THREE.RingGeometry(1.75, 2.35, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe05d38,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.4;
    ringMesh.rotation.y = Math.PI / 12;
    globeGroup.add(ringMesh);

    // 6. Éclairage
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffaa66, 2.8);
    dirLight1.position.set(5, 3, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x4477bb, 1.2);
    dirLight2.position.set(-5, -2, -3);
    scene.add(dirLight2);

    // 7. Beacons 3D
    const markerMeshes: THREE.Mesh[] = [];
    markers.forEach((m) => {
      const pos = latLonToVector3(m.location[0], m.location[1], 1.42);
      const beaconGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.copy(pos);
      globeGroup.add(beaconMesh);
      markerMeshes.push(beaconMesh);
    });

    // 8. Animation & Projection
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      cloudsMesh.rotation.y += 0.001;

      // Rotation & Drag Physics (Horizontal + Vertical)
      if (!isDragging.current) {
        if (targetRotation.current) {
          const dx = targetRotation.current.x - globeGroup.rotation.x;
          const dy = targetRotation.current.y - globeGroup.rotation.y;
          globeGroup.rotation.x += dx * 0.06;
          globeGroup.rotation.y += dy * 0.06;

          if (Math.abs(dx) < 0.005 && Math.abs(dy) < 0.005) {
            targetRotation.current = null;
          }
        } else {
          // Inertia damping
          globeGroup.rotation.x += rotationVelocity.current.x;
          globeGroup.rotation.y += rotationVelocity.current.y;
          rotationVelocity.current.x *= 0.94;
          rotationVelocity.current.y *= 0.94;

          // Gentle idle rotation
          globeGroup.rotation.y += 0.0025;
        }
      }

      // Projection 3D vers 2D
      const tempV = new THREE.Vector3();
      const proj = markers.map((m, idx) => {
        const mesh = markerMeshes[idx];
        if (!mesh) return { id: m.id, name: m.name, x: 0, y: 0, visible: false, index: idx };

        mesh.getWorldPosition(tempV);
        const isFacing = tempV.z > 0.05;

        tempV.project(camera);
        const screenX = ((tempV.x + 1) / 2) * 100;
        const screenY = ((-tempV.y + 1) / 2) * 100;

        return {
          id: m.id,
          name: m.name,
          x: screenX,
          y: screenY,
          visible: isFacing,
          index: idx,
        };
      });

      setProjectedMarkers(proj);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [markers]);

  // Full 360° Drag & Scroll Handlers (UP, DOWN, LEFT, RIGHT)
  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    targetRotation.current = null;
    rotationVelocity.current = { x: 0, y: 0 };
    prevPointer.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !globeGroupRef.current) return;
    const dx = e.clientX - prevPointer.current.x;
    const dy = e.clientY - prevPointer.current.y;

    const deltaX = dy * 0.006;
    const deltaY = dx * 0.006;

    // Apply rotation immediately on both X (vertical) and Y (horizontal) axes
    globeGroupRef.current.rotation.x += deltaX;
    globeGroupRef.current.rotation.y += deltaY;

    // Cap vertical rotation to avoid flipping upside down
    globeGroupRef.current.rotation.x = Math.max(
      -Math.PI / 2.2,
      Math.min(Math.PI / 2.2, globeGroupRef.current.rotation.x)
    );

    rotationVelocity.current = { x: deltaX, y: deltaY };
    prevPointer.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      ref={mountRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      className={`relative flex items-center justify-center select-none cursor-grab active:cursor-grabbing touch-none ${className}`}
    >
      {/* Clickable 2D HTML Beacons with Labels & Halos */}
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
            {/* Pulsing beacon glow */}
            <span
              className={`absolute -inset-2.5 rounded-full transition-all ${
                isCurrent
                  ? "bg-primary/50 animate-ping opacity-90"
                  : "bg-primary/25 group-hover:bg-primary/50"
              }`}
            />

            {/* Glowing pin center */}
            <span
              className={`relative flex size-5 items-center justify-center rounded-full border-2 border-white shadow-xl transition-transform group-hover:scale-130 ${
                isCurrent ? "bg-white ring-4 ring-primary/60 scale-115" : "bg-primary"
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  isCurrent ? "bg-primary" : "bg-white"
                }`}
              />
            </span>

            {/* Always visible or hover label */}
            <span
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap rounded-md border border-border bg-card/95 px-2.5 py-1 text-[11px] font-bold text-foreground shadow-lg backdrop-blur-md transition-opacity pointer-events-none ${
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
