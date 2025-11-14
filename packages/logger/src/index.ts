import pino, { type Logger } from 'pino';
import { createWriteStream } from 'pino-multi-stream';
import { buildTransports } from './transports/index.js';
import { buildRedaction } from './redaction.js';
import { loadLoggerConfig } from './config.js';
import type { LoggerConfig, LoggerConfigInput } from './schema.js';

export const createLogger = (config: LoggerConfig): Logger => {
  const destination = createWriteStream(buildTransports(config));

  return pino(
    {
      level: config.level,
      redact: buildRedaction(config.redaction),
      base: { service: config.serviceName },
    },
    destination
  );
};

export let logger: Logger = createLogger(loadLoggerConfig());

export const initLogger = (
  overrides?: LoggerConfigInput
): Logger => {
  const config = loadLoggerConfig(overrides);
  logger = createLogger(config);
  return logger;
};

export type { LoggerConfig, LoggerConfigInput } from './schema.js';
export { loadLoggerConfig } from './config.js';
