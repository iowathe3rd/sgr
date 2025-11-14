import type { z } from "zod";
import type { SGREvent, SGREventBase, SGRPattern } from "./events";
import type { LLMClient, LLMMessage } from "./interfaces";
import type { Logger } from "./logger";
import { DefaultNextStepSchema } from "./schema";
import type { ToolContext, ToolRegistry } from "./tools";

/**
 * Configuration for a schema-guided reasoning agent.
 */
export type SGRAgentConfig<TNextStep extends z.ZodTypeAny> = {
  llmClient: LLMClient;
  toolRegistry?: ToolRegistry;
  nextStepSchema?: TNextStep;
  model?: string;
  pattern?: SGRPattern;
  toolContext?: ToolContext;
  logger?: Logger;
};

/**
 * SGRAgent orchestrates structured reasoning over LLM outputs and tools.
 */
export class SGRAgent<
  TNextStep extends z.ZodTypeAny = typeof DefaultNextStepSchema,
> {
  private readonly nextStepSchema: TNextStep;
  private readonly events: SGREvent[] = [];
  private stepCounter = 0;
  private readonly logger?: Logger;

  //TODO: investigate parameter properties
  // biome-ignore lint/style/noParameterProperties: tempo
  constructor(private readonly config: SGRAgentConfig<TNextStep>) {
    this.nextStepSchema =
      this.config.nextStepSchema ??
      (DefaultNextStepSchema as unknown as TNextStep);
    this.logger = config.logger;
  }

  private record(event: SGREvent): void {
    this.events.push(event);
    this.logger?.log("debug", `event:${event.kind}`, {
      stepIndex: event.stepIndex,
      kind: event.kind,
    });
  }

  private createBaseEvent(): SGREventBase {
    const stepIndex = this.stepCounter;
    this.stepCounter += 1;
    return {
      stepIndex,
      timestamp: Date.now(),
      pattern: this.config.pattern,
    };
  }

  private annotateEvent<T extends SGREvent>(event: T): T {
    this.logger?.log("info", `recorded:${event.kind}`, {
      stepIndex: event.stepIndex,
    });
    return event;
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

    const parsedValue = schema.parse(value);

    const event: SGREvent = {
      ...this.createBaseEvent(),
      kind: "model_step",
      nextStep: parsedValue,
      raw,
    };

    this.record(this.annotateEvent(event));

    return parsedValue;
  }

  async callTool(
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

    const parsedArgs = tool.inputSchema.parse(args);

    const callEvent: SGREvent = {
      ...this.createBaseEvent(),
      kind: "tool_call",
      toolName: name,
      args: parsedArgs,
    };

    this.record(this.annotateEvent(callEvent));

    const result = await tool.handler(
      parsedArgs,
      ctx ?? this.config.toolContext ?? {}
    );

    const resultEvent: SGREvent = {
      ...this.createBaseEvent(),
      kind: "tool_result",
      toolName: name,
      result,
    };

    this.record(this.annotateEvent(resultEvent));

    return result;
  }

  log(message: string, metadata?: Record<string, unknown>): void {
    const event: SGREvent = {
      ...this.createBaseEvent(),
      kind: "log",
      message,
    };

    this.record(this.annotateEvent(event));
    this.logger?.log("debug", message, metadata);
  }

  getEvents(): readonly SGREvent[] {
    return [...this.events];
  }
}
