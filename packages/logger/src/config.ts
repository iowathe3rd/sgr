import fs from 'node:fs';
import path from 'node:path';
import { baseLoggerConfig } from './logger.config.js';
import { loggerConfigSchema } from './schema.js';
import type { LoggerConfig, LoggerConfigInput } from './schema.js';

const LOG_LEVELS = new Set(['fatal', 'error', 'warn', 'info', 'debug', 'trace']);
let cachedServiceName: string | null = null;

const mergeConfig = (
  ...configs: readonly LoggerConfigInput[]
): LoggerConfigInput => {
  return configs.reduce<LoggerConfigInput>((acc, config) => {
    for (const [key, value] of Object.entries(config)) {
      if (value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        (acc as Record<string, unknown>)[key] = value;
        continue;
      }

      if (value !== null && typeof value === 'object') {
        const previous = acc[key as keyof LoggerConfigInput];
        (acc as Record<string, unknown>)[key] = {
          ...(typeof previous === 'object' && previous !== null ? previous : {}),
          ...value,
        };
        continue;
      }

      (acc as Record<string, unknown>)[key] = value;
    }

    return acc;
  }, {});
};

const parseRedactionFields = (value: string | undefined): string[] | undefined => {
  if (!value) {
    return undefined;
  }

  const fields = value
    .split(',')
    .map((field) => field.trim())
    .filter((field) => field.length > 0);

  return fields.length > 0 ? fields : undefined;
};

const resolveServiceName = (candidate?: string): string => {
  if (candidate && candidate.length > 0) {
    return candidate;
  }

  if (cachedServiceName) {
    return cachedServiceName;
  }

  const packageName = findPackageName();
  cachedServiceName = packageName ?? 'unknown-service';
  return cachedServiceName;
};

const findPackageName = (): string | undefined => {
  const packagePath = findNearestPackageJson();
  if (!packagePath) {
    return undefined;
  }

  try {
    const fileContent = fs.readFileSync(packagePath, 'utf-8');
    const parsed = JSON.parse(fileContent) as { name?: unknown };
    if (typeof parsed.name === 'string' && parsed.name.length > 0) {
      return parsed.name;
    }
  } catch (error) {
    // Ignore malformed package.json files and fallback to unknown-service.
  }

  return undefined;
};

const findNearestPackageJson = (): string | undefined => {
  let currentDir = process.cwd();
  while (true) {
    const candidate = path.join(currentDir, 'package.json');
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(currentDir);
    if (parent === currentDir) {
      return undefined;
    }
    currentDir = parent;
  }
};

export const loadLoggerConfig = (
  overrides: LoggerConfigInput = {}
): LoggerConfig => {
  const envOverrides: LoggerConfigInput = {};

  const envLevel = process.env.LOG_LEVEL;
  if (envLevel && LOG_LEVELS.has(envLevel)) {
    envOverrides.level = envLevel as LoggerConfig['level'];
  }

  const envRedactions = parseRedactionFields(process.env.LOG_REDACT_FIELDS);
  if (envRedactions) {
    envOverrides.redaction = envRedactions;
  }

  const merged = mergeConfig(baseLoggerConfig, envOverrides, overrides);
  const withServiceName = {
    ...merged,
    serviceName: resolveServiceName(
      overrides.serviceName ?? merged.serviceName
    ),
    redaction: merged.redaction?.filter((item, index, array) => array.indexOf(item) === index) ?? [],
  } satisfies LoggerConfigInput;

  return loggerConfigSchema.parse(withServiceName);
};
