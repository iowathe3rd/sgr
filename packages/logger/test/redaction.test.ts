import { describe, expect, it } from 'vitest';
import { buildRedaction } from '../src/redaction.js';

describe('buildRedaction', () => {
  it('returns undefined when no fields are provided', () => {
    expect(buildRedaction([])).toBeUndefined();
  });

  it('deduplicates and trims redaction fields', () => {
    const redact = buildRedaction([' token ', 'token', 'password']);

    expect(redact).toStrictEqual({
      paths: ['token', 'password'],
      censor: '[REDACTED]',
    });
  });
});
