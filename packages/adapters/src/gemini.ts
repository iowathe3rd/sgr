import type { GenerateStructuredArgs, LLMClient, LLMMessage } from "@sgr/core";
import { parseStructuredResponse } from "./utils";

export type GeminiAdapterOptions = {
  apiKey: string;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
};

const DEFAULT_BASE = "https://generativemodels.googleapis.com";

export function createGeminiLLMClient(opts: GeminiAdapterOptions): LLMClient {
  const fetcher = opts.fetch ?? fetch.bind(globalThis);

  return {
    id: `gemini:${opts.model}`,
    async generateStructured<T>({
      messages,
      schema,
      model,
    }: GenerateStructuredArgs<T>) {
      const targetModel = encodeURIComponent(model ?? opts.model);
      const response = await fetcher(
        `${opts.baseUrl ?? DEFAULT_BASE}/v1beta/models/${targetModel}:generateText`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${opts.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: {
              text: messages
                .map((m: LLMMessage) => `${m.role}: ${m.content}`)
                .join("\n"),
            },
            temperature: opts.temperature ?? 0.2,
            maxOutputTokens: opts.maxOutputTokens ?? 512,
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Gemini request failed (${response.status}): ${errorBody}`
        );
      }

      const payload = await response.json();
      const candidate = payload?.candidates?.[0];
      const content = candidate?.output ?? candidate?.content ?? payload;
      const structured = parseStructuredResponse(content);
      const value = schema.parse(structured);

      return { value, raw: payload };
    },
  };
}
