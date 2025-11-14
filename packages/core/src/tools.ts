import { z } from "zod";

export interface ToolContext {
  metadata?: Record<string, unknown>;
}

export interface ToolDefinition<
  TInputSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput = unknown
> {
  name: string;
  description?: string;
  inputSchema: TInputSchema;
  handler: (args: z.infer<TInputSchema>, ctx: ToolContext) => Promise<TOutput>;
}

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  list(): readonly ToolDefinition[] {
    return Array.from(this.tools.values());
  }
}
