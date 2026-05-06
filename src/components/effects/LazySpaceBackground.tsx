"use client";

import dynamic from "next/dynamic";

const LazySpaceBackground = dynamic(
  () => import("@/components/effects/SpaceBackground"),
  { ssr: false },
);

export default LazySpaceBackground;
