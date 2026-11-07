// Datas da Agenda. Tudo no fuso do aparelho. A semana começa na segunda-feira.

export type AgendaView = "dia" | "semana" | "mes";

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function addMonths(d: Date, n: number): Date {
  // Dia 1 do mês de destino: evita saltar de 31/jan para março.
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function startOfWeek(d: Date): Date {
  const day = startOfDay(d);
  const offset = (day.getDay() + 6) % 7; // segunda = 0
  return addDays(day, -offset);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Chave estável de um dia (AAAA-MM-DD, no fuso do aparelho).
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Intervalo [from, to) que cobre o período visível.
export function visibleRange(view: AgendaView, anchor: Date): { from: Date; to: Date } {
  if (view === "dia") {
    const from = startOfDay(anchor);
    return { from, to: addDays(from, 1) };
  }
  if (view === "semana") {
    const from = startOfWeek(anchor);
    return { from, to: addDays(from, 7) };
  }
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const from = startOfWeek(first);
  const to = addDays(startOfWeek(last), 7);
  return { from, to };
}

// Dias da grade do mês (múltiplo de 7), começando na segunda.
export function monthGrid(anchor: Date): Date[] {
  const { from, to } = visibleRange("mes", anchor);
  const days: Date[] = [];
  for (let d = from; d < to; d = addDays(d, 1)) days.push(d);
  return days;
}

export function shiftAnchor(view: AgendaView, anchor: Date, direction: 1 | -1): Date {
  if (view === "dia") return addDays(anchor, direction);
  if (view === "semana") return addDays(anchor, 7 * direction);
  return addMonths(anchor, direction);
}

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const WEEKDAYS_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function monthName(d: Date): string {
  return MONTHS[d.getMonth()];
}

// "seg, 2 nov"
export function dayLabel(d: Date): string {
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

// Título do cabeçalho: "2 de novembro" | "2–8 de novembro" | "30 de nov – 6 de dez" | "Novembro 2026"
export function periodTitle(view: AgendaView, anchor: Date): string {
  if (view === "dia") return `${anchor.getDate()} de ${monthName(anchor)}`;
  if (view === "mes") {
    const name = monthName(anchor);
    return `${name[0].toUpperCase()}${name.slice(1)} ${anchor.getFullYear()}`;
  }
  const start = startOfWeek(anchor);
  const end = addDays(start, 6);
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} de ${monthName(end)}`;
  }
  return `${start.getDate()} de ${MONTHS_SHORT[start.getMonth()]} – ${end.getDate()} de ${MONTHS_SHORT[end.getMonth()]}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });
}
