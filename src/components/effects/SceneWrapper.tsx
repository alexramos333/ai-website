"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const VideoBackground = dynamic(() => import("./VideoBackground"), {
  ssr: false,
});

const TunnelParticles = dynamic(() => import("./TunnelParticles"), {
  ssr: false,
});

interface SceneWrapperProps {
  children: ReactNode;
}

export default function SceneWrapper({ children }: SceneWrapperProps) {
  return (
    <div className="relative min-h-[100svh] overflow-hidden">
      {/* z-0: Video background (self-positions as fixed) */}
      <VideoBackground />

      {/* z-10: Tunnel particles */}
      <div className="pointer-events-none fixed inset-0 z-10">
        <TunnelParticles />
      </div>

      {/* z-20: Dark overlay */}
      <div className="pointer-events-none fixed inset-0 z-20 bg-[#001138]/40" />

      {/* z-30: Page content */}
      <div className="relative z-30">{children}</div>
    </div>
  );
}
