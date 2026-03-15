"use client";

import dynamic from "next/dynamic";

const PageTransition = dynamic(() => import("./PageTransition"), { ssr: false });

export default function LazyPageTransition() {
  return <PageTransition />;
}
