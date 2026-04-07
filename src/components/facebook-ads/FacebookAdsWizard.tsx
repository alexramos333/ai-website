"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { FacebookAdsStep } from "@/lib/utils/validation";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import CTAButton from "@/components/ui/CTAButton";
import StepProgressIndicator from "@/components/content-creator/StepProgressIndicator";

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

function AutoExpandTextarea({
  value,
  onChange,
  placeholder,
  label,
  maxLength = 2000,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  label: string;
  maxLength?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      maxLength={maxLength}
      className="w-full resize-none overflow-y-auto rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-white/40"
      style={{ maxHeight: "120px" }}
      aria-label={label}
    />
  );
}

const STEP_LABELS = ["Product Info", "Headlines", "Descriptions", "Primary Text", "Video Script", "Review"] as const;

export default function FacebookAdsWizard() {
  const [currentStep, setCurrentStep] = useState<FacebookAdsStep>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<FacebookAdsStep>(1);

  // Product info fields
  const [productName, setProductName] = useState("");
  const [productLink, setProductLink] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [mainProblem, setMainProblem] = useState("");
  const [mainResult, setMainResult] = useState("");
  const [benefits, setBenefits] = useState("");
  const [differentiators, setDifferentiators] = useState("");

  // Generated content
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [primaryTexts, setPrimaryTexts] = useState<string[]>([]);
  const [videoScript, setVideoScript] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState("");

  const advanceMaxStep = (step: FacebookAdsStep) => {
    setMaxReachedStep((prev) => Math.max(prev, step) as FacebookAdsStep);
  };

  const hasAnyInput = [productName, productLink, productDescription, mainProblem, mainResult, benefits, differentiators].some(
    (f) => f.trim().length > 0,
  );

  const productFields = {
    productName: productName.trim() || undefined,
    productLink: productLink.trim() || undefined,
    productDescription: productDescription.trim() || undefined,
    mainProblem: mainProblem.trim() || undefined,
    mainResult: mainResult.trim() || undefined,
    benefits: benefits.trim() || undefined,
    differentiators: differentiators.trim() || undefined,
  };

  const generate = useCallback(
    async (
      step: number,
      overrides?: {
        headlines?: string[];
        descriptions?: string[];
        primaryTexts?: string[];
      },
    ): Promise<GenerateResponse | null> => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/facebook-ads/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step,
            ...productFields,
            headlines: overrides?.headlines ?? (headlines.length > 0 ? headlines : undefined),
            descriptions: overrides?.descriptions ?? (descriptions.length > 0 ? descriptions : undefined),
            primaryTexts: overrides?.primaryTexts ?? (primaryTexts.length > 0 ? primaryTexts : undefined),
          }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productName, productLink, productDescription, mainProblem, mainResult, benefits, differentiators, headlines, descriptions, primaryTexts],
  );

  // ─── Forward navigation handlers ───

  const handleGenerateHeadlines = async () => {
    if (!hasAnyInput) {
      setInputError("Please fill in at least one field about your product or service.");
      return;
    }
    setInputError("");
    const data = await generate(2);
    if (data && Array.isArray(data.result)) {
      setHeadlines(data.result);
      setCurrentStep(2);
      advanceMaxStep(2);
    }
  };

  const handleGenerateDescriptions = async () => {
    const data = await generate(3);
    if (data && Array.isArray(data.result)) {
      setDescriptions(data.result);
      setCurrentStep(3);
      advanceMaxStep(3);
    }
  };

  const handleGeneratePrimaryTexts = async () => {
    const data = await generate(4);
    if (data && Array.isArray(data.result)) {
      setPrimaryTexts(data.result);
      setCurrentStep(4);
      advanceMaxStep(4);
    }
  };

  const handleGenerateVideoScript = async () => {
    const data = await generate(5);
    if (data && typeof data.result === "string") {
      setVideoScript(data.result);
      setCurrentStep(5);
      advanceMaxStep(5);
    }
  };

  // ─── Regenerate handlers (stay on current step, clear downstream) ───

  const handleRegenerateHeadlines = async () => {
    const data = await generate(2);
    if (data && Array.isArray(data.result)) {
      setHeadlines(data.result);
      setDescriptions([]);
      setPrimaryTexts([]);
      setVideoScript("");
    }
  };

  const handleRegenerateDescriptions = async () => {
    const data = await generate(3);
    if (data && Array.isArray(data.result)) {
      setDescriptions(data.result);
      setPrimaryTexts([]);
      setVideoScript("");
    }
  };

  const handleRegeneratePrimaryTexts = async () => {
    const data = await generate(4);
    if (data && Array.isArray(data.result)) {
      setPrimaryTexts(data.result);
      setVideoScript("");
    }
  };

  const handleRegenerateVideoScript = async () => {
    const data = await generate(5);
    if (data && typeof data.result === "string") {
      setVideoScript(data.result);
    }
  };

  // ─── Navigation handlers ───

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as FacebookAdsStep);
      setError("");
    }
  };

  const handleNext = () => {
    setError("");
    switch (currentStep) {
      case 2:
        handleGenerateDescriptions();
        break;
      case 3:
        handleGeneratePrimaryTexts();
        break;
      case 4:
        handleGenerateVideoScript();
        break;
      case 5:
        setCurrentStep(6);
        advanceMaxStep(6);
        break;
    }
  };

  const handleStepClick = (step: number) => {
    if (step <= maxReachedStep) {
      setCurrentStep(step as FacebookAdsStep);
      setError("");
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setMaxReachedStep(1);
    setProductName("");
    setProductLink("");
    setProductDescription("");
    setMainProblem("");
    setMainResult("");
    setBenefits("");
    setDifferentiators("");
    setHeadlines([]);
    setDescriptions([]);
    setPrimaryTexts([]);
    setVideoScript("");
    setError("");
    setInputError("");
  };

  const productInfoSummary = [
    productName && `Product: ${productName}`,
    productLink && `Link: ${productLink}`,
    productDescription && `Description: ${productDescription}`,
    mainProblem && `Problem: ${mainProblem}`,
    mainResult && `Result: ${mainResult}`,
    benefits && `Benefits: ${benefits}`,
    differentiators && `Differentiators: ${differentiators}`,
  ]
    .filter(Boolean)
    .join("\n");

  const allContent = `PRODUCT INFO:\n${productInfoSummary}\n\n--- HEADLINES (40 chars max each) ---\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\n--- DESCRIPTIONS (30 chars max each) ---\n${descriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}\n\n--- PRIMARY TEXT (125 chars max each) ---\n${primaryTexts.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n--- VIDEO SCRIPT ---\n${videoScript}`;

  return (
    <section className="section-padding relative z-30">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          accentColor="blue"
          subtitle="Generate high-converting ad copy, primary text, and video scripts for your Facebook Ads campaigns"
        >
          FACEBOOK ADS GENERATOR
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
          {/* ─── Step 1: Product Info ─── */}
          {currentStep === 1 && (
            <GlassCard>
              <h3 className="text-xl font-black">Tell Us About Your Product or Service</h3>
              <p className="mt-2 text-sm text-white/75">
                Fill in as many fields as you can. The more detail you provide, the better your ad copy will be. All fields are optional, but at least one is required.
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-white/90">Product / Service Name</label>
                  <AutoExpandTextarea
                    value={productName}
                    onChange={(val) => {
                      setProductName(val);
                      if (inputError) setInputError("");
                    }}
                    placeholder="e.g., FitTrack Pro"
                    label="Product or service name"
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-white/90">Product / Service Link</label>
                  <AutoExpandTextarea
                    value={productLink}
                    onChange={(val) => {
                      setProductLink(val);
                      if (inputError) setInputError("");
                    }}
                    placeholder="e.g., https://fittrackpro.com"
                    label="Product or service link"
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-white/90">Product / Service Description</label>
                  <AutoExpandTextarea
                    value={productDescription}
                    onChange={(val) => {
                      setProductDescription(val);
                      if (inputError) setInputError("");
                    }}
                    placeholder="e.g., A fitness tracking app that creates personalized workout plans using AI..."
                    label="Product or service description"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-white/90">Main Problem It Solves</label>
                  <AutoExpandTextarea
                    value={mainProblem}
                    onChange={(val) => {
                      setMainProblem(val);
                      if (inputError) setInputError("");
                    }}
                    placeholder="e.g., People struggle to stay consistent with workouts because generic plans don't fit their schedule..."
                    label="Main problem it solves"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-white/90">Main Result / Outcome</label>
                  <AutoExpandTextarea
                    value={mainResult}
                    onChange={(val) => {
                      setMainResult(val);
                      if (inputError) setInputError("");
                    }}
                    placeholder="e.g., Users see visible results in 30 days with just 20 minutes a day..."
                    label="Main result or outcome"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-white/90">Key Benefits</label>
                  <AutoExpandTextarea
                    value={benefits}
                    onChange={(val) => {
                      setBenefits(val);
                      if (inputError) setInputError("");
                    }}
                    placeholder="e.g., AI-personalized plans, progress tracking, video tutorials, community support..."
                    label="Key benefits"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-white/90">What Makes You Different</label>
                  <AutoExpandTextarea
                    value={differentiators}
                    onChange={(val) => {
                      setDifferentiators(val);
                      if (inputError) setInputError("");
                    }}
                    placeholder="e.g., Only app that adapts in real-time based on your energy levels and available equipment..."
                    label="What makes you different"
                  />
                </div>
              </div>
              {inputError && (
                <p className="mt-3 text-sm text-red-400">{inputError}</p>
              )}
              <div className="mt-6 text-center">
                <CTAButton
                  onClick={handleGenerateHeadlines}
                  aria-label="Generate headlines from your product info"
                >
                  {loading ? "Generating..." : "Generate Headlines"}
                </CTAButton>
              </div>
            </GlassCard>
          )}

          {/* ─── Step 2: Headlines ─── */}
          {currentStep === 2 && (
            <GlassCard>
              <h3 className="text-xl font-black">Your Facebook Ad Headlines</h3>
              <p className="mt-2 text-sm text-white/75">
                30 high-converting headlines for your Facebook Ads. Each headline is 40 characters or fewer.
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
              <h3 className="text-xl font-black">Your Facebook Ad Descriptions</h3>
              <p className="mt-2 text-sm text-white/75">
                30 high-converting descriptions for your Facebook Ads. Each description is 30 characters or fewer.
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
                  <NavNextButton onClick={handleNext} loading={loading} />
                </div>
              </div>
            </GlassCard>
          )}

          {/* ─── Step 4: Primary Text ─── */}
          {currentStep === 4 && (
            <GlassCard>
              <h3 className="text-xl font-black">Your Facebook Primary Text</h3>
              <p className="mt-2 text-sm text-white/75">
                10 primary text variations for your Facebook Ads. Each is 125 characters or fewer (visible before &quot;See More&quot;).
              </p>
              {loading && primaryTexts.length === 0 ? (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <p className="text-sm text-white/75">Loading...</p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {primaryTexts.map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/5 p-3"
                    >
                      <span className="text-sm">
                        <span className="mr-2 font-bold text-white/50">{i + 1}.</span>
                        {text}
                      </span>
                      <CopyButtonSmall text={text} />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 flex items-center justify-between">
                <NavBackButton onClick={handleBack} />
                <div className="flex items-center gap-3">
                  <RegenerateButton
                    onClick={handleRegeneratePrimaryTexts}
                    loading={loading}
                    label="Regenerate Primary Text"
                  />
                  <NavNextButton onClick={handleNext} loading={loading} />
                </div>
              </div>
            </GlassCard>
          )}

          {/* ─── Step 5: Video Script ─── */}
          {currentStep === 5 && (
            <GlassCard>
              <h3 className="text-xl font-black">Your Facebook Ad Video Script</h3>
              <p className="mt-2 text-sm text-white/75">
                A 60-second video script for your Facebook Ad, compliant with Facebook Advertising Policies.
              </p>
              {loading && !videoScript ? (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <p className="text-sm text-white/75">Loading...</p>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-white/15 bg-white/5 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{videoScript}</p>
                </div>
              )}
              <div className="mt-6 flex items-center justify-between">
                <NavBackButton onClick={handleBack} />
                <div className="flex items-center gap-3">
                  <RegenerateButton
                    onClick={handleRegenerateVideoScript}
                    loading={loading}
                    label="Regenerate Script"
                  />
                  <CopyButton text={videoScript} label="Copy Script" />
                  <NavNextButton onClick={handleNext} loading={loading} label="Review All" />
                </div>
              </div>
            </GlassCard>
          )}

          {/* ─── Step 6: Review ─── */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <GlassCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Product Info</h3>
                  <CopyButton text={productInfoSummary} />
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-white/75">{productInfoSummary}</p>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Headlines (40 chars max)</h3>
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
                  <h3 className="text-lg font-black">Descriptions (30 chars max)</h3>
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

              <GlassCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Primary Text (125 chars max)</h3>
                  <div className="flex gap-2">
                    <RegenerateButton
                      onClick={handleRegeneratePrimaryTexts}
                      loading={loading}
                      label="Regenerate"
                    />
                    <CopyButton
                      text={primaryTexts.map((p, i) => `${i + 1}. ${p}`).join("\n")}
                      label="Copy All"
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {primaryTexts.map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-2.5"
                    >
                      <span className="text-sm">
                        <span className="mr-2 font-bold text-white/50">{i + 1}.</span>
                        {text}
                      </span>
                      <CopyButtonSmall text={text} />
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Video Script</h3>
                  <div className="flex gap-2">
                    <RegenerateButton
                      onClick={handleRegenerateVideoScript}
                      loading={loading}
                      label="Regenerate"
                    />
                    <CopyButton text={videoScript} label="Copy Script" />
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{videoScript}</p>
                </div>
              </GlassCard>

              <div className="flex flex-col items-center gap-4 pt-4">
                <CopyButton text={allContent} label="Copy All Content" />
                <CTAButton onClick={handleStartOver} aria-label="Start over with new product info">
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
