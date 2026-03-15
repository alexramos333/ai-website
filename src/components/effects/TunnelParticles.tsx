"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  opacity: number;
  speed: number;
}

const COLORS = ["#004BE0", "#0066FF", "#3399FF", "#ffffff"];
const DESKTOP_COUNT = 200;
const MOBILE_COUNT = 80;
const MAX_Z = 1000;
const FOCAL_LENGTH = 300;

function createParticle(): Particle {
  return {
    x: (Math.random() - 0.5) * 2000,
    y: (Math.random() - 0.5) * 2000,
    z: Math.random() * MAX_Z,
    size: Math.random() * 2 + 0.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    opacity: Math.random() * 0.6 + 0.2,
    speed: Math.random() * 3 + 1,
  };
}

function subscribeToReducedMotion(callback: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshot() {
  return false;
}

export default function TunnelParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const dimensionsRef = useRef({ width: 0, height: 0 });

  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx!.scale(dpr, dpr);
      dimensionsRef.current = { width: rect.width, height: rect.height };
    }

    resize();

    // Initialize particles
    const count = window.innerWidth < 768 ? MOBILE_COUNT : DESKTOP_COUNT;
    particlesRef.current = Array.from({ length: count }, createParticle);

    // Mouse tracking (desktop only)
    function handleMouseMove(e: MouseEvent) {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 50,
        y: (e.clientY / window.innerHeight - 0.5) * 50,
      };
    }

    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    function animate() {
      const { width, height } = dimensionsRef.current;
      if (!ctx || width === 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Reset transform before clearing to avoid accumulated scale
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const centerX = width / 2;
      const centerY = height / 2;
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.z -= p.speed;

        if (p.z <= 0) {
          p.x = (Math.random() - 0.5) * 2000;
          p.y = (Math.random() - 0.5) * 2000;
          p.z = MAX_Z;
          p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
          continue;
        }

        const scale = FOCAL_LENGTH / p.z;
        const screenX = p.x * scale + centerX + mouseRef.current.x * scale;
        const screenY = p.y * scale + centerY + mouseRef.current.y * scale;
        const radius = Math.max(p.size * scale, 0.5);
        const alpha = p.opacity * Math.min(scale, 1);

        if (
          screenX < -radius ||
          screenX > width + radius ||
          screenY < -radius ||
          screenY > height + radius
        ) {
          continue;
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", resize);
      if (isDesktop) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
