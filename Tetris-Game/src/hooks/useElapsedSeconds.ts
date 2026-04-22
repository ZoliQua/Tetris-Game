import { useEffect, useRef, useState } from 'react';

export function useElapsedSeconds(running: boolean, resetKey: unknown): number {
  const [seconds, setSeconds] = useState(0);
  const [lastKey, setLastKey] = useState<unknown>(resetKey);
  const baseRef = useRef(0);
  const startRef = useRef<number | null>(null);

  if (!Object.is(lastKey, resetKey)) {
    setLastKey(resetKey);
    setSeconds(0);
  }

  useEffect(() => {
    baseRef.current = 0;
    startRef.current = null;
  }, [resetKey]);

  useEffect(() => {
    if (!running) {
      if (startRef.current !== null) {
        baseRef.current += (performance.now() - startRef.current) / 1000;
        startRef.current = null;
      }
      return;
    }
    startRef.current = performance.now();
    const id = window.setInterval(() => {
      const started = startRef.current;
      if (started === null) return;
      const elapsed = baseRef.current + (performance.now() - started) / 1000;
      setSeconds(Math.floor(elapsed));
    }, 250);
    return () => {
      window.clearInterval(id);
      if (startRef.current !== null) {
        baseRef.current += (performance.now() - startRef.current) / 1000;
        startRef.current = null;
      }
    };
  }, [running]);

  return seconds;
}

export function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
