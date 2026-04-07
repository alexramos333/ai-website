"use client";

import type { WizardStep } from "@/lib/utils/validation";

const stepLabels = [
  "Topic",
  "Headlines",
  "Hooks",
  "Script",
  "Description",
  "Review",
] as const;

interface StepProgressIndicatorProps {
  currentStep: WizardStep;
}

export default function StepProgressIndicator({ currentStep }: StepProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {stepLabels.map((label, i) => {
        const stepNum = (i + 1) as WizardStep;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors sm:h-10 sm:w-10 ${
                  isActive
                    ? "bg-gradient-to-r from-[#FF9B60] to-[#f2295b] text-white"
                    : isCompleted
                      ? "bg-[#004be0] text-white"
                      : "bg-white/10 text-white/40"
                }`}
              >
                {isCompleted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`mt-1 hidden text-xs sm:block ${
                  isActive
                    ? "font-bold text-white"
                    : isCompleted
                      ? "text-white/75"
                      : "text-white/40"
                }`}
              >
                {label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div
                className={`mx-1 h-0.5 w-4 sm:mx-2 sm:w-8 ${
                  stepNum < currentStep ? "bg-[#004be0]" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
