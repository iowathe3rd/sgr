export type SGRPattern = "cascade" | "routing" | "cycle";

export type SGREventBase = {
  stepIndex: number;
  timestamp: number;
  pattern?: SGRPattern;
};

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
