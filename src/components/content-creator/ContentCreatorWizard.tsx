"use client";

import { useState, useCallback } from "react";
import type { WizardStep } from "@/lib/utils/validation";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import CTAButton from "@/components/ui/CTAButton";
import StepProgressIndicator from "./StepProgressIndicator";
import WizardNavigation from "./WizardNavigation";

interface GenerateResponse {
  result: string[] | string;
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

export default function ContentCreatorWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<WizardStep>(1);
  const [topic, setTopic] = useState("");
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [hooks, setHooks] = useState<string[]>([]);
  const [selectedHook, setSelectedHook] = useState("");
  const [script, setScript] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [topicError, setTopicError] = useState("");

  const advanceMaxStep = (step: WizardStep) => {
    setMaxReachedStep((prev) => Math.max(prev, step) as WizardStep);
  };

  const generate = useCallback(
    async (
      step: number,
      overrides?: { selectedHook?: string; script?: string },
    ): Promise<GenerateResponse | null> => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/content-creator/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step,
            topic,
            headlines: headlines.length > 0 ? headlines : undefined,
            selectedHook: overrides?.selectedHook ?? (selectedHook || undefined),
            script: overrides?.script ?? (script || undefined),
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
    [topic, headlines, selectedHook, script],
  );

  // ─── Forward navigation handlers ───

  const handleGenerateHeadlines = async () => {
    if (topic.trim().length < 3) {
      setTopicError("Topic must be at least 3 characters.");
      return;
    }
    setTopicError("");
    const data = await generate(2);
    if (data && Array.isArray(data.result)) {
      setHeadlines(data.result);
      setCurrentStep(2);
      advanceMaxStep(2);
    }
  };

  const handleGenerateHooks = async () => {
    const data = await generate(3);
    if (data && Array.isArray(data.result)) {
      setHooks(data.result);
      setCurrentStep(3);
      advanceMaxStep(3);
    }
  };

  const handleSelectHook = async (hook: string) => {
    setSelectedHook(hook);
    const data = await generate(4, { selectedHook: hook });
    if (data && typeof data.result === "string") {
      setScript(data.result);
      setCurrentStep(4);
      advanceMaxStep(4);
    }
  };

  const handleGenerateDescription = async () => {
    const data = await generate(5, { script });
    if (data && typeof data.result === "string") {
      setDescription(data.result);
      setCurrentStep(5);
      advanceMaxStep(5);
    }
  };

  // ─── Regenerate handlers (stay on current step, clear downstream) ───

  const handleRegenerateHeadlines = async () => {
    const data = await generate(2);
    if (data && Array.isArray(data.result)) {
      setHeadlines(data.result);
      setHooks([]);
      setSelectedHook("");
      setScript("");
      setDescription("");
    }
  };

  const handleRegenerateHooks = async () => {
    const data = await generate(3);
    if (data && Array.isArray(data.result)) {
      setHooks(data.result);
      setSelectedHook("");
      setScript("");
      setDescription("");
    }
  };

  const handleRegenerateScript = async () => {
    const data = await generate(4, { selectedHook });
    if (data && typeof data.result === "string") {
      setScript(data.result);
      setDescription("");
    }
  };

  const handleRegenerateDescription = async () => {
    const data = await generate(5, { script });
    if (data && typeof data.result === "string") {
      setDescription(data.result);
    }
  };

