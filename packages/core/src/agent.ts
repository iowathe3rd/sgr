import type { z } from "zod";
import type { SGREvent, SGREventBase, SGRPattern } from "./events";
import type { LLMClient, LLMMessage } from "./interfaces";
import { DefaultNextStepSchema } from "./schema";
import type { ToolContext, ToolRegistry } from "./tools";

export type SGRAgentConfig<TNextStep extends z.ZodTypeAny> = {
  llmClient: LLMClient;
  toolRegistry?: ToolRegistry;
  nextStepSchema?: TNextStep;
  model?: string;
  pattern?: SGRPattern;
  toolContext?: ToolContext;
};

export class SGRAgent<
  TNextStep extends z.ZodTypeAny = typeof DefaultNextStepSchema,
> {
  private readonly nextStepSchema: TNextStep;
  private readonly events: SGREvent[] = [];
  private stepCounter = 0;
  private readonly config: SGRAgentConfig<TNextStep>;

  constructor(config: SGRAgentConfig<TNextStep>) {
    this.config = config;
    this.nextStepSchema =
      this.config.nextStepSchema ??
      (DefaultNextStepSchema as unknown as TNextStep);
  }

  private record(event: SGREvent): void {
    this.events.push(event);
  }

  // TODO: fix dirty code
  private createBaseEvent(): Omit<SGREventBase, "stepIndex"> & {
    stepIndex: number;
  } {
    return {
      // TODO: fix lint ignore
      // biome-ignore lint/nursery/noIncrementDecrement: temp
      stepIndex: this.stepCounter++,
      timestamp: Date.now(),
      pattern: this.config.pattern,
    };
  }

  async plan(
    messages: LLMMessage[],
    overrideSchema?: TNextStep
  ): Promise<z.infer<TNextStep>> {
    const schema = overrideSchema ?? this.nextStepSchema;
    const { value, raw } = await this.config.llmClient.generateStructured({
      messages,
      schema,
      model: this.config.model,
    });

    // Validate/parse the unknown model output against the schema to get a correctly typed value
    const parsed: z.infer<TNextStep> = schema.parse(value);

    this.record({
      ...this.createBaseEvent(),
      kind: "model_step",
      nextStep: parsed,
      raw,
    });

    return parsed;
  }

  async callTool<_TInputSchema extends z.ZodTypeAny = z.ZodTypeAny>(
    name: string,
    args: unknown,
    ctx?: ToolContext
  ): Promise<unknown> {
    const registry = this.config.toolRegistry;
    if (!registry) {
      throw new Error("No tool registry provided to SGRAgent");
    }

    const tool = registry.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} is not registered`);
    }

    const parsed = tool.inputSchema.parse(args);

    this.record({
      ...this.createBaseEvent(),
      kind: "tool_call",
      toolName: name,
      args: parsed,
    });

    const result = await tool.handler(
      parsed,
      ctx ?? this.config.toolContext ?? {}
    );

    this.record({
      ...this.createBaseEvent(),
      kind: "tool_result",
      toolName: name,
      result,
    });

    return result;
  }

  log(message: string): void {
    this.record({
      ...this.createBaseEvent(),
      kind: "log",
      message,
    });
  }

  getEvents(): readonly SGREvent[] {
    return [...this.events];
  }
}
