"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  slug: string;
}

export default function ViewTracker({ slug }: ViewTrackerProps) {
  useEffect(() => {
    fetch(`/api/articles/${slug}/view`, { method: "POST" }).catch(() => {
      // Silently ignore — view tracking is best-effort
    });
  }, [slug]);

  return null;
}
