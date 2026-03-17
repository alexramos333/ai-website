"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribeToMediaQuery(query: string) {
  return (callback: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  };
}

function getMediaQuerySnapshot(query: string) {
  return () => window.matchMedia(query).matches;
}

function getServerSnapshot() {
  return false;
}

export default function VideoBackground() {
  const isMobile = useSyncExternalStore(
    subscribeToMediaQuery("(max-width: 767px)"),
    getMediaQuerySnapshot("(max-width: 767px)"),
    getServerSnapshot,
  );

  const prefersReducedMotion = useSyncExternalStore(
    subscribeToMediaQuery("(prefers-reduced-motion: reduce)"),
    getMediaQuerySnapshot("(prefers-reduced-motion: reduce)"),
    getServerSnapshot,
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Safety net: ensure playback starts even if autoPlay attribute doesn't fire
  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;

    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {
      // Autoplay blocked — video stays hidden, static fallback shows
    });
  }, [isMobile, prefersReducedMotion]);

  // Reduced motion or mobile: static fallback
  if (prefersReducedMotion || isMobile) {
    return (
      <div
        className="fixed inset-0 z-0 h-full w-full"
        style={{ background: "#001138" }}
      />
    );
  }

  // Desktop: single looping video with fade-in
  return (
    <div className="fixed inset-0 z-0 h-full w-full">
      {/* Static fallback behind video */}
      <div className="absolute inset-0" style={{ background: "#001138" }} />

      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: isReady ? 1 : 0,
          transition: "opacity 800ms ease-in-out",
        }}
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        onCanPlayThrough={() => setIsReady(true)}
      >
        <source src="/videos/space-void.webm" type="video/webm" />
        <source src="/videos/space-void.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
