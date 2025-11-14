import type { z } from "zod";

/**
 * Represents a conversational message exchanged with an LLM.
 */
export type LLMMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

/**
 * Arguments required to produce structured data from an LLM response.
 */
export type GenerateStructuredArgs<T> = {
  messages: LLMMessage[];
  schema: z.ZodType<T>;
  model?: string;
};

/**
 * Minimal interface every LLM client must implement.
 */
export type LLMClient = {
  id: string;
  generateStructured<T>(
    args: GenerateStructuredArgs<T>
  ): Promise<{ value: T; raw: unknown }>;
};
