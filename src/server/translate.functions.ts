import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  text: z.string().min(1).max(8000),
  sourceLanguage: z.string().min(2).max(10),
  targetLanguage: z.string().min(2).max(10),
});

const LANG_NAMES: Record<string, string> = {
  en: "English", ru: "Russian", es: "Spanish", fr: "French", de: "German",
  it: "Italian", pt: "Portuguese", zh: "Chinese", ja: "Japanese", ko: "Korean",
  ar: "Arabic", tr: "Turkish", hi: "Hindi", uk: "Ukrainian", pl: "Polish",
};

const langName = (code: string) => LANG_NAMES[code] || code;

/**
 * LLM-backed translation via Lovable AI Gateway. Context-aware (preserves
 * tone, slang, jargon, casing, punctuation). Returns the translated string,
 * or throws on failure so the client can fallback / show retry.
 */
export const translateText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "LOVABLE_API_KEY is not configured" };
    }

    const src = langName(data.sourceLanguage);
    const tgt = langName(data.targetLanguage);

    const systemPrompt =
      `You are a professional ${src}→${tgt} translator. Translate the user's message faithfully and naturally, preserving tone, intent, slang, jargon, punctuation, emojis, and the casing pattern (ALL CAPS stays ALL CAPS, lowercase stays lowercase). Do NOT add commentary, quotes, or explanations. If the input is already in ${tgt}, return it unchanged. Output ONLY the translated text.`;

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: data.text },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return { ok: false as const, error: "rate_limited" };
        if (response.status === 402) return { ok: false as const, error: "payment_required" };
        const t = await response.text();
        console.error("[translate] gateway error", response.status, t);
        return { ok: false as const, error: `gateway_${response.status}` };
      }

      const json = await response.json();
      const translated: string | undefined = json?.choices?.[0]?.message?.content?.trim();
      if (!translated) return { ok: false as const, error: "empty_response" };

      return { ok: true as const, translated };
    } catch (e) {
      console.error("[translate] failure", e);
      return { ok: false as const, error: e instanceof Error ? e.message : "unknown" };
    }
  });
