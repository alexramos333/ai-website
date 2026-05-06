"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  FogExp2,
  Points,
  PointsMaterial,
  BufferGeometry,
  BufferAttribute,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Sprite,
  SpriteMaterial,
  Group,
  CanvasTexture,
  Color,
  AdditiveBlending,
  DoubleSide,
} from "three";

/* ─── Constants ─── */

const BG_COLOR = 0x060d2e;
const FOG_DENSITY = 0.00055;
const TUNNEL_DEPTH = 3000;
const RECYCLE_Z = 180;

const PALETTES = [
  { line: 0x5de6fc, glow: [93, 230, 252] as const },
  { line: 0x305ae7, glow: [48, 90, 231] as const },
  { line: 0x6000ff, glow: [96, 0, 255] as const },
];

/* ─── Texture generators (canvas-based, no external images) ─── */

function makeGlowTexture(r: number, g: number, b: number): CanvasTexture {
  const sz = 256;
  const c = document.createElement("canvas");
  c.width = c.height = sz;
  const h = sz / 2;
  const ctx = c.getContext("2d")!;
  const gr = ctx.createRadialGradient(h, h, 0, h, h, h);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(0.12, `rgba(${r},${g},${b},0.7)`);
  gr.addColorStop(0.35, `rgba(${r},${g},${b},0.25)`);
  gr.addColorStop(0.7, `rgba(${r},${g},${b},0.06)`);
  gr.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, sz, sz);
  return new CanvasTexture(c);
}

function makeCircleTexture(): CanvasTexture {
  const sz = 64;
  const c = document.createElement("canvas");
  c.width = c.height = sz;
  const cx = sz / 2;
  const ctx = c.getContext("2d")!;
  const gr = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.45, "rgba(255,255,255,0.85)");
  gr.addColorStop(0.75, "rgba(255,255,255,0.25)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(cx, cx, cx, 0, Math.PI * 2);
  ctx.fill();
  return new CanvasTexture(c);
}

/* ─── Triangle helpers ─── */

function triPoints(size: number, rot: number): number[] {
  const p: number[] = [];
  for (let k = 0; k < 3; k++) {
    const a = rot + (k / 3) * Math.PI * 2;
    p.push(Math.cos(a) * size, Math.sin(a) * size, 0);
  }
  return p;
}

