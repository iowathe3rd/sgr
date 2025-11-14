export type LogLevel = "debug" | "info" | "warn" | "error";

export type Logger = {
  log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): void;
};
