import { beforeEach, describe, expect, it } from 'vitest';
import { loadLoggerConfig } from '../src/config.js';

const ORIGINAL_ENV = { ...process.env };

describe('loadLoggerConfig', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_REDACT_FIELDS;
  });

  it('resolves the service name from the closest package.json', () => {
    const config = loadLoggerConfig();
    expect(config.serviceName.length).toBeGreaterThan(0);
  });

  it('applies environment overrides for level and redaction', () => {
    process.env.LOG_LEVEL = 'debug';
    process.env.LOG_REDACT_FIELDS = 'secret, token , password';

    const config = loadLoggerConfig();

    expect(config.level).toBe('debug');
    expect(config.redaction).toEqual(['secret', 'token', 'password']);
  });

  it('merges transport overrides while preserving defaults', () => {
    const config = loadLoggerConfig({
      transports: {
        file: { enabled: true, path: '/tmp/audit.log' },
        json: { enabled: false },
      },
    });

    expect(config.transports.file.enabled).toBe(true);
    expect(config.transports.file.path).toBe('/tmp/audit.log');
    expect(config.transports.json.enabled).toBe(false);
  });
});
