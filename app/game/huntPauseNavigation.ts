let bypassDepth = 0;

/**
 * React Navigation emits beforeRemove synchronously while dispatching an action.
 * Keep the bypass scoped to that one dispatch so a failed/no-op navigation can
 * never leave the Hunt exit guard accidentally disabled.
 */
export function withHuntExitGuardBypass<T>(operation: () => T): T {
  bypassDepth += 1;
  try {
    return operation();
  } finally {
    bypassDepth -= 1;
  }
}

export function isHuntExitGuardBypassed(): boolean {
  return bypassDepth > 0;
}
