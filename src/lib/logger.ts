/**
 * Tiny logger wrapper. Swap implementation centrally if needed.
 * Invariants: never throws; safe in SSR and client.
 */

type LogMethod = (message: string, meta?: Record<string, unknown>) => void;

const format = (level: string, message: string, meta?: Record<string, unknown>): string => {
  const suffix = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${level}] ${message}${suffix}`;
};

export const logger: { info: LogMethod; warn: LogMethod; error: LogMethod } = {
  info: (message, meta) => console.info(format("info", message, meta)),
  warn: (message, meta) => console.warn(format("warn", message, meta)),
  error: (message, meta) => console.error(format("error", message, meta)),
};
