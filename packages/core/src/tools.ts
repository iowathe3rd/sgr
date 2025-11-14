import type { z } from "zod";

/**
 * Carries metadata that tools may receive when invoked by the agent.
 */
export interface ToolContext {
  metadata?: Record<string, unknown>;
}

/**
 * Describes a structured tool that validates input and returns structured output.
 */
export interface ToolDefinition<
  TInputSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput = unknown
> {
  name: string;
  description?: string;
  inputSchema: TInputSchema;
  handler: (args: z.infer<TInputSchema>, ctx: ToolContext) => Promise<TOutput>;
}

/**
 * Registry for storing and retrieving tool definitions.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  /**
   * Registers or replaces a tool definition by name.
   */
  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Retrieves a tool by name.
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Lists every registered tool.
   */
  list(): readonly ToolDefinition[] {
    return Array.from(this.tools.values());
  }
}
