import { afterEach, describe, expect, it, vi } from "vitest";
import { SGRAgent } from "./agent";
import { ToolRegistry } from "./tools";
import { DefaultNextStepSchema } from "./schema";
import type { LLMClient, LLMMessage } from "./interfaces";
import { z } from "zod";
import type { Logger } from "./logger";

const fakeLogger: Logger = {
  log: vi.fn()
};

const fakeClient: LLMClient = {
  id: "mock-client",
  async generateStructured({ schema }: { messages: LLMMessage[]; schema: typeof DefaultNextStepSchema; model?: string }) {
    const nextStep = { type: "final_answer", answer: "ok" } as const;
    return {
      value: schema.parse(nextStep),
      raw: { messages: schema.parse(nextStep), messagesCount: 1 }
    };
  }
};

describe("SGRAgent", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  it("records model steps and logs via logger", async () => {
    const agent = new SGRAgent({
      llmClient: fakeClient,
      logger: fakeLogger
    });

    const messages: LLMMessage[] = [{ role: "user", content: "hello" }];
    const nextStep = await agent.plan(messages);

    expect(nextStep.type).toBe("final_answer");
    expect(nextStep.answer).toBe("ok");
    expect(agent.getEvents()).toHaveLength(1);
    expect(fakeLogger.log).toHaveBeenCalledWith("info", expect.stringContaining("recorded:model_step"), {
      stepIndex: 0
    });
  });

  it("can invoke registered tools and emits tool events", async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "echo",
      inputSchema: z.string(),
      handler: async (value) => value
    });

    const agent = new SGRAgent({
      llmClient: fakeClient,
      toolRegistry: registry
    });

    const result = await agent.callTool("echo", "payload");

    expect(result).toBe("payload");
    const events = agent.getEvents();
    const toolCallEvent = events.find((event) => event.kind === "tool_call");
    const toolResultEvent = events.find((event) => event.kind === "tool_result");

    expect(toolCallEvent).toBeDefined();
    expect(toolResultEvent).toBeDefined();
  });
});
