"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { TikTokShopStep } from "@/lib/utils/validation";
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

const STEP_LABELS = ["Product Info", "Headlines", "Description", "Sales Angles", "Hooks", "Video Script", "Review"] as const;

export default function TikTokShopWizard() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollToTop = () => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const [currentStep, setCurrentStep] = useState<TikTokShopStep>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<TikTokShopStep>(1);

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
  const [description, setDescription] = useState("");
  const [salesAngles, setSalesAngles] = useState<string[]>([]);
  const [hooks, setHooks] = useState<string[]>([]);
  const [selectedHook, setSelectedHook] = useState("");
  const [videoScript, setVideoScript] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState("");

  const advanceMaxStep = (step: TikTokShopStep) => {
    setMaxReachedStep((prev) => Math.max(prev, step) as TikTokShopStep);
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
        description?: string;
        salesAngles?: string[];
        selectedHook?: string;
      },
    ): Promise<GenerateResponse | null> => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/tiktok-shop/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step,
            ...productFields,
            headlines: overrides?.headlines ?? (headlines.length > 0 ? headlines : undefined),
            description: overrides?.description ?? (description || undefined),
            salesAngles: overrides?.salesAngles ?? (salesAngles.length > 0 ? salesAngles : undefined),
            selectedHook: overrides?.selectedHook ?? (selectedHook || undefined),
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
    [productName, productLink, productDescription, mainProblem, mainResult, benefits, differentiators, headlines, description, salesAngles, selectedHook],
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
      scrollToTop();
    }
  };

  const handleGenerateDescription = async () => {
    const data = await generate(3);
    if (data && typeof data.result === "string") {
      setDescription(data.result);
      setCurrentStep(3);
      advanceMaxStep(3);
      scrollToTop();
    }
  };

  const handleGenerateSalesAngles = async () => {
    const data = await generate(4);
    if (data && Array.isArray(data.result)) {
      setSalesAngles(data.result);
      setCurrentStep(4);
      advanceMaxStep(4);
      scrollToTop();
    }
  };

  const handleGenerateHooks = async () => {
    const data = await generate(5);
    if (data && Array.isArray(data.result)) {
      setHooks(data.result);
      setCurrentStep(5);
      advanceMaxStep(5);
      scrollToTop();
    }
  };

  const handleSelectHook = async (hook: string) => {
    setSelectedHook(hook);
    const data = await generate(6, { selectedHook: hook });
    if (data && typeof data.result === "string") {
      setVideoScript(data.result);
      setCurrentStep(6);
      advanceMaxStep(6);
      scrollToTop();
    }
  };

  // ─── Regenerate handlers (stay on current step, clear downstream) ───

  const handleRegenerateHeadlines = async () => {
    const data = await generate(2);
    if (data && Array.isArray(data.result)) {
      setHeadlines(data.result);
      setDescription("");
      setSalesAngles([]);
      setHooks([]);
      setSelectedHook("");
      setVideoScript("");
    }
  };

  const handleRegenerateDescription = async () => {
    const data = await generate(3);
    if (data && typeof data.result === "string") {
      setDescription(data.result);
      setSalesAngles([]);
      setHooks([]);
      setSelectedHook("");
      setVideoScript("");
    }
  };

  const handleRegenerateSalesAngles = async () => {
    const data = await generate(4);
    if (data && Array.isArray(data.result)) {
      setSalesAngles(data.result);
      setHooks([]);
      setSelectedHook("");
      setVideoScript("");
    }
  };

  const handleRegenerateHooks = async () => {
    const data = await generate(5);
    if (data && Array.isArray(data.result)) {
      setHooks(data.result);
      setSelectedHook("");
      setVideoScript("");
    }
  };

  const handleRegenerateVideoScript = async () => {
    const data = await generate(6, { selectedHook });
    if (data && typeof data.result === "string") {
      setVideoScript(data.result);
    }
  };

  // ─── Navigation handlers ───

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as TikTokShopStep);
      setError("");
      scrollToTop();
    }
  };

  const handleNext = () => {
    setError("");
    switch (currentStep) {
      case 2:
        handleGenerateDescription();
        break;
      case 3:
        handleGenerateSalesAngles();
        break;
      case 4:
        handleGenerateHooks();
        break;
      case 6:
        setCurrentStep(7);
        advanceMaxStep(7);
        scrollToTop();
        break;
    }
  };

  const handleStepClick = (step: number) => {
    if (step <= maxReachedStep) {
      setCurrentStep(step as TikTokShopStep);
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
    setDescription("");
    setSalesAngles([]);
    setHooks([]);
    setSelectedHook("");
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

  const allContent = `PRODUCT INFO:\n${productInfoSummary}\n\n--- HEADLINES (34 chars max each) ---\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\n--- DESCRIPTION ---\n${description}\n\n--- SALES ANGLES ---\n${salesAngles.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\n--- SELECTED HOOK ---\n${selectedHook}\n\n--- VIDEO SCRIPT ---\n${videoScript}`;

  return (
    <section ref={sectionRef} className="section-padding relative z-30">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          accentColor="blue"
          subtitle="Generate high-converting ad headlines, descriptions, sales angles, hooks, and video scripts for your TikTok Shop campaigns"
        >
          TIKTOK SHOP ADS GENERATOR
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
                Fill in as many fields as you can. The more detail you provide, the better your TikTok Shop ad copy will be. All fields are optional, but at least one is required.
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
                    placeholder="e.g., GlowUp Serum"
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
                    placeholder="e.g., https://tiktokshop.com/your-product"
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
                    placeholder="e.g., A vitamin C serum that brightens skin and reduces dark spots in 14 days..."
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
                    placeholder="e.g., People struggle with dull skin and dark spots that make them feel self-conscious..."
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
                    placeholder="e.g., Visibly brighter, more even skin tone in as little as 2 weeks..."
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
                    placeholder="e.g., Lightweight formula, no greasy residue, works on all skin types, dermatologist tested..."
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
                    placeholder="e.g., Only serum with 20% vitamin C + hyaluronic acid at this price point, over 50K sold on TikTok Shop..."
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
              <h3 className="text-xl font-black">Your TikTok Shop Ad Headlines</h3>
              <p className="mt-2 text-sm text-white/75">
                30 high-converting headlines for your TikTok Shop Ads. Each headline is 34 characters or fewer.
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

          {/* ─── Step 3: Description ─── */}
          {currentStep === 3 && (
            <GlassCard>
              <h3 className="text-xl font-black">Your TikTok SEO Description</h3>
              <p className="mt-2 text-sm text-white/75">
                An SEO-optimized TikTok video description with trending hashtags and a call to action.
              </p>
              {loading && !description ? (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <p className="text-sm text-white/75">Loading...</p>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-white/15 bg-white/5 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{description}</p>
                </div>
              )}
              <div className="mt-6 flex items-center justify-between">
                <NavBackButton onClick={handleBack} />
                <div className="flex items-center gap-3">
                  <RegenerateButton
                    onClick={handleRegenerateDescription}
                    loading={loading}
                    label="Regenerate Description"
                  />
                  <CopyButton text={description} label="Copy Description" />
                  <NavNextButton onClick={handleNext} loading={loading} />
                </div>
              </div>
            </GlassCard>
          )}

          {/* ─── Step 4: Sales Angles ─── */}
          {currentStep === 4 && (
            <GlassCard>
              <h3 className="text-xl font-black">Your Sales Angles</h3>
              <p className="mt-2 text-sm text-white/75">
                10 problem-solution sales angles that position your product as the answer to different customer pain points.
              </p>
              {loading && salesAngles.length === 0 ? (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <p className="text-sm text-white/75">Loading...</p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {salesAngles.map((angle, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/5 p-3"
                    >
                      <span className="text-sm">
                        <span className="mr-2 font-bold text-white/50">{i + 1}.</span>
                        {angle}
                      </span>
                      <CopyButtonSmall text={angle} />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 flex items-center justify-between">
                <NavBackButton onClick={handleBack} />
                <div className="flex items-center gap-3">
                  <RegenerateButton
                    onClick={handleRegenerateSalesAngles}
                    loading={loading}
                    label="Regenerate Sales Angles"
                  />
                  <NavNextButton onClick={handleNext} loading={loading} />
                </div>
              </div>
            </GlassCard>
          )}

          {/* ─── Step 5: Hooks ─── */}
          {currentStep === 5 && (
            <GlassCard>
              <h3 className="text-xl font-black">Choose Your Hook</h3>
              <p className="mt-2 text-sm text-white/75">
                Select a hook to use as your video opener. This will generate a TikTok Shop Ad video script based on your choice.
              </p>
              {loading && hooks.length === 0 ? (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <p className="text-sm text-white/75">Loading...</p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {hooks.map((hook, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectHook(hook)}
                      disabled={loading}
                      className="w-full rounded-lg border border-white/15 bg-white/5 p-4 text-left text-sm transition-colors hover:border-white/30 hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50"
                      aria-label={`Select hook: ${hook}`}
                    >
                      <span className="mr-2 font-bold text-white/50">{i + 1}.</span>
                      {hook}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-6 flex items-center justify-between">
                <NavBackButton onClick={handleBack} />
                <RegenerateButton
                  onClick={handleRegenerateHooks}
                  loading={loading}
                  label="Regenerate Hooks"
                />
              </div>
            </GlassCard>
          )}

          {/* ─── Step 6: Video Script ─── */}
          {currentStep === 6 && (
            <GlassCard>
              <h3 className="text-xl font-black">Your TikTok Shop Ad Video Script</h3>
              <p className="mt-2 text-sm text-white/75">
                A 40-second video script for your TikTok Shop Ad, fully compliant with TikTok Shop Advertising Policies.
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

          {/* ─── Step 7: Review ─── */}
          {currentStep === 7 && (
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
                  <h3 className="text-lg font-black">Headlines (34 chars max)</h3>
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

              <GlassCard>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Sales Angles</h3>
                  <div className="flex gap-2">
                    <RegenerateButton
                      onClick={handleRegenerateSalesAngles}
                      loading={loading}
                      label="Regenerate"
                    />
                    <CopyButton
                      text={salesAngles.map((a, i) => `${i + 1}. ${a}`).join("\n")}
                      label="Copy All"
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {salesAngles.map((angle, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-2.5"
                    >
                      <span className="text-sm">
                        <span className="mr-2 font-bold text-white/50">{i + 1}.</span>
                        {angle}
                      </span>
                      <CopyButtonSmall text={angle} />
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
