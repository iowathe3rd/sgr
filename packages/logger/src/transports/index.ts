import type { StreamEntry } from 'pino-multi-stream';
import type { LoggerConfig } from '../schema.js';
import { createFileTransport } from './file.js';
import { createJsonTransport } from './json.js';

export const buildTransports = (
  config: LoggerConfig
): StreamEntry[] => {
  const streams: StreamEntry[] = [];
  const fileTransport = createFileTransport(config);
  if (fileTransport) {
    streams.push(fileTransport);
  }

  const jsonTransport = createJsonTransport(config);
  if (jsonTransport) {
    streams.push(jsonTransport);
  }

  if (streams.length === 0) {
    streams.push({ stream: process.stdout });
  }

  return streams;
};
