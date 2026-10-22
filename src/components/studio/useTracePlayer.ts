import { useCallback, useEffect, useState } from 'react';

export const SPEEDS = [0.5, 1, 1.5, 2, 4] as const;
const BASE_INTERVAL_MS = 1100;

/** Index-based playback over a fixed list of precomputed steps. Resets when `resetKey` changes. */
export function useTracePlayer(total: number, resetKey: unknown) {
  const [rawIndex, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);

  const last = Math.max(total - 1, 0);
  const index = Math.min(rawIndex, last);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [resetKey]);

  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIndex((i) => Math.min(i + 1, last)), BASE_INTERVAL_MS / speed);
    return () => clearTimeout(t);
  }, [playing, index, last, speed]);

  const play = useCallback(() => {
    if (total <= 1) return;
    if (index >= last) setIndex(0);
    setPlaying(true);
  }, [index, last, total]);

  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause]);
  const next = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.min(Math.min(i, last) + 1, last));
  }, [last]);
  const prev = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.max(Math.min(i, last) - 1, 0));
  }, [last]);
  const reset = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);
  const seek = useCallback(
    (i: number) => {
      setPlaying(false);
      setIndex(Math.max(0, Math.min(i, last)));
    },
    [last],
  );
  const toEnd = useCallback(() => seek(last), [seek, last]);

  return { index, total, playing, speed, setSpeed, play, pause, toggle, next, prev, reset, seek, toEnd, atStart: index === 0, atEnd: index >= last };
}

export type TracePlayer = ReturnType<typeof useTracePlayer>;
