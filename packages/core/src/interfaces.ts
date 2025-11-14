import { z } from "zod";

export type LLMMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export interface GenerateStructuredArgs<T> {
  messages: LLMMessage[];
  schema: z.ZodType<T>;
  model?: string;
}

export interface LLMClient {
  id: string;
  generateStructured<T>(args: GenerateStructuredArgs<T>): Promise<{ value: T; raw: unknown }>;
}
