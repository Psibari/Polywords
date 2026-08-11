export type ActiveGameStorage = {
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export type ActiveGamePersistenceOptions<T> = {
  key: string;
  storage: ActiveGameStorage;
  getSnapshot: () => T;
  shouldPersist: (snapshot: T) => boolean;
  debounceMs?: number;
  serialize?: (snapshot: T) => string;
  setTimer?: (callback: () => void, delayMs: number) => unknown;
  clearTimer?: (handle: unknown) => void;
};

// Owns every active-Hunt write/removal so an older debounced or in-flight
// write can never land after a forfeit and recreate the deleted run.
export function createActiveGamePersistenceCoordinator<T>(
  options: ActiveGamePersistenceOptions<T>,
) {
  const serialize = options.serialize ?? JSON.stringify;
  const debounceMs = options.debounceMs ?? 400;
  const setTimer = options.setTimer ?? ((callback, delay) => setTimeout(callback, delay));
  const clearTimer = options.clearTimer ?? (
    handle => clearTimeout(handle as ReturnType<typeof setTimeout>)
  );

  let timer: unknown = null;
  let generation = 0;
  // The store is born with a placeholder `playing` game. Persistence is only
  // armed by a real game mutation, and discard keeps background flushes from
  // resurrecting a forfeited in-memory run.
  let armed = false;
  let operationQueue: Promise<void> = Promise.resolve();

  function cancelTimer(): void {
    if (timer === null) return;
    clearTimer(timer);
    timer = null;
  }

  function enqueue(operation: () => Promise<void>): Promise<void> {
    const result = operationQueue.then(operation, operation);
    // A failed storage call must not poison later removal/save operations.
    operationQueue = result.catch(() => {});
    return result;
  }

  function enqueueSnapshot(snapshot: T, expectedGeneration: number): Promise<void> {
    const serialized = serialize(snapshot);
    return enqueue(async () => {
      if (generation !== expectedGeneration) return;
      await options.storage.setItem(options.key, serialized);
    });
  }

  function schedule(): void {
    cancelTimer();
    if (!armed) return;
    const expectedGeneration = generation;
    timer = setTimer(() => {
      timer = null;
      if (generation !== expectedGeneration) return;
      const snapshot = options.getSnapshot();
      if (!options.shouldPersist(snapshot)) return;
      void enqueueSnapshot(snapshot, expectedGeneration).catch(() => {});
    }, debounceMs);
  }

  async function flush(): Promise<void> {
    cancelTimer();
    if (!armed) {
      await operationQueue;
      return;
    }
    const snapshot = options.getSnapshot();
    if (!options.shouldPersist(snapshot)) {
      await operationQueue;
      return;
    }
    await enqueueSnapshot(snapshot, generation);
  }

  function discard(): Promise<void> {
    cancelTimer();
    armed = false;
    generation += 1;
    return enqueue(() => options.storage.removeItem(options.key));
  }

  return {
    arm: () => { armed = true; },
    schedule,
    flush,
    discard,
    whenIdle: () => operationQueue,
  };
}
