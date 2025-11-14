import path from 'node:path';
import type { LoggerConfig } from './schema';

const defaultLogFilePath = path.resolve(process.cwd(), 'logs/monorepo.log');

export const baseLoggerConfig: LoggerConfig = {
  level: 'info',
  serviceName: 'unknown-service',
  transports: {
    file: {
      enabled: false,
      path: defaultLogFilePath,
    },
    json: {
      enabled: true,
    },
  },
  redaction: ['password', 'token'],
};
