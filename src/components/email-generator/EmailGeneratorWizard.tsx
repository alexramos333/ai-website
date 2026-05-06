"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import CTAButton from "@/components/ui/CTAButton";
import StepProgressIndicator from "@/components/content-creator/StepProgressIndicator";
import {
  SEQUENCE_TYPES,
  SEQUENCE_TYPE_LIST,
  LOADING_MESSAGES,
} from "./constants";
import type {
  SequenceType,
  EmailObject,
  GenerateSequenceResponse,
} from "./constants";

// ─── Clipboard Utility ───

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

// ─── Helper Components ───

function CopyButtonSmall({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
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

// ─── Skeleton Loader ───

function EmailSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <GlassCard key={i}>
          <div className="animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-20 rounded bg-white/10" />
              <div className="h-6 w-40 rounded bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-white/10" />
              <div className="h-4 w-1/2 rounded bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-2/3 rounded bg-white/10" />
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ─── Email Card ───

function EmailCard({
  email,
  onRegenerateEmail,
  onRegenerateSubjects,
  regeneratingEmail,
  regeneratingSubjects,
}: {
  email: EmailObject;
  onRegenerateEmail: (emailNumber: number) => void;
  onRegenerateSubjects: (emailNumber: number) => void;
  regeneratingEmail: boolean;
  regeneratingSubjects: boolean;
}) {
  const fullEmailText = `Subject Lines:\n${email.subjectLines.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nPreview Text: ${email.previewText}\n\nOpening Line: ${email.openingLine}\n\n${email.body}\n\nCTA: ${email.cta}\n\nP.S. ${email.psLine}`;

  return (
    <GlassCard>
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-[#004be0]/50 px-2.5 py-1 text-xs font-bold">
            Email {email.emailNumber}
          </span>
          <span className="font-bold text-white">{email.name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs text-white/60">
            {email.framework}
          </span>
          <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs text-white/60">
            {email.sendTiming}
          </span>
          <RegenerateButton
            onClick={() => onRegenerateEmail(email.emailNumber)}
            loading={regeneratingEmail}
            label="Regenerate Email"
          />
        </div>
      </div>

      {/* Subject Lines */}
      <div className="mt-5">
        <h4 className="text-sm font-bold text-white/90">Subject Lines</h4>
        <div className="mt-2 space-y-2">
          {email.subjectLines.map((subject, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-2.5"
            >
              <span className="text-sm">
                <span className="mr-2 font-bold text-white/50">{i + 1}.</span>
                {subject}
              </span>
              <CopyButtonSmall text={subject} />
            </div>
          ))}
        </div>
        <div className="mt-2">
          <RegenerateButton
            onClick={() => onRegenerateSubjects(email.emailNumber)}
            loading={regeneratingSubjects}
            label="Regenerate Subject Lines"
          />
        </div>
      </div>

      {/* Preview Text */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white/90">Preview Text</h4>
          <CopyButtonSmall text={email.previewText} />
        </div>
        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-sm text-white/75">{email.previewText}</p>
        </div>
      </div>

      {/* Opening Line */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white/90">Opening Line</h4>
          <CopyButtonSmall text={email.openingLine} />
        </div>
        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-sm text-white/75">{email.openingLine}</p>
        </div>
      </div>

      {/* Email Body */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white/90">Email Body</h4>
          <CopyButtonSmall text={email.body} label="Copy Body" />
        </div>
        <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">{email.body}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white/90">Call to Action</h4>
          <CopyButtonSmall text={email.cta} />
        </div>
        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-medium text-white">{email.cta}</p>
        </div>
      </div>

      {/* P.S. Line */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white/90">P.S. Line</h4>
          <CopyButtonSmall text={email.psLine} />
        </div>
        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-sm italic text-white/75">P.S. {email.psLine}</p>
        </div>
      </div>

      {/* Copy Full Email */}
      <div className="mt-5 flex justify-end">
        <CopyButton text={fullEmailText} label="Copy Full Email" />
      </div>
    </GlassCard>
  );
}

// ─── Main Wizard ───

const STEP_LABELS = ["Select Type", "Your Emails"] as const;

export default function EmailGeneratorWizard() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollToTop = () => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const [currentStep, setCurrentStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);
  const [selectedType, setSelectedType] = useState<SequenceType | "">("");
  const [sequence, setSequence] = useState<GenerateSequenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [regeneratingEmail, setRegeneratingEmail] = useState<number | null>(null);
  const [regeneratingSubjects, setRegeneratingSubjects] = useState<number | null>(null);

  // Cycle loading messages
  useEffect(() => {
    if (!loading) {
      setLoadingMsgIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = useCallback(async () => {
    if (!selectedType) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/email-generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequenceType: selectedType }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to generate email sequence.");
      }

      const data = (await response.json()) as GenerateSequenceResponse;
      setSequence(data);
      setCurrentStep(2);
      setMaxReachedStep(2);
      scrollToTop();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  const handleRegenerateEmail = useCallback(
    async (emailNumber: number) => {
      if (!sequence || !selectedType) return;
      const email = sequence.emails.find((e) => e.emailNumber === emailNumber);
      if (!email) return;

      setRegeneratingEmail(emailNumber);

      try {
        const response = await fetch("/api/email-generator/regenerate-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sequenceType: selectedType,
            emailNumber,
            emailName: email.name,
            previousBody: email.body,
          }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? "Failed to regenerate email.");
        }

        const newEmail = (await response.json()) as EmailObject;
        setSequence((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            emails: prev.emails.map((e) =>
              e.emailNumber === emailNumber ? { ...newEmail, emailNumber } : e,
            ),
          };
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
      } finally {
        setRegeneratingEmail(null);
      }
    },
    [sequence, selectedType],
  );

  const handleRegenerateSubjects = useCallback(
    async (emailNumber: number) => {
      if (!sequence || !selectedType) return;
      const email = sequence.emails.find((e) => e.emailNumber === emailNumber);
      if (!email) return;

      setRegeneratingSubjects(emailNumber);

      try {
        const response = await fetch("/api/email-generator/regenerate-subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sequenceType: selectedType,
            emailNumber,
            emailName: email.name,
            emailGoal: email.goal,
            previousSubjects: email.subjectLines,
          }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? "Failed to regenerate subject lines.");
        }

        const data = (await response.json()) as { subjectLines: string[] };
        setSequence((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            emails: prev.emails.map((e) =>
              e.emailNumber === emailNumber ? { ...e, subjectLines: data.subjectLines } : e,
            ),
          };
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
      } finally {
        setRegeneratingSubjects(null);
      }
    },
    [sequence, selectedType],
  );

  const handleStartOver = () => {
    setCurrentStep(1);
    setMaxReachedStep(1);
    setSelectedType("");
    setSequence(null);
    setError("");
    scrollToTop();
  };

  const handleStepClick = (step: number) => {
    if (step <= maxReachedStep) {
      setCurrentStep(step);
      setError("");
    }
  };

  const allEmailsText = sequence
    ? sequence.emails
        .map((email) => {
          return `═══════════════════════════════════════\nEmail ${email.emailNumber} — ${email.name}\nSend: ${email.sendTiming} | Framework: ${email.framework}\n═══════════════════════════════════════\n\nSubject Lines:\n${email.subjectLines.map((s, i) => `  ${i + 1}. ${s}`).join("\n")}\n\nPreview Text: ${email.previewText}\n\nOpening Line: ${email.openingLine}\n\n${email.body}\n\nCTA: ${email.cta}\n\nP.S. ${email.psLine}`;
        })
        .join("\n\n\n")
    : "";

  const typeInfo = selectedType ? SEQUENCE_TYPES[selectedType] : null;

  return (
    <section ref={sectionRef} className="section-padding relative z-30">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          accentColor="blue"
          subtitle="Generate a complete, high-converting email sequence in seconds — no copywriting experience needed."
        >
          AI EMAIL SEQUENCE GENERATOR
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
            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => { setError(""); handleGenerate(); }}
                className="mt-2 block w-full text-center text-sm font-medium text-white underline"
              >
                Try Again
              </button>
            )}
          </div>
        )}

        <div className="mt-8">
          {/* ─── Step 1: Select Sequence Type ─── */}
          {currentStep === 1 && (
            <GlassCard>
              <h3 className="text-xl font-black">Select your email sequence type</h3>
              <p className="mt-2 text-sm text-white/75">
                Choose the type of email sequence you need and we&apos;ll generate a complete, professionally written sequence using proven copywriting frameworks.
              </p>

              <div className="mt-6">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as SequenceType | "")}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white outline-none transition-colors focus:border-white/40"
                  aria-label="Select email sequence type"
                >
                  <option value="" className="bg-[#060d2e]">
                    -- Select a sequence type --
                  </option>
                  {SEQUENCE_TYPE_LIST.map((type) => (
                    <option key={type.key} value={type.key} className="bg-[#060d2e]">
                      {type.emoji} {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description Card */}
              {typeInfo && (
                <div className="mt-4 rounded-lg border border-white/15 bg-white/5 p-4">
                  <h4 className="text-lg font-bold">
                    {typeInfo.emoji} {typeInfo.name}
                  </h4>
                  <p className="mt-1 text-sm text-white/75">{typeInfo.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#004be0]/40 px-3 py-1 text-xs font-medium text-white">
                      {typeInfo.emailCount} emails
                    </span>
                    <span className="rounded-full bg-[#004be0]/40 px-3 py-1 text-xs font-medium text-white">
                      {typeInfo.framework}
                    </span>
                    <span className="rounded-full bg-[#004be0]/40 px-3 py-1 text-xs font-medium text-white">
                      Best for: {typeInfo.bestFor}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-6 text-center">
                {loading ? (
                  <div className="inline-block">
                    <div className="cta-btn pointer-events-none relative opacity-50">
                      <span className="cta-btn-inside block px-4 py-2.5 text-base opacity-0">
                        Generating...
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <CTAButton
                    onClick={handleGenerate}
                    aria-label="Generate email sequence"
                  >
                    Generate My Email Sequence
                  </CTAButton>
                )}
              </div>
            </GlassCard>
          )}

          {/* ─── Step 2: Generated Emails ─── */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Loading state */}
              {loading && (
                <>
                  {/* Progress bar */}
                  <div className="h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#5de6fc] to-[#6000ff] transition-all duration-1000"
                      style={{
                        width: `${((loadingMsgIndex + 1) / LOADING_MESSAGES.length) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white/75">
                      {LOADING_MESSAGES[loadingMsgIndex]}
                    </p>
                  </div>
                  <EmailSkeleton />
                </>
              )}

              {/* Generated content */}
              {!loading && sequence && (
                <>
                  {/* Top bar */}
                  <GlassCard>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black">
                          Your {SEQUENCE_TYPES[selectedType as SequenceType]?.name} is ready!
                        </h3>
                        <p className="mt-1 text-sm text-white/75">
                          {sequence.totalEmails} emails generated using proven copywriting frameworks
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleStartOver}
                          className="cta-btn-static inline-block"
                          aria-label="Start over"
                        >
                          <span className="cta-btn-inside block px-4 py-2.5 text-base">
                            Start Over
                          </span>
                        </button>
                        <CopyButton text={allEmailsText} label="Copy All Emails" />
                      </div>
                    </div>
                  </GlassCard>

                  {/* Email cards */}
                  {sequence.emails.map((email) => (
                    <EmailCard
                      key={email.emailNumber}
                      email={email}
                      onRegenerateEmail={handleRegenerateEmail}
                      onRegenerateSubjects={handleRegenerateSubjects}
                      regeneratingEmail={regeneratingEmail === email.emailNumber}
                      regeneratingSubjects={regeneratingSubjects === email.emailNumber}
                    />
                  ))}

                  {/* Bottom actions */}
                  <div className="flex flex-col items-center gap-4 pt-4">
                    <CopyButton text={allEmailsText} label="Copy All Emails" />
                    <CTAButton onClick={handleStartOver} aria-label="Start over with a new sequence">
                      Start Over
                    </CTAButton>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
