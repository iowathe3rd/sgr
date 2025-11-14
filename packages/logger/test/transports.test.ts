import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFileTransport } from '../src/transports/file.js';
import { buildTransports } from '../src/transports/index.js';
import type { LoggerConfig } from '../src/schema.js';

const rotatingFileMock = vi.fn(() => new PassThrough());
vi.mock('pino-rotating-file', () => ({
  default: rotatingFileMock,
}));

afterEach(() => {
  rotatingFileMock.mockClear();
});

const baseConfig: LoggerConfig = {
  level: 'info',
  serviceName: 'test-service',
  transports: {
    file: { enabled: false, path: '/tmp/test.log' },
    json: { enabled: true },
  },
  redaction: [],
};

describe('transports', () => {
  it('returns null for the file transport when disabled', () => {
    const transport = createFileTransport(baseConfig);
    expect(transport).toBeNull();
    expect(rotatingFileMock).not.toHaveBeenCalled();
  });

  it('creates a rotating file transport when enabled', () => {
    const transport = createFileTransport({
      ...baseConfig,
      transports: {
        ...baseConfig.transports,
        file: { enabled: true, path: '/tmp/audit.log' },
      },
    });

    expect(transport).not.toBeNull();
    expect(rotatingFileMock).toHaveBeenCalledWith({
      interval: '1d',
      path: '/tmp/audit.log',
      compress: 'gzip',
      maxFiles: 30,
      mkdir: true,
    });
  });

  it('falls back to stdout when all transports are disabled', () => {
    const streams = buildTransports({
      ...baseConfig,
      transports: {
        file: { enabled: false, path: '/tmp/log' },
        json: { enabled: false },
      },
    });

    expect(streams).toHaveLength(1);
    expect(streams[0].stream).toBe(process.stdout);
  });
});
