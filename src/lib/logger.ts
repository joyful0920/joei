type LogLevel = "info" | "warn" | "error";

interface LogFields {
  requestId?: string;
  route?: string;
  locale?: string;
  upstreamStatus?: number;
  latencyMs?: number;
  cacheStatus?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, fields: LogFields) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    ...fields,
  });
  // Edge / Node 兩方で動く console を使う (process.stdout は Edge に無い)
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (fields: LogFields) => emit("info", fields),
  warn: (fields: LogFields) => emit("warn", fields),
  error: (fields: LogFields) => emit("error", fields),
};
