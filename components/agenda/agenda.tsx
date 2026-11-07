"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  periodTitle,
  shiftAnchor,
  startOfDay,
  visibleRange,
  type AgendaView,
} from "@/lib/dates";
import { useNowMs } from "@/lib/clock";
import { fetchMeetings, ReconnectError, syncPeriod } from "@/lib/meetings";
import { DayView, MonthView, WeekView } from "./views";

const VIEWS: { id: AgendaView; label: string }[] = [
  { id: "dia", label: "Dia" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}


function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

const iconBtn = "flex h-11 w-11 items-center justify-center rounded-full text-text";

function Skeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-6" aria-busy="true" aria-label="Buscando sua agenda">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[60px] animate-pulse rounded-xl bg-surface" />
      ))}
      <p className="text-center text-sm text-text-2">Buscando sua agenda…</p>
    </div>
  );
}

function Banner({ tone, children }: { tone: "warn" | "danger"; children: React.ReactNode }) {
  return (
    <div
      role="status"
      className={`mx-4 mb-3 flex items-center justify-between gap-3 rounded-xl bg-surface px-3.5 py-2.5 text-sm ${
        tone === "warn" ? "text-warn" : "text-danger"
      }`}
    >
      {children}
    </div>
  );
}

export function Agenda() {
  const nowMs = useNowMs();
  // Dia em foco: começa em "hoje" até o usuário navegar.
  const [chosenAnchor, setAnchor] = useState<Date | null>(null);

  if (!nowMs) return <Skeleton />;
  const now = new Date(nowMs);
  return <AgendaInner now={now} anchor={chosenAnchor ?? startOfDay(now)} setAnchor={setAnchor} />;
}

function AgendaInner({
  now,
  anchor,
  setAnchor,
}: {
  now: Date;
  anchor: Date;
  setAnchor: (d: Date) => void;
}) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<AgendaView>("semana");
  const [chosenDay, setSelected] = useState<Date | null>(null);
  const selected = chosenDay ?? anchor;
  const online = useOnline();

  const { from, to } = useMemo(() => visibleRange(view, anchor), [view, anchor]);
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  const { data: meetings, isPending, isError, refetch } = useQuery({
    queryKey: ["meetings", fromIso, toIso],
    queryFn: () => fetchMeetings(new Date(fromIso), new Date(toIso)),
    placeholderData: keepPreviousData,
  });

  // Sincroniza com o Google ao abrir e ao trocar de período (no máximo a cada 5 min por período).
  const autoSync = useQuery({
    queryKey: ["sync", fromIso, toIso],
    queryFn: async () => {
      await syncPeriod(new Date(fromIso), new Date(toIso));
      return Date.now();
    },
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Botão de atualizar: força, ignorando os 5 minutos.
  const manualSync = useMutation({
    mutationFn: () => syncPeriod(new Date(fromIso), new Date(toIso)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meetings"] }),
  });

  // Sync terminou: recarrega as reuniões do banco.
  const syncedAt = autoSync.dataUpdatedAt;
  useEffect(() => {
    if (syncedAt) void queryClient.invalidateQueries({ queryKey: ["meetings"] });
  }, [syncedAt, queryClient]);

  const syncing = autoSync.isFetching || manualSync.isPending;
  const syncFailure = manualSync.error ?? autoSync.error;
  const syncError: "reconnect" | "failed" | null = !syncFailure
    ? null
    : syncFailure instanceof ReconnectError
      ? "reconnect"
      : "failed";

  function goTo(d: Date) {
    setAnchor(d);
    setSelected(d);
  }

  const list = meetings ?? [];

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col">
      <header className="flex flex-col gap-3.5 px-4 pb-3 pt-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{periodTitle(view, anchor)}</h1>
          <div className="-mr-2 flex items-center gap-1">
            <button
              type="button"
              aria-label="Período anterior"
              className={iconBtn}
              onClick={() => goTo(shiftAnchor(view, anchor, -1))}
            >
              <Icon d="M15 6l-6 6 6 6" />
            </button>
            <button
              type="button"
              aria-label="Próximo período"
              className={iconBtn}
              onClick={() => goTo(shiftAnchor(view, anchor, 1))}
            >
              <Icon d="M9 6l6 6-6 6" />
            </button>
            <button
              type="button"
              aria-label="Atualizar agenda"
              className={iconBtn}
              disabled={syncing}
              onClick={() => manualSync.mutate()}
            >
              <span className={syncing ? "animate-spin" : ""}>
                <Icon d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />
              </span>
            </button>
            <Link href="/configuracoes" aria-label="Configurações" className={iconBtn}>
              <Icon d="M4 6h16M4 12h16M4 18h16" />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div role="tablist" aria-label="Visão" className="flex flex-1 gap-0.5 rounded-full bg-surface p-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                className={`h-9 flex-1 rounded-full text-sm ${
                  view === v.id
                    ? "border border-border bg-bg font-semibold text-text"
                    : "border border-transparent font-medium text-text-2"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(startOfDay(now))}
            className="h-11 rounded-full border border-border px-4 text-sm font-medium"
          >
            Hoje
          </button>
        </div>
      </header>

      {!online ? <Banner tone="warn">Offline. Mostrando os dados salvos.</Banner> : null}
      {syncError === "reconnect" ? (
        <Banner tone="danger">
          <span>Reconecte sua conta Google para atualizar a agenda.</span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="h-11 shrink-0 font-semibold">
              Reconectar
            </button>
          </form>
        </Banner>
      ) : null}
      {syncError === "failed" && online ? (
        <Banner tone="warn">
          <span>Não foi possível atualizar. Mostrando dados salvos.</span>
          <button type="button" onClick={() => manualSync.mutate()} className="h-11 shrink-0 font-semibold">
            Tentar de novo
          </button>
        </Banner>
      ) : null}
      {isError ? (
        <Banner tone="danger">
          <span>Não foi possível carregar as reuniões.</span>
          <button type="button" onClick={() => void refetch()} className="h-11 shrink-0 font-semibold">
            Tentar de novo
          </button>
        </Banner>
      ) : null}

      <main className="flex-1">
        {isPending ? (
          <Skeleton />
        ) : view === "dia" ? (
          <DayView anchor={anchor} meetings={list} now={now} />
        ) : view === "semana" ? (
          <WeekView anchor={anchor} meetings={list} now={now} />
        ) : (
          <MonthView
            anchor={anchor}
            meetings={list}
            now={now}
            selected={selected}
            onSelect={setSelected}
            onOpenDay={(d) => {
              setAnchor(d);
              setView("dia");
            }}
          />
        )}
      </main>
    </div>
  );
}
