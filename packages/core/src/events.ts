/**
 * Supported orchestration patterns for an agent run.
 */
export type SGRPattern = "cascade" | "routing" | "cycle";

/**
 * Common data carried by all events emitted by the agent.
 */
export type SGREventBase = {
  stepIndex: number;
  timestamp: number;
  pattern?: SGRPattern;
};

/**
 * Event union describing agent lifecycle, tool calls, and logs.
 */
export type SGREvent =
  | (SGREventBase & {
      kind: "model_step";
      nextStep: unknown;
      raw: unknown;
    })
  | (SGREventBase & {
      kind: "tool_call";
      toolName: string;
      args: unknown;
    })
  | (SGREventBase & {
      kind: "tool_result";
      toolName: string;
      result: unknown;
    })
  | (SGREventBase & {
      kind: "log";
      message: string;
    });
