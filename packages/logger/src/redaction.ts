import type { LoggerOptions } from 'pino';

export const buildRedaction = (
  fields: readonly string[]
): LoggerOptions['redact'] => {
  const sanitized = fields
    .map((field) => field.trim())
    .filter((field) => field.length > 0);

  const unique = Array.from(new Set(sanitized));

  if (unique.length === 0) {
    return undefined;
  }

  return {
    paths: unique,
    censor: '[REDACTED]',
  } satisfies LoggerOptions['redact'];
};