function makeWire(
  size: number,
  pal: (typeof PALETTES)[number],
  rot: number,
): Line {
  const p = triPoints(size, rot);
  const geo = new BufferGeometry();
  geo.setAttribute(
    "position",
    new BufferAttribute(
      new Float32Array([
        p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[0], p[1],
        p[2],
      ]),
      3,
    ),
  );
  return new Line(
    geo,
    new LineBasicMaterial({
      color: pal.line,
      blending: AdditiveBlending,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
  );
}

function makeFill(
  size: number,
  pal: (typeof PALETTES)[number],
  rot: number,
): Mesh {
  const p = triPoints(size, rot);
  const geo = new BufferGeometry();
  geo.setAttribute(
    "position",
    new BufferAttribute(
      new Float32Array([p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8]]),
      3,
    ),
  );
  geo.setIndex([0, 1, 2]);
  const [r, g, b] = pal.glow;
  return new Mesh(
    geo,
    new MeshBasicMaterial({
      color: new Color(r / 255, g / 255, b / 255),
      side: DoubleSide,
      blending: AdditiveBlending,
      transparent: true,
      opacity: 0.045,
      depthWrite: false,
    }),
  );
}

function makeVertexGlow(
  size: number,
  rot: number,
  glowTextures: CanvasTexture[],
  paletteIdx: number,
): Group {
  const grp = new Group();
  for (let k = 0; k < 3; k++) {
    const a = rot + (k / 3) * Math.PI * 2;
    const sp = new Sprite(
      new SpriteMaterial({
        map: glowTextures[paletteIdx],
        blending: AdditiveBlending,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    const gs = size * 0.55;
    sp.position.set(Math.cos(a) * size, Math.sin(a) * size, 0);
    sp.scale.set(gs, gs, 1);
    grp.add(sp);
  }
  return grp;
}

function makeCenterGlow(
  size: number,
  glowTextures: CanvasTexture[],
  paletteIdx: number,
): Sprite {
  const sp = new Sprite(
    new SpriteMaterial({
      map: glowTextures[paletteIdx],
      blending: AdditiveBlending,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  );
  const gs = size * 2.4;
  sp.scale.set(gs, gs, 1);
  return sp;
}

/* ─── Tunnel group data ─── */

interface GroupData {
  rotSpeed: number;
  floatAmp: number;
  floatFreq: number;
  floatOff: number;
}

/* ─── Component ─── */

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const rendererRef = useRef<WebGLRenderer | null>(null);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect mobile for reduced particles
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 4000 : 7000;
    const tunnelCount = isMobile ? 50 : 80;
    const bgTriCount = isMobile ? 30 : 50;

    /* ── Scene setup ── */
    const scene = new Scene();
    scene.fog = new FogExp2(BG_COLOR, FOG_DENSITY);

    const camera = new PerspectiveCamera(
      80,
      window.innerWidth / window.innerHeight,
      0.1,
      3000,
    );

    const renderer = new WebGLRenderer({
      canvas,
      antialias: !isMobile,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(BG_COLOR);
    rendererRef.current = renderer;

    /* ── Textures ── */
    const glowTextures = PALETTES.map((p) =>
      makeGlowTexture(p.glow[0], p.glow[1], p.glow[2]),
    );
    const circleTex = makeCircleTexture();

    /* ── Stars ── */
    const stPos = new Float32Array(starCount * 3);
    const stCol = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 400 + Math.random() * 1400;
      stPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      stPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      stPos[i * 3 + 2] = r * Math.cos(phi);
      const t = Math.random();
      if (t < 0.35) {
        stCol[i * 3] = 1;
        stCol[i * 3 + 1] = 1;
        stCol[i * 3 + 2] = 1;
      } else if (t < 0.6) {
        stCol[i * 3] = 0.404;
        stCol[i * 3 + 1] = 0.765;
        stCol[i * 3 + 2] = 1;
      } else if (t < 0.8) {
        stCol[i * 3] = 0.365;
        stCol[i * 3 + 1] = 0.902;
        stCol[i * 3 + 2] = 0.988;
      } else {
        stCol[i * 3] = 0.188;
        stCol[i * 3 + 1] = 0.353;
        stCol[i * 3 + 2] = 0.906;
      }
    }
    const stGeo = new BufferGeometry();
    stGeo.setAttribute("position", new BufferAttribute(stPos, 3));
    stGeo.setAttribute("color", new BufferAttribute(stCol, 3));
    const stars = new Points(
      stGeo,
      new PointsMaterial({
        size: 2.8,
        vertexColors: true,
        sizeAttenuation: true,
        map: circleTex,
        alphaTest: 0.001,
        blending: AdditiveBlending,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    );
    scene.add(stars);

    /* ── Spiral tunnel ── */
    const geoGroups: Group[] = [];
    const groupDataMap = new Map<Group, GroupData>();

    function spawnGroup(zPos: number) {
      const pi = Math.floor(Math.random() * PALETTES.length);
      const pal = PALETTES[pi];
      const st = (Math.abs(zPos) / TUNNEL_DEPTH) * Math.PI * 14;
      const sr = 25 + Math.random() * 65;
      const x =
        Math.cos(st) * sr + (Math.random() - 0.5) * 30;
      const y =
        Math.sin(st) * sr + (Math.random() - 0.5) * 20;
      const size = 10 + Math.random() * 40;
      const rot = Math.random() * Math.PI * 2;
      const grp = new Group();

      grp.add(makeCenterGlow(size, glowTextures, pi));
      grp.add(makeFill(size, pal, rot));
      grp.add(makeWire(size, pal, rot));
      grp.add(makeVertexGlow(size, rot, glowTextures, pi));

      if (Math.random() > 0.45) {
        const ir = rot + Math.PI / 3;
        const is2 = size * 0.52;
        grp.add(makeFill(is2, pal, ir));
        grp.add(makeWire(is2, pal, ir));
      }

      if (Math.random() > 0.6) {
        const or2 = rot - Math.PI / 6;
        const os = size * 1.55;
        const p2 = triPoints(os, or2);
        const og = new BufferGeometry();
        og.setAttribute(
          "position",
          new BufferAttribute(
            new Float32Array([
              p2[0], p2[1], p2[2], p2[3], p2[4], p2[5], p2[6], p2[7], p2[8],
              p2[0], p2[1], p2[2],
            ]),
            3,
          ),
        );
        grp.add(
          new Line(
            og,
            new LineBasicMaterial({
              color: pal.line,
              blending: AdditiveBlending,
              transparent: true,
              opacity: 0.3,
              depthWrite: false,
            }),
          ),
        );
      }

      grp.position.set(x, y, zPos);
      groupDataMap.set(grp, {
        rotSpeed: (Math.random() - 0.5) * 0.008,
        floatAmp: Math.random() * 0.06,
        floatFreq: 0.3 + Math.random() * 0.5,
        floatOff: Math.random() * Math.PI * 2,
      });
      scene.add(grp);
      geoGroups.push(grp);
    }

    for (let i = 0; i < tunnelCount; i++) {
      spawnGroup(-30 - i * (TUNNEL_DEPTH / tunnelCount));
    }

    /* ── Deep-space background triangles ── */
    for (let i = 0; i < bgTriCount; i++) {
      const pi = Math.floor(Math.random() * PALETTES.length);
      const bg = new Group();
      const wt = makeWire(
        4 + Math.random() * 18,
        PALETTES[pi],
        Math.random() * Math.PI * 2,
      );
      (wt.material as LineBasicMaterial).opacity =
        0.12 + Math.random() * 0.2;
      bg.add(wt);
      bg.position.set(
        (Math.random() - 0.5) * 1200,
        (Math.random() - 0.5) * 500,
        -300 - Math.random() * 900,
      );
      scene.add(bg);
    }

    /* ── Subtle mouse parallax (no drag required) ── */
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.2;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    /* ── Page Visibility — pause when tab is hidden ── */
    let hidden = false;
    const onVisibility = () => {
      hidden = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* ── Resize handler ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    /* ── Animation loop ── */
    let time = 0;
    let camZ = 0;
    const speed = 0.6; // Gentle auto-speed (no scroll control)

    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      if (hidden) return;

      time += 0.007;
      camZ -= speed;

      const wx =
        Math.sin(time * 0.17) * 22 + mouseX * 50;
      const wy =
        Math.cos(time * 0.12) * 12 +
        Math.sin(time * 0.06) * 7 -
        mouseY * 35;

      camera.position.set(wx, wy, camZ);
      camera.lookAt(
        wx + Math.sin(time * 0.17 + 0.25) * 18 + mouseX * 90,
        wy + Math.cos(time * 0.12 + 0.25) * 8 - mouseY * 70,
        camZ - 130,
      );
      camera.rotation.z =
        Math.sin(time * 0.09) * 0.08 + mouseX * 0.14;

      stars.position.copy(camera.position);

      for (let i = 0; i < geoGroups.length; i++) {
        const g = geoGroups[i];
        const ud = groupDataMap.get(g)!;
        g.rotation.z += ud.rotSpeed;
        g.position.y +=
          Math.sin(time * ud.floatFreq + ud.floatOff) * ud.floatAmp;

        if (g.position.z > camera.position.z + RECYCLE_Z) {
          const nz =
            camera.position.z - TUNNEL_DEPTH - Math.random() * 200;
          const st2 =
            (Math.abs(nz - camZ) / TUNNEL_DEPTH) * Math.PI * 14 + time;
          const sr2 = 25 + Math.random() * 65;
          g.position.set(
            Math.cos(st2) * sr2 + (Math.random() - 0.5) * 30,
            Math.sin(st2) * sr2 + (Math.random() - 0.5) * 20,
            nz,
          );
          ud.rotSpeed = (Math.random() - 0.5) * 0.008;
          ud.floatOff = Math.random() * Math.PI * 2;
        }
      }

      renderer.render(scene, camera);
    }

    // Render first frame, then trigger fade-in
    animate();
    requestAnimationFrame(() => {
      canvas.style.opacity = "1";
    });

    /* ── Cleanup ── */
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);

      // Dispose all scene objects
      scene.traverse((obj) => {
        if (obj instanceof Mesh || obj instanceof Line || obj instanceof Points) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
        if (obj instanceof Sprite) {
          obj.material.dispose();
        }
      });

      glowTextures.forEach((t) => t.dispose());
      circleTex.dispose();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        opacity: 0,
        transition: "opacity 1.5s ease-in",
        pointerEvents: "none",
      }}
    />
  );
}
