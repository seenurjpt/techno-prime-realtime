import { EventEmitter } from 'node:events';
import type { ChangeStream, ChangeStreamDocument } from 'mongodb';
import { connectDB } from './db';
import { User } from './models';
import { toPublicUser } from './serialize';
import type { UserEvent } from './types';

/**
 * One MongoDB change stream per server process, fanned out to every SSE subscriber.
 * Opening a change stream per browser tab would cost a cursor + connection each;
 * this keeps it at one no matter how many admins/users are connected.
 * The stream opens on the first subscriber and closes when the last one leaves.
 */
type Listener = (event: UserEvent & { targetId: string }) => void;

class UserChangeHub {
  private emitter = new EventEmitter();
  private stream: ChangeStream | null = null;
  private opening: Promise<void> | null = null;
  private subscribers = 0;

  constructor() {
    this.emitter.setMaxListeners(0);
  }

  async subscribe(listener: Listener): Promise<() => void> {
    this.emitter.on('event', listener);
    this.subscribers++;
    try {
      await this.ensureOpen();
    } catch (err) {
      this.release(listener);
      throw err;
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.release(listener);
    };
  }

  private release(listener: Listener) {
    this.emitter.off('event', listener);
    this.subscribers = Math.max(0, this.subscribers - 1);
    if (this.subscribers === 0) void this.close();
  }

  private async ensureOpen() {
    if (this.stream) return;
    this.opening ??= (async () => {
      await connectDB();
      const stream = User.watch(
        [{ $match: { operationType: { $in: ['insert', 'update', 'replace', 'delete'] } } }],
        { fullDocument: 'updateLookup' },
      );
      stream.on('change', (change: ChangeStreamDocument) => this.handle(change));
      stream.on('error', (err) => {
        console.error('[realtime] change stream error, will reopen on next subscriber activity', err);
        void this.close().then(() => {
          if (this.subscribers > 0) void this.ensureOpen().catch(() => undefined);
        });
      });
      this.stream = stream as unknown as ChangeStream;
    })().finally(() => {
      this.opening = null;
    });
    await this.opening;
  }

  private handle(change: ChangeStreamDocument) {
    if (change.operationType === 'delete') {
      const id = String(change.documentKey._id);
      this.emitter.emit('event', { type: 'delete', id, targetId: id });
      return;
    }
    if (
      (change.operationType === 'insert' ||
        change.operationType === 'update' ||
        change.operationType === 'replace') &&
      change.fullDocument
    ) {
      // toPublicUser is a whitelist — passwordHash never leaves the server.
      const user = toPublicUser(change.fullDocument as Parameters<typeof toPublicUser>[0]);
      this.emitter.emit('event', { type: 'upsert', user, targetId: user.id });
    }
  }

  private async close() {
    const s = this.stream;
    this.stream = null;
    if (s) await s.close().catch(() => undefined);
  }
}

const g = globalThis as unknown as { __userHub?: UserChangeHub };
export const userHub = (g.__userHub ??= new UserChangeHub());
