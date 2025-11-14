import type { GenerateStructuredArgs, LLMClient, LLMMessage } from "@sgr/core";
import { parseStructuredResponse } from "./utils";

export type OpenAIAdapterOptions = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  completionEndpoint?: string;
  fetch?: typeof globalThis.fetch;
};

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_ENDPOINT = "/v1/chat/completions";

const normalizeMessage = ({ role, content }: LLMMessage) => ({ role, content });

export function createOpenAILLMClient(opts: OpenAIAdapterOptions): LLMClient {
  const fetcher = opts.fetch ?? fetch.bind(globalThis);
  const baseUrl = opts.baseUrl ?? "https://api.openai.com";
  const endpoint = opts.completionEndpoint ?? DEFAULT_ENDPOINT;

  return {
    id: `openai:${opts.model ?? DEFAULT_MODEL}`,
    async generateStructured<T>({
      messages,
      schema,
      model,
    }: GenerateStructuredArgs<T>) {
      const targetModel = model ?? opts.model ?? DEFAULT_MODEL;
      const response = await fetcher(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: targetModel,
          messages: messages.map(normalizeMessage),
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.text();
        throw new Error(
          `OpenAI request failed (${response.status}): ${errorPayload}`
        );
      }

      const payload = await response.json();
      const content =
        payload?.choices?.[0]?.message?.content ??
        payload?.choices?.[0]?.message;
      const structured = parseStructuredResponse(content);
      const value = schema.parse(structured);

      return { value, raw: payload };
    },
  };
}
