import { z } from "zod";

export const DefaultNextStepSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("clarification"),
    questions: z.array(z.string())
  }),
  z.object({
    type: z.literal("plan"),
    steps: z.array(z.string())
  }),
  z.object({
    type: z.literal("tool_call"),
    toolName: z.string(),
    args: z.record(z.unknown())
  }),
  z.object({
    type: z.literal("final_answer"),
    answer: z.string(),
    structured: z.any().optional()
  })
]);

export type DefaultNextStep = z.infer<typeof DefaultNextStepSchema>;
