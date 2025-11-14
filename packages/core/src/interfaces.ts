import type { z } from "zod";

export type LLMMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export type GenerateStructuredArgs<T> = {
  messages: LLMMessage[];
  schema: z.ZodType<T>;
  model?: string;
};

export type LLMClient = {
  id: string;
  generateStructured<T>(
    args: GenerateStructuredArgs<T>
  ): Promise<{ value: T; raw: unknown }>;
};
