import { describe, expect, it } from "vitest";
import { ToolRegistry, type ToolDefinition } from "./tools";
import { z } from "zod";

describe("ToolRegistry", () => {
  const tool: ToolDefinition = {
    name: "inspect",
    description: "Echoes the input payload",
    inputSchema: z.object({
      value: z.string()
    }),
    handler: async ({ value }) => value
  };

  it("registers and retrieves tools by name", () => {
    const registry = new ToolRegistry();
    registry.register(tool);

    const retrieved = registry.get("inspect");

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe("inspect");
  });

  it("returns undefined for unknown tools", () => {
    const registry = new ToolRegistry();

    expect(registry.get("missing")).toBeUndefined();
  });

  it("lists all registered tools in insertion order", () => {
    const registry = new ToolRegistry();
    registry.register(tool);

    const tools = registry.list();

    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("inspect");
  });
});
