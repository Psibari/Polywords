import { createActiveGamePersistenceCoordinator } from './activeGamePersistence';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve = () => {};
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

function fakeTimers() {
  let nextId = 1;
  const callbacks = new Map<number, () => void>();
  return {
    set(callback: () => void): number {
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    },
    clear(id: number): void {
      callbacks.delete(id);
    },
    fireAll(): void {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach(callback => callback());
    },
    count(): number {
      return callbacks.size;
    },
  };
}

async function run(): Promise<void> {
  {
    const timers = fakeTimers();
    const operations: string[] = [];
    let stored: string | null = null;
    let snapshot = { status: 'playing', id: 'old' };
    const coordinator = createActiveGamePersistenceCoordinator({
      key: 'active',
      getSnapshot: () => snapshot,
      shouldPersist: value => value.status === 'playing',
      storage: {
        async setItem(_key, value) { operations.push(`set:${value}`); stored = value; },
        async removeItem() { operations.push('remove'); stored = null; },
      },
      setTimer: callback => timers.set(callback),
      clearTimer: id => timers.clear(id as number),
    });

    coordinator.arm();
    coordinator.schedule();
    eq(timers.count(), 1, 'forfeit.pendingSaveScheduled');
    await coordinator.discard();
    timers.fireAll();
    await coordinator.whenIdle();

    eq(stored, null, 'forfeit.pendingSaveCannotResurrect');
    eq(operations.join(','), 'remove', 'forfeit.cancelsPendingWriteBeforeRemove');

    await coordinator.flush();
    eq(stored, null, 'forfeit.backgroundFlushStaysDisarmed');
    eq(operations.join(','), 'remove', 'forfeit.backgroundFlushCannotRewriteDeletedRun');

    coordinator.schedule();
    timers.fireAll();
    await coordinator.whenIdle();
    eq(stored, null, 'forfeit.staleGameMutationStaysDisarmed');

    snapshot = { status: 'playing', id: 'new' };
    coordinator.arm();
    coordinator.schedule();
    timers.fireAll();
    await coordinator.whenIdle();
    eq(stored, JSON.stringify(snapshot), 'forfeit.newRunCanPersistAfterDiscard');
  }

  {
    const timers = fakeTimers();
    const writeGate = deferred();
    const operations: string[] = [];
    let stored: string | null = null;
    const snapshot = { status: 'playing', id: 'in-flight' };
    const coordinator = createActiveGamePersistenceCoordinator({
      key: 'active',
      getSnapshot: () => snapshot,
      shouldPersist: value => value.status === 'playing',
      storage: {
        async setItem(_key, value) {
          operations.push('set:start');
          await writeGate.promise;
          stored = value;
          operations.push('set:end');
        },
        async removeItem() { operations.push('remove'); stored = null; },
      },
      setTimer: callback => timers.set(callback),
      clearTimer: id => timers.clear(id as number),
    });

    coordinator.arm();
    coordinator.schedule();
    timers.fireAll();
    await Promise.resolve();
    const discarded = coordinator.discard();
    await Promise.resolve();
    eq(operations.join(','), 'set:start', 'forfeit.removeWaitsBehindInflightWrite');

    writeGate.resolve();
    await discarded;
    eq(stored, null, 'forfeit.inflightWriteCannotResurrect');
    eq(operations.join(','), 'set:start,set:end,remove', 'forfeit.serializesRemovalAfterWrite');
  }

  {
    const timers = fakeTimers();
    const removeGate = deferred();
    let stored: string | null = JSON.stringify({ status: 'playing', id: 'old' });
    let snapshot = { status: 'playing', id: 'old' };
    const coordinator = createActiveGamePersistenceCoordinator({
      key: 'active',
      getSnapshot: () => snapshot,
      shouldPersist: value => value.status === 'playing',
      storage: {
        async setItem(_key, value) { stored = value; },
        async removeItem() { await removeGate.promise; stored = null; },
      },
      setTimer: callback => timers.set(callback),
      clearTimer: id => timers.clear(id as number),
    });

    coordinator.arm();
    const discarded = coordinator.discard();
    snapshot = { status: 'playing', id: 'new' };
    coordinator.arm();
    coordinator.schedule();
    timers.fireAll();

    removeGate.resolve();
    await discarded;
    await coordinator.whenIdle();
    eq(stored, JSON.stringify(snapshot), 'forfeit.fastNewRunPersistsAfterRemoval');
  }

  {
    const timers = fakeTimers();
    let stored: string | null = null;
    let snapshot = { status: 'playing', id: 'first' };
    const coordinator = createActiveGamePersistenceCoordinator({
      key: 'active',
      getSnapshot: () => snapshot,
      shouldPersist: value => value.status === 'playing',
      storage: {
        async setItem(_key, value) { stored = value; },
        async removeItem() { stored = null; },
      },
      setTimer: callback => timers.set(callback),
      clearTimer: id => timers.clear(id as number),
    });

    coordinator.arm();
    coordinator.schedule();
    snapshot = { status: 'playing', id: 'latest' };
    await coordinator.flush();
    timers.fireAll();
    await coordinator.whenIdle();
    eq(stored, JSON.stringify(snapshot), 'background.flushUsesLatestSnapshotOnce');
  }
}

run().then(() => console.log('activeGamePersistence tests passed'));
