import { useSyncExternalStore } from "react";

// Relógio compartilhado, atualizado a cada 30 s. No servidor devolve 0, para a primeira
// renderização do servidor e a do navegador serem idênticas (sem `new Date()` na renderização).
const TICK_MS = 30_000;
const listeners = new Set<() => void>();
let snapshot = 0;
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    snapshot = Date.now();
    timer = setInterval(() => {
      snapshot = Date.now();
      listeners.forEach((l) => l());
    }, TICK_MS);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) clearInterval(timer);
  };
}

function getSnapshot() {
  if (snapshot === 0) snapshot = Date.now();
  return snapshot;
}

// Milissegundos "agora", ou 0 enquanto renderiza no servidor.
export function useNowMs(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}
