"use client";

import { useEffect, useRef } from "react";

// Ported from the AI Funnel Builder (21-AI-Funnel-Builder/apps/web/src/starfield.ts) so both
// sites share the same moving space background. Keep the algorithm in sync by hand.
type Star = { x: number; y: number; z: number; pz: number; c: string; sp: number };

const HUES = ["77,225,255", "120,170,255", "255,255,255", "160,140,255", "200,230,255"];

export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const N = innerWidth < 700 ? 150 : 280;
    const stars: Star[] = [];
    let W = 0, H = 0, cx = 0, cy = 0, spread = 0, raf = 0, running = false;

    function size() {
      W = c!.width = Math.floor(innerWidth * dpr);
      H = c!.height = Math.floor(innerHeight * dpr);
      c!.style.width = innerWidth + "px";
      c!.style.height = innerHeight + "px";
      cx = W / 2;
      cy = H / 2;
      spread = Math.max(cx, cy) * 0.42;
    }
    function spawn(s: Star, init: boolean): Star {
      const a = Math.random() * 6.2832, r = Math.pow(Math.random(), 0.6);
      s.x = Math.cos(a) * r;
      s.y = Math.sin(a) * r;
      s.z = init ? Math.random() : 1;
      s.pz = s.z;
      s.c = HUES[(Math.random() * HUES.length) | 0];
      s.sp = 0.0016 + Math.random() * 0.0018;
      return s;
    }
    function proj(s: Star, z: number): [number, number] {
      const k = spread / Math.max(z, 0.02);
      return [cx + s.x * k, cy + s.y * k];
    }
    function draw(dt: number) {
      g!.clearRect(0, 0, W, H);
      const m = dt / 16.67;
      for (const s of stars) {
        const p0 = proj(s, s.pz), p1 = proj(s, s.z);
        const a = Math.min(1, (1 - s.z) * 1.6);
        g!.strokeStyle = "rgba(" + s.c + "," + a.toFixed(3) + ")";
        g!.lineWidth = (1 - s.z) * 2.6 * dpr + 0.3;
        g!.lineCap = "round";
        g!.beginPath();
        g!.moveTo(p0[0], p0[1]);
        g!.lineTo(p1[0], p1[1]);
        g!.stroke();
        s.pz = s.z;
        s.z -= s.sp * m;
        if (s.z <= 0.02 || p1[0] < -20 || p1[0] > W + 20 || p1[1] < -20 || p1[1] > H + 20) spawn(s, false);
      }
    }

    let last = performance.now();
    function loop(t: number) {
      if (!running) return;
      const dt = Math.min(50, t - last);
      last = t;
      draw(dt);
      raf = requestAnimationFrame(loop);
    }
    // Reduced motion gets a single still frame; otherwise animate while the tab is visible.
    function start() {
      if (reduce) return draw(16);
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    size();
    while (stars.length < N) stars.push(spawn({ x: 0, y: 0, z: 1, pz: 1, c: "", sp: 0 }, true));

    const onVisibility = () => (document.hidden ? stop() : start());
    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        size();
        if (reduce) draw(16);
      }, 120);
    };
    document.addEventListener("visibilitychange", onVisibility);
    addEventListener("resize", onResize);
    start();

    return () => {
      stop();
      clearTimeout(rt);
      document.removeEventListener("visibilitychange", onVisibility);
      removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
