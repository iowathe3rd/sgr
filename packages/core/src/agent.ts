import { z } from "zod";
import { DefaultNextStepSchema } from "./schema";
import type { LLMClient, LLMMessage } from "./interfaces";
import type { SGREvent, SGRPattern } from "./events";
import type { ToolContext, ToolRegistry } from "./tools";

export interface SGRAgentConfig<TNextStep extends z.ZodTypeAny> {
  llmClient: LLMClient;
  toolRegistry?: ToolRegistry;
  nextStepSchema?: TNextStep;
  model?: string;
  pattern?: SGRPattern;
  toolContext?: ToolContext;
}

export class SGRAgent<TNextStep extends z.ZodTypeAny = typeof DefaultNextStepSchema> {
  private readonly nextStepSchema: TNextStep;
  private readonly events: SGREvent[] = [];
  private stepCounter = 0;

  constructor(private config: SGRAgentConfig<TNextStep>) {
    this.nextStepSchema = config.nextStepSchema ?? (DefaultNextStepSchema as TNextStep);
  }

  private record(event: SGREvent): void {
    this.events.push(event);
  }

  private createBaseEvent(): Omit<SGREventBase, "stepIndex"> & { stepIndex: number } {
    return {
      stepIndex: this.stepCounter++,
      timestamp: Date.now(),
      pattern: this.config.pattern
    };
  }

  async plan(messages: LLMMessage[], overrideSchema?: TNextStep): Promise<z.infer<TNextStep>> {
    const schema = overrideSchema ?? this.nextStepSchema;
    const { value, raw } = await this.config.llmClient.generateStructured({
      messages,
      schema,
      model: this.config.model
    });

    this.record({
      ...this.createBaseEvent(),
      kind: "model_step",
      nextStep: value,
      raw
    });

    return value;
  }

  async callTool<TInputSchema extends z.ZodTypeAny = z.ZodTypeAny>(
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
      args: parsed
    });

    const result = await tool.handler(parsed, ctx ?? this.config.toolContext ?? {});

    this.record({
      ...this.createBaseEvent(),
      kind: "tool_result",
      toolName: name,
      result
    });

    return result;
  }

  log(message: string): void {
    this.record({
      ...this.createBaseEvent(),
      kind: "log",
      message
    });
  }

  getEvents(): readonly SGREvent[] {
    return [...this.events];
  }
}
