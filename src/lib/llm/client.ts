import Anthropic from "@anthropic-ai/sdk";

/**
 * The LLM layer is OPTIONAL. The whole app runs on the deterministic engine
 * without any key. When ANTHROPIC_API_KEY is set, this client powers the
 * natural-language enhancements (free-text parsing + friendly explanations).
 */
let cached: Anthropic | null = null;

export function isLlmEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getAnthropic(): Anthropic | null {
  if (!isLlmEnabled()) return null;
  if (!cached) cached = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return cached;
}

// Latest small, fast model — explanations/parsing don't need a frontier model.
export const LLM_MODEL = "claude-haiku-4-5-20251001";
