import type { PieceKind, Rng } from './types';
import { ALL_KINDS } from './constants';

export function defaultRng(): Rng {
  return Math.random;
}

export function shuffleBag(rng: Rng): PieceKind[] {
  const bag = [...ALL_KINDS];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function refill(
  queue: PieceKind[],
  bag: PieceKind[],
  minQueue: number,
  rng: Rng,
): { queue: PieceKind[]; bag: PieceKind[] } {
  const nextQueue = [...queue];
  let nextBag = [...bag];
  while (nextQueue.length < minQueue) {
    if (nextBag.length === 0) {
      nextBag = shuffleBag(rng);
    }
    nextQueue.push(nextBag.shift()!);
  }
  return { queue: nextQueue, bag: nextBag };
}

export function takeNext(
  queue: PieceKind[],
  bag: PieceKind[],
  minQueue: number,
  rng: Rng,
): { piece: PieceKind; queue: PieceKind[]; bag: PieceKind[] } {
  let currentQueue = queue;
  let currentBag = bag;
  if (currentQueue.length === 0) {
    const refilled = refill(currentQueue, currentBag, minQueue + 1, rng);
    currentQueue = refilled.queue;
    currentBag = refilled.bag;
  }
  const [piece, ...rest] = currentQueue;
  const topped = refill(rest, currentBag, minQueue, rng);
  return { piece, queue: topped.queue, bag: topped.bag };
}
