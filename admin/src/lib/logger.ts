const PREFIX = "[ShortiGo Studio]";

function contextBlock(
  context?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!context || Object.keys(context).length === 0) {
    return undefined;
  }
  return context;
}

export function logInfo(
  message: string,
  context?: Record<string, unknown>,
): void {
  const block = contextBlock(context);
  if (block) {
    console.info(PREFIX, message, block);
  } else {
    console.info(PREFIX, message);
  }
}

export function logWarn(
  message: string,
  context?: Record<string, unknown>,
): void {
  const block = contextBlock(context);
  if (block) {
    console.warn(PREFIX, message, block);
  } else {
    console.warn(PREFIX, message);
  }
}

export function logError(
  message: string,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const block = contextBlock(context);
  if (block) {
    console.error(PREFIX, message, error, block);
  } else {
    console.error(PREFIX, message, error);
  }
}
