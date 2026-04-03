"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

interface VideoSource {
  webm: string;
  mp4: string;
}

const VIDEO_SOURCES: VideoSource[] = [
  { webm: "/videos/bg1.webm", mp4: "/videos/bg1.mp4" },
  { webm: "/videos/bg2.webm", mp4: "/videos/bg2.mp4" },
  { webm: "/videos/bg3.webm", mp4: "/videos/bg3.mp4" },
];

const CYCLE_INTERVAL = 5000;

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

  const [isReady, setIsReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [frontSlot, setFrontSlot] = useState<0 | 1>(0);

  const videoRef0 = useRef<HTMLVideoElement>(null);
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const slotIndicesRef = useRef<[number, number]>([0, -1]);

  // Cycle through videos
  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;

    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % VIDEO_SOURCES.length);
      setFrontSlot((prev) => (prev === 0 ? 1 : 0));
    }, CYCLE_INTERVAL);

    return () => clearInterval(id);
  }, [isMobile, prefersReducedMotion]);

  // Load next video into the back slot when activeIndex changes
  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;

    const backSlot = frontSlot === 0 ? 1 : 0;
    const backVideo = backSlot === 0 ? videoRef0.current : videoRef1.current;

    if (!backVideo) return;

    // Skip if this slot already has the correct source loaded
    if (slotIndicesRef.current[backSlot] === activeIndex) return;

    const source = VIDEO_SOURCES[activeIndex];
    backVideo.src = source.webm;
    backVideo.load();
    backVideo.play().catch(() => {
      // Try MP4 fallback if WebM fails
      backVideo.src = source.mp4;
      backVideo.load();
      backVideo.play().catch(() => {});
    });

    slotIndicesRef.current[backSlot] = activeIndex;
  }, [activeIndex, frontSlot, isMobile, prefersReducedMotion]);

  // Reduced motion: static gradient
  if (prefersReducedMotion) {
    return (
      <div
        className="fixed inset-0 z-0 h-full w-full"
        style={{
          background: "#001138",
        }}
      />
    );
  }

  // Mobile: animated gradient fallback
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-0 h-full w-full"
        style={{
          background: "#001138",
        }}
      />
    );
  }

  // Desktop: gradient fallback + dual video cross-fade
  return (
    <div className="fixed inset-0 z-0 h-full w-full">
      {/* Gradient fallback behind videos */}
      <div
        className="absolute inset-0"
        style={{
          background: "#001138",
        }}
      />

      {/* Video slot 0 */}
      <video
        ref={videoRef0}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: frontSlot === 0 && isReady ? 1 : 0,
          transition: "opacity 800ms ease-in-out",
        }}
        muted
        playsInline
        autoPlay
        loop
        onCanPlay={() => {
          if (!isReady) setIsReady(true);
        }}
      >
        <source src={VIDEO_SOURCES[0].webm} type="video/webm" />
        <source src={VIDEO_SOURCES[0].mp4} type="video/mp4" />
      </video>

      {/* Video slot 1 */}
      <video
        ref={videoRef1}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: frontSlot === 1 ? 1 : 0,
          transition: "opacity 800ms ease-in-out",
        }}
        muted
        playsInline
        loop
      />
    </div>
  );
}
