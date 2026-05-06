"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePageTransition } from "@/contexts/TransitionContext";

export default function PageTransition() {
  const router = useRouter();
  const { isTransitioning, targetHref, completeTransition } = usePageTransition();

  function handleAnimationComplete() {
    router.push(targetHref);
    completeTransition();
  }

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          key="page-transition-overlay"
          className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="h-[120px] w-[120px] rounded-full"
            style={{
              background:
                "linear-gradient(#060d2e, #060d2e) padding-box, linear-gradient(135deg, #FF9B60, #f2295b) border-box",
              border: "4px solid transparent",
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={handleAnimationComplete}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
