import type { StreamEntry } from 'pino-multi-stream';
import type { LoggerConfig } from '../schema.js';

export const createJsonTransport = (
  config: LoggerConfig
): StreamEntry | null => {
  if (!config.transports.json.enabled) {
    return null;
  }

  return { stream: process.stdout };
};
