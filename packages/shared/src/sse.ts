import { userHub } from './realtime';
import type { UserEvent } from './types';

const HEARTBEAT_MS = 25_000;

/**
 * Builds a Server-Sent Events response streaming user changes.
 * `onlyUserId` restricts the stream to one user's own document (client app).
 */
export function userEventStream(signal: AbortSignal, onlyUserId?: string): Response {
  const encoder = new TextEncoder();
  let cleanup = () => {};

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      const send = (event: string, data: unknown) => write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

      let unsubscribe = () => {};
      const heartbeat = setInterval(() => write(': ping\n\n'), HEARTBEAT_MS);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      signal.addEventListener('abort', cleanup, { once: true });

      try {
        unsubscribe = await userHub.subscribe(({ targetId, ...event }) => {
          if (onlyUserId && targetId !== onlyUserId) return;
          send('user', event satisfies UserEvent);
        });
        // Tell the browser how long to wait before reconnecting, then signal readiness.
        write('retry: 3000\n\n');
        send('ready', { at: new Date().toISOString() });
      } catch (err) {
        console.error('[sse] could not open change stream', err);
        send('fatal', { message: 'Live updates need MongoDB running as a replica set.' });
        cleanup();
      }
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable proxy buffering (nginx)
    },
  });
}
