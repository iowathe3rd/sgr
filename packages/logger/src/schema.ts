import { z } from 'zod';

export const loggerConfigSchema = z.object({
  level: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
  serviceName: z.string().min(1, 'Service name is required for log context'),
  transports: z.object({
    file: z.object({
      enabled: z.boolean(),
      path: z.string().min(1, 'Log file path cannot be empty'),
    }),
    json: z.object({
      enabled: z.boolean(),
    }),
  }),
  redaction: z.array(z.string().min(1)).default([]),
});

export type LoggerConfig = z.infer<typeof loggerConfigSchema>;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? DeepPartial<T[K]>
    : T[K];
};

export type LoggerConfigInput = DeepPartial<LoggerConfig>;
