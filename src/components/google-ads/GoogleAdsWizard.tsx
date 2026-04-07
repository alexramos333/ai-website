"use client";

import { useState, useCallback, useRef } from "react";
import type { GoogleAdsStep } from "@/lib/utils/validation";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import CTAButton from "@/components/ui/CTAButton";
import StepProgressIndicator from "@/components/content-creator/StepProgressIndicator";

interface GenerateResponse {
  result: string[];
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

function CopyButtonSmall({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
      aria-label={copied ? "Copied" : label}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="cta-btn-static inline-block shrink-0"
      aria-label={copied ? "Copied" : label}
    >
      <span className="cta-btn-inside block px-3 py-1.5 text-sm">
        {copied ? "Copied!" : label}
      </span>
    </button>
  );
}

function RegenerateButton({
  onClick,
  loading,
  label = "Regenerate",
}: {
  onClick: () => void;
  loading: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`cta-btn-static relative inline-block shrink-0 ${loading ? "pointer-events-none opacity-50" : ""}`}
      aria-label={loading ? "Regenerating..." : label}
      aria-busy={loading}
    >
      <span className={`cta-btn-inside block px-3 py-1.5 text-sm ${loading ? "opacity-0" : ""}`}>
        {label}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </span>
      )}
    </button>
  );
}

function NavBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cta-btn-static inline-block"
      aria-label="Go to previous step"
    >
      <span className="cta-btn-inside block px-4 py-2.5 text-base">Back</span>
    </button>
  );
}

function NavNextButton({
  onClick,
  loading,
  label = "Next",
}: {
  onClick: () => void;
  loading: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`cta-btn-static relative inline-block ${loading ? "pointer-events-none opacity-50" : ""}`}
      aria-label={loading ? "Generating content" : "Go to next step"}
      aria-busy={loading}
    >
      <span className={`cta-btn-inside block px-4 py-2.5 text-base ${loading ? "opacity-0" : ""}`}>
        {label}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </span>
      )}
    </button>
  );
}

const STEP_LABELS = ["Keywords", "Headlines", "Descriptions", "Review"] as const;

