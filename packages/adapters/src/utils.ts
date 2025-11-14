export function parseStructuredResponse(content: unknown): unknown {
  if (typeof content !== "string") {
    return content;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return content;
  }

  // TODO: fix lint ignore
  // biome-ignore lint/performance/useTopLevelRegex: temp
  const bareJson = trimmed.replace(/^```json\s*/, "").replace(/```$/, "");
  try {
    return JSON.parse(bareJson);
  } catch {
    // TODO: fix lint ignore
    // biome-ignore lint/performance/useTopLevelRegex: temp
    const match = trimmed.match(/```json\s+([\s\S]+?)```/i);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {
        return match[1].trim();
      }
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
}
