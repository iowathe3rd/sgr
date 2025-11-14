import rotatingFile from 'pino-rotating-file';
import type { StreamEntry } from 'pino-multi-stream';
import type { LoggerConfig } from '../schema.js';

export const createFileTransport = (
  config: LoggerConfig
): StreamEntry | null => {
  if (!config.transports.file.enabled) {
    return null;
  }

  const stream = rotatingFile({
    interval: '1d',
    path: config.transports.file.path,
    compress: 'gzip',
    maxFiles: 30,
    mkdir: true,
  });

  return { stream };
};