export default function GoogleAdsWizard() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollToTop = () => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const [currentStep, setCurrentStep] = useState<GoogleAdsStep>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<GoogleAdsStep>(1);
  const [keywords, setKeywords] = useState("");
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keywordsError, setKeywordsError] = useState("");

  const advanceMaxStep = (step: GoogleAdsStep) => {
    setMaxReachedStep((prev) => Math.max(prev, step) as GoogleAdsStep);
  };

  const generate = useCallback(
    async (
      step: number,
      overrides?: { headlines?: string[] },
    ): Promise<GenerateResponse | null> => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/google-ads/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step,
            keywords,
            headlines: overrides?.headlines ?? (headlines.length > 0 ? headlines : undefined),
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null) as { error?: string } | null;
          throw new Error(data?.error ?? "Failed to generate content.");
        }

        return (await response.json()) as GenerateResponse;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [keywords, headlines],
  );

  // ─── Forward navigation handlers ───

  const handleGenerateHeadlines = async () => {
    if (keywords.trim().length < 3) {
      setKeywordsError("Please enter at least a few keywords.");
      return;
    }
    setKeywordsError("");
    const data = await generate(2);
    if (data && Array.isArray(data.result)) {
      setHeadlines(data.result);
      setCurrentStep(2);
      advanceMaxStep(2);
      scrollToTop();
    }
  };

  const handleGenerateDescriptions = async () => {
    const data = await generate(3);
    if (data && Array.isArray(data.result)) {
      setDescriptions(data.result);
      setCurrentStep(3);
      advanceMaxStep(3);
      scrollToTop();
    }
  };

  // ─── Regenerate handlers ───

  const handleRegenerateHeadlines = async () => {
    const data = await generate(2);
    if (data && Array.isArray(data.result)) {
      setHeadlines(data.result);
      setDescriptions([]);
    }
  };

  const handleRegenerateDescriptions = async () => {
    const data = await generate(3);
    if (data && Array.isArray(data.result)) {
      setDescriptions(data.result);
    }
  };

  // ─── Navigation handlers ───

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as GoogleAdsStep);
      setError("");
      scrollToTop();
    }
  };

  const handleNext = () => {
    setError("");
    switch (currentStep) {
      case 2:
        handleGenerateDescriptions();
        break;
      case 3:
        setCurrentStep(4);
        advanceMaxStep(4);
        scrollToTop();
        break;
    }
  };

  const handleStepClick = (step: number) => {
    if (step <= maxReachedStep) {
      setCurrentStep(step as GoogleAdsStep);
      setError("");
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setMaxReachedStep(1);
    setKeywords("");
    setHeadlines([]);
    setDescriptions([]);
    setError("");
    setKeywordsError("");
  };

  const allContent = `KEYWORDS:\n${keywords}\n\n--- HEADLINES (30 chars max each) ---\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\n--- DESCRIPTIONS (90 chars max each) ---\n${descriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}`;

  return (
    <section ref={sectionRef} className="section-padding relative z-30">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          accentColor="blue"
          subtitle="Generate high-converting RSA headlines and descriptions for your Google Ads campaigns"
        >
          GOOGLE ADS RSA GENERATOR
        </SectionHeading>

        <div className="mt-10">
          <StepProgressIndicator
            labels={STEP_LABELS}
            currentStep={currentStep}
            maxReachedStep={maxReachedStep}
            onStepClick={handleStepClick}
          />
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8">
          {/* ─── Step 1: Keywords ─── */}
          {currentStep === 1 && (
            <GlassCard>
              <h3 className="text-xl font-black">Enter Your Keywords</h3>
              <p className="mt-2 text-sm text-white/75">
                Copy and paste all the keywords you want to use for your Google Ads campaign.
                Enter one keyword or phrase per line, or separate them with commas.
              </p>
              <div className="mt-6">
                <textarea
                  value={keywords}
                  onChange={(e) => {
                    setKeywords(e.target.value);
                    if (keywordsError) setKeywordsError("");
                  }}
                  placeholder={"e.g.,\nplumber near me\nemergency plumbing service\naffordable plumber\n24 hour plumber\nlocal plumbing company"}
                  className="h-48 w-full resize-y rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-white/40"
                  maxLength={2000}
                  aria-label="Campaign keywords"
                />
                {keywordsError && (
                  <p className="mt-2 text-sm text-red-400">{keywordsError}</p>
                )}
              </div>
              <div className="mt-6 text-center">
                <CTAButton
                  onClick={handleGenerateHeadlines}
                  aria-label="Generate headlines from your keywords"
                >
                  {loading ? "Generating..." : "Generate Headlines"}
                </CTAButton>
              </div>
            </GlassCard>
          )}

          {/* ─── Step 2: Headlines ─── */}
          {currentStep === 2 && (
            <GlassCard>
              <h3 className="text-xl font-black">Your RSA Headlines</h3>
              <p className="mt-2 text-sm text-white/75">
                30 high-converting headlines for your Google RSA campaign. Each headline is 30 characters or fewer.
              </p>
              <div className="mt-6 space-y-3">
                {headlines.map((headline, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/5 p-3"
                  >
                    <span className="text-sm">
                      <span className="mr-2 font-bold text-white/50">{i + 1}.</span>
                      {headline}
                    </span>
                    <CopyButtonSmall text={headline} />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <NavBackButton onClick={handleBack} />
                <div className="flex items-center gap-3">
                  <RegenerateButton
                    onClick={handleRegenerateHeadlines}
                    loading={loading}
                    label="Regenerate Headlines"
                  />
                  <NavNextButton onClick={handleNext} loading={loading} />
                </div>
              </div>
            </GlassCard>
          )}

          {/* ─── Step 3: Descriptions ─── */}
          {currentStep === 3 && (
            <GlassCard>
              <h3 className="text-xl font-black">Your RSA Descriptions</h3>
              <p className="mt-2 text-sm text-white/75">
                30 high-converting descriptions for your Google RSA campaign. Each description is 90 characters or fewer.
              </p>
              {loading && descriptions.length === 0 ? (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <p className="text-sm text-white/75">Loading...</p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {descriptions.map((desc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/5 p-3"
                    >
                      <span className="text-sm">
                        <span className="mr-2 font-bold text-white/50">{i + 1}.</span>
                        {desc}
                      </span>
                      <CopyButtonSmall text={desc} />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 flex items-center justify-between">
                <NavBackButton onClick={handleBack} />
                <div className="flex items-center gap-3">
                  <RegenerateButton
                    onClick={handleRegenerateDescriptions}
                    loading={loading}
                    label="Regenerate Descriptions"
                  />
                  <NavNextButton onClick={handleNext} loading={loading} label="Review All" />
                </div>
              </div>
            </GlassCard>
          )}

          {/* ─── Step 4: Review ─── */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <GlassCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Keywords</h3>
                  <CopyButton text={keywords} />
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-white/75">{keywords}</p>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Headlines (30 chars max)</h3>
                  <div className="flex gap-2">
                    <RegenerateButton
                      onClick={handleRegenerateHeadlines}
                      loading={loading}
                      label="Regenerate"
                    />
                    <CopyButton
                      text={headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}
                      label="Copy All"
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {headlines.map((headline, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-2.5"
                    >
                      <span className="text-sm">
                        <span className="mr-2 font-bold text-white/50">{i + 1}.</span>
                        {headline}
                      </span>
                      <CopyButtonSmall text={headline} />
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Descriptions (90 chars max)</h3>
                  <div className="flex gap-2">
                    <RegenerateButton
                      onClick={handleRegenerateDescriptions}
                      loading={loading}
                      label="Regenerate"
                    />
                    <CopyButton
                      text={descriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}
                      label="Copy All"
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {descriptions.map((desc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-2.5"
                    >
                      <span className="text-sm">
                        <span className="mr-2 font-bold text-white/50">{i + 1}.</span>
                        {desc}
                      </span>
                      <CopyButtonSmall text={desc} />
                    </div>
                  ))}
                </div>
              </GlassCard>

              <div className="flex flex-col items-center gap-4 pt-4">
                <CopyButton text={allContent} label="Copy All Content" />
                <CTAButton onClick={handleStartOver} aria-label="Start over with new keywords">
                  Start Over
                </CTAButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
