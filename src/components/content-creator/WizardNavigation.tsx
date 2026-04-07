"use client";

import type { WizardStep } from "@/lib/utils/validation";

interface WizardNavigationProps {
  currentStep: WizardStep;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
}

export default function WizardNavigation({
  currentStep,
  loading,
  onBack,
  onNext,
}: WizardNavigationProps) {
  // Step 1: no nav (topic CTA handles forward)
  // Step 3: Back only (hook selection auto-advances)
  // Step 6: no nav ("Start Over" in step content)
  if (currentStep === 1 || currentStep === 6) return null;

  const showBack = currentStep >= 2;
  const showNext =
    (currentStep === 2) ||
    (currentStep === 4) ||
    (currentStep === 5);

  const nextLabel = currentStep === 5 ? "Review All" : "Next";

  return (
    <div className="mt-8 flex items-center justify-between">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className="cta-btn-static inline-block"
          aria-label="Go to previous step"
        >
          <span className="cta-btn-inside block px-4 py-2.5 text-base">
            Back
          </span>
        </button>
      ) : (
        <div />
      )}
      {showNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className={`cta-btn-static relative inline-block ${loading ? "pointer-events-none opacity-50" : ""}`}
          aria-label={loading ? "Generating content" : `Go to next step`}
          aria-busy={loading}
        >
          <span className={`cta-btn-inside block px-4 py-2.5 text-base ${loading ? "opacity-0" : ""}`}>
            {nextLabel}
          </span>
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </span>
          )}
        </button>
      )}
    </div>
  );
}
