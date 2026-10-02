'use client';
import { useEffect, useRef, useState } from 'react';

export type LiveStatus = 'connecting' | 'live' | 'reconnecting' | 'unavailable';

type Handlers<T> = {
  onEvent: (event: T) => void;
  /** Called on every (re)connect. `reconnected` is true after a drop — refetch to cover missed events. */
  onReady?: (reconnected: boolean) => void;
};

/**
 * Subscribes to an SSE endpoint. EventSource reconnects on its own; this hook tracks
 * status and keeps handler refs fresh so the connection isn't torn down on every render.
 */
export function useLiveStream<T>(url: string, handlers: Handlers<T>): LiveStatus {
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const source = new EventSource(url);
    let everConnected = false;

    source.addEventListener('ready', () => {
      setStatus('live');
      ref.current.onReady?.(everConnected);
      everConnected = true;
    });
    source.addEventListener('user', (e) => {
      try {
        ref.current.onEvent(JSON.parse((e as MessageEvent<string>).data) as T);
      } catch (err) {
        console.error('Bad live event', err);
      }
    });
    source.addEventListener('fatal', () => {
      setStatus('unavailable');
      source.close();
    });
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) setStatus('unavailable');
      else setStatus('reconnecting');
    };

    return () => source.close();
  }, [url]);

  return status;
}
