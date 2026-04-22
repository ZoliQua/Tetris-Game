import { useCallback, useEffect, useState } from 'react';
import { HIGH_SCORE_KEY } from '../logic/constants';

function readStored(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
    if (raw === null) return 0;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function useHighScore(): { best: number; submit: (score: number) => void } {
  const [best, setBest] = useState<number>(() => readStored());

  const submit = useCallback((score: number) => {
    if (!Number.isFinite(score) || score <= 0) return;
    setBest((current) => {
      if (score <= current) return current;
      try {
        window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
      } catch {
        // ignore quota/storage errors
      }
      return score;
    });
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== HIGH_SCORE_KEY) return;
      setBest(readStored());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { best, submit };
}
