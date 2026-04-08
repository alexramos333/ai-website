"use client";

import { useState, useRef, useCallback } from "react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import CTAButton from "@/components/ui/CTAButton";
import { INJECTION_PATTERNS, MAX_INPUT_CHARS } from "./constants";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // silently fail
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="cta-btn-static inline-block shrink-0"
      aria-label={copied ? "Copied" : "Copy prompt"}
    >
      <span className="cta-btn-inside block px-4 py-2.5 text-base">
        {copied ? "Copied!" : "Copy Prompt"}
      </span>
    </button>
  );
}

function detectInjectionClient(input: string): boolean {
  const lower = input.toLowerCase();
  return INJECTION_PATTERNS.some((pattern) => {
    if (pattern.startsWith("\\b")) {
      const regex = new RegExp(pattern, "i");
      return regex.test(lower);
    }
    return lower.includes(pattern);
  });
}

export default function AIPromptGenerator() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastRequestTime = useRef(0);

  const charCount = prompt.length;
  const isNearLimit = charCount >= MAX_INPUT_CHARS * 0.9;
  const isAtLimit = charCount >= MAX_INPUT_CHARS;

  const handleGenerate = useCallback(async () => {
    // ─── Frontend validation ───
    if (prompt.trim().length === 0) {
      setError("Please enter a prompt.");
      return;
    }

    if (charCount > MAX_INPUT_CHARS) {
      setError(`Your prompt exceeds the ${MAX_INPUT_CHARS.toLocaleString()} character limit. Please shorten it.`);
      return;
    }

    // ─── Frontend injection detection ───
    if (detectInjectionClient(prompt)) {
      setError("Prompt rejected due to policy violation guidelines.");
      return;
    }

    // ─── Guardrail 7: 3-second cooldown ───
    const now = Date.now();
    if (now - lastRequestTime.current < 3000) {
      setError("Please wait a moment before submitting another request.");
      return;
    }

    setError("");
    setLoading(true);
    lastRequestTime.current = now;

    try {
      const response = await fetch("/api/ai-prompt-generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Something went wrong. Please try again in a moment.");
      }

      const data = (await response.json()) as { result: string };
      setOutput(data.result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again in a moment.";
      setError(message);
    } finally {
      // Ensure minimum 3-second loading state
      const elapsed = Date.now() - now;
      const remaining = Math.max(0, 3000 - elapsed);
      setTimeout(() => setLoading(false), remaining);
    }
  }, [prompt, charCount]);

  return (
    <section className="section-padding relative z-30">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          accentColor="blue"
          subtitle="Paste any simple or rough prompt idea below. Our AI will instantly restructure it into a fully optimized, high-quality prompt using industry best practices — ready to use with ChatGPT, Claude, Gemini, Grok, or any AI model."
        >
          AI PROMPT GENERATOR
        </SectionHeading>

        <div className="mt-10">
          {/* ─── Input Section ─── */}
          <GlassCard>
            <h3 className="text-xl font-black">Your Prompt</h3>
            <p className="mt-2 text-sm text-white/75">
              Enter your rough prompt idea and we&apos;ll transform it into an optimized, production-ready prompt.
            </p>
            <div className="mt-6">
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Write me a social media caption for my fitness product..."
                rows={4}
                maxLength={MAX_INPUT_CHARS}
                className="w-full resize-y rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-white/40"
                aria-label="Your prompt"
              />
              <p
                className={`mt-1.5 text-right text-xs ${
                  isAtLimit
                    ? "font-bold text-red-400"
                    : isNearLimit
                      ? "text-red-400"
                      : "text-white/40"
                }`}
              >
                {charCount.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()}
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="mt-6 text-center">
              {loading ? (
                <div className="inline-block">
                  <div className="cta-btn pointer-events-none opacity-50 relative">
                    <span className="cta-btn-inside block px-4 py-2.5 text-base opacity-0">
                      Optimizing your prompt...
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    </span>
                  </div>
                </div>
              ) : (
                <CTAButton
                  onClick={handleGenerate}
                  aria-label="Generate optimized prompt"
                >
                  Generate Prompt
                </CTAButton>
              )}
            </div>
          </GlassCard>

          {/* ─── Output Section ─── */}
          {output && !loading && (
            <div className="mt-8">
              <GlassCard>
                <h3 className="text-xl font-black">Your Optimized Prompt</h3>
                <div className="mt-4 rounded-lg border border-white/15 bg-white/5 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{output}</p>
                </div>
                <div className="mt-4 flex justify-center">
                  <CopyButton text={output} />
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