  // ─── Navigation handlers ───

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
      setError("");
    }
  };

  const handleNext = () => {
    setError("");
    switch (currentStep) {
      case 2:
        handleGenerateHooks();
        break;
      case 4:
        handleGenerateDescription();
        break;
      case 5:
        setCurrentStep(6);
        advanceMaxStep(6);
        break;
    }
  };

  const handleStepClick = (step: WizardStep) => {
    if (step <= maxReachedStep) {
      setCurrentStep(step);
      setError("");
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setMaxReachedStep(1);
    setTopic("");
    setHeadlines([]);
    setHooks([]);
    setSelectedHook("");
    setScript("");
    setDescription("");
    setError("");
    setTopicError("");
  };

  const allContent = `TOPIC: ${topic}\n\n--- HEADLINES ---\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\n--- SELECTED HOOK ---\n${selectedHook}\n\n--- SCRIPT ---\n${script}\n\n--- DESCRIPTION ---\n${description}`;

  return (
    <section className="section-padding relative z-30">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          accentColor="blue"
          subtitle="Generate headlines, hooks, scripts, and descriptions for your video content"
        >
          AI CONTENT CREATOR
        </SectionHeading>

        <div className="mt-10">
          <StepProgressIndicator
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
          {/* ─── Step 1: Topic ─── */}
          {currentStep === 1 && (
            <GlassCard>
              <h3 className="text-xl font-black">What&apos;s your video about?</h3>
              <p className="mt-2 text-sm text-white/75">
                Enter your video topic or idea and we&apos;ll generate compelling content for you.
              </p>
              <div className="mt-6">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (topicError) setTopicError("");
                  }}
                  placeholder="e.g., How to start a profitable side hustle in 2026"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-white/40"
                  maxLength={200}
                  aria-label="Video topic"
                />
                {topicError && (
                  <p className="mt-2 text-sm text-red-400">{topicError}</p>
                )}
              </div>
              <div className="mt-6 text-center">
                <CTAButton
                  onClick={handleGenerateHeadlines}
                  aria-label="Generate headlines for your topic"
                >
                  {loading ? "Generating..." : "Generate Headlines"}
                </CTAButton>
              </div>
            </GlassCard>
          )}

          {/* ─── Step 2: Headlines ─── */}
          {currentStep === 2 && (
            <GlassCard>
              <h3 className="text-xl font-black">Your Headlines</h3>
              <p className="mt-2 text-sm text-white/75">
                Here are 10 headline options for your video. Copy any that you like.
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
                    <CopyButton text={headline} />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <RegenerateButton
                  onClick={handleRegenerateHeadlines}
                  loading={loading}
                  label="Regenerate Headlines"
                />
              </div>
              <WizardNavigation
                currentStep={currentStep}
                loading={loading}
                onBack={handleBack}
                onNext={handleNext}
              />
            </GlassCard>
          )}

          {/* ─── Step 3: Hooks ─── */}
          {currentStep === 3 && (
            <GlassCard>
              <h3 className="text-xl font-black">Choose Your Hook</h3>
              <p className="mt-2 text-sm text-white/75">
                Select a hook to use as your video opener. This will generate a script based on your choice.
              </p>
              {loading ? (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <p className="text-sm text-white/75">Generating your script...</p>
                </div>
              ) : (
                <>
                  <div className="mt-6 space-y-3">
                    {hooks.map((hook, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectHook(hook)}
                        className="w-full rounded-lg border border-white/15 bg-white/5 p-4 text-left text-sm transition-colors hover:border-white/30 hover:bg-white/10"
                        aria-label={`Select hook: ${hook}`}
                      >
                        <span className="mr-2 font-bold text-white/50">{i + 1}.</span>
                        {hook}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <RegenerateButton
                      onClick={handleRegenerateHooks}
                      loading={loading}
                      label="Regenerate Hooks"
                    />
                  </div>
                </>
              )}
              <WizardNavigation
                currentStep={currentStep}
                loading={loading}
                onBack={handleBack}
                onNext={handleNext}
              />
            </GlassCard>
          )}

          {/* ─── Step 4: Script ─── */}
          {currentStep === 4 && (
            <GlassCard>
              <h3 className="text-xl font-black">Your Script</h3>
              <p className="mt-2 text-sm text-white/75">
                A 60-second video script based on your selected hook.
              </p>
              <div className="mt-6 rounded-lg border border-white/15 bg-white/5 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{script}</p>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <RegenerateButton
                  onClick={handleRegenerateScript}
                  loading={loading}
                  label="Regenerate Script"
                />
                <CopyButton text={script} label="Copy Script" />
              </div>
              <WizardNavigation
                currentStep={currentStep}
                loading={loading}
                onBack={handleBack}
                onNext={handleNext}
              />
            </GlassCard>
          )}

          {/* ─── Step 5: Description ─── */}
          {currentStep === 5 && (
            <GlassCard>
              <h3 className="text-xl font-black">SEO Description</h3>
              <p className="mt-2 text-sm text-white/75">
                An optimized video description with hashtags and call to action.
              </p>
              <div className="mt-6 rounded-lg border border-white/15 bg-white/5 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{description}</p>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <RegenerateButton
                  onClick={handleRegenerateDescription}
                  loading={loading}
                  label="Regenerate Description"
                />
                <CopyButton text={description} label="Copy Description" />
              </div>
              <WizardNavigation
                currentStep={currentStep}
                loading={loading}
                onBack={handleBack}
                onNext={handleNext}
              />
            </GlassCard>
          )}

          {/* ─── Step 6: Review ─── */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <GlassCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Topic</h3>
                  <CopyButton text={topic} />
                </div>
                <p className="mt-2 text-sm text-white/75">{topic}</p>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Headlines</h3>
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
                      <CopyButton text={headline} />
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Selected Hook</h3>
                  <CopyButton text={selectedHook} />
                </div>
                <p className="mt-2 text-sm text-white/75">{selectedHook}</p>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Script</h3>
                  <div className="flex gap-2">
                    <RegenerateButton
                      onClick={handleRegenerateScript}
                      loading={loading}
                      label="Regenerate"
                    />
                    <CopyButton text={script} label="Copy Script" />
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{script}</p>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">SEO Description</h3>
                  <div className="flex gap-2">
                    <RegenerateButton
                      onClick={handleRegenerateDescription}
                      loading={loading}
                      label="Regenerate"
                    />
                    <CopyButton text={description} label="Copy Description" />
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{description}</p>
                </div>
              </GlassCard>

              <div className="flex flex-col items-center gap-4 pt-4">
                <CopyButton text={allContent} label="Copy All Content" />
                <CTAButton onClick={handleStartOver} aria-label="Start over with a new topic">
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
