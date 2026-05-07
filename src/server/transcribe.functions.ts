// Phase 3 §2 — Speech-to-Text via Lovable AI Gateway (Gemini supports audio
// input via inline base64). Returns transcribed text in the source language.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  audioUrl: z.string().url(),
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "LOVABLE_API_KEY is not configured" };
    }

    try {
      // Fetch the audio bytes server-side and inline as base64.
      const audioRes = await fetch(data.audioUrl);
      if (!audioRes.ok) {
        return { ok: false as const, error: `audio_fetch_${audioRes.status}` };
      }
      const mime = audioRes.headers.get("content-type") || "audio/webm";
      const buf = new Uint8Array(await audioRes.arrayBuffer());
      // Hard cap ~10 MB to keep the gateway request small.
      if (buf.byteLength > 10 * 1024 * 1024) {
        return { ok: false as const, error: "audio_too_large" };
      }
      // Base64 encode (chunked to avoid call-stack issues on large arrays).
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < buf.length; i += chunk) {
        binary += String.fromCharCode(...buf.subarray(i, i + chunk));
      }
      const b64 = btoa(binary);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are a speech-to-text engine. Transcribe the user's audio verbatim in its original spoken language. Output ONLY the transcript text — no quotes, no prefixes, no commentary.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Transcribe this voice message." },
                {
                  type: "input_audio",
                  input_audio: { data: b64, format: mime.includes("mp3") ? "mp3" : "webm" },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return { ok: false as const, error: "rate_limited" };
        if (response.status === 402) return { ok: false as const, error: "payment_required" };
        const t = await response.text();
        console.error("[transcribe] gateway error", response.status, t);
        return { ok: false as const, error: `gateway_${response.status}` };
      }

      const json = await response.json();
      const text: string | undefined = json?.choices?.[0]?.message?.content?.trim();
      if (!text) return { ok: false as const, error: "empty_response" };
      return { ok: true as const, text };
    } catch (e) {
      console.error("[transcribe] failure", e);
      return { ok: false as const, error: e instanceof Error ? e.message : "unknown" };
    }
  });
