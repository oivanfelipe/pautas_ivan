import { addDays, dayKey, dayLabel, isSameDay, monthGrid, startOfWeek } from "@/lib/dates";
import type { Meeting } from "@/lib/meetings";
import { MeetingCard } from "./meeting-card";

export function groupByDay(meetings: Meeting[]): Map<string, Meeting[]> {
  const map = new Map<string, Meeting[]>();
  for (const m of meetings) {
    const key = dayKey(new Date(m.starts_at));
    map.set(key, [...(map.get(key) ?? []), m]);
  }
  return map;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-10 text-center text-text-2">{children}</p>;
}

function DayList({ day, meetings, now }: { day: Date; meetings: Meeting[]; now: Date }) {
  const today = isSameDay(day, now);
  return (
    <section className="flex flex-col gap-2">
      <h2 className={`text-[13px] font-semibold ${today ? "text-accent" : "text-text-2"}`}>
        {today ? "Hoje · " : ""}
        {dayLabel(day)}
      </h2>
      {meetings.map((m) => (
        <MeetingCard key={m.id} meeting={m} now={now} />
      ))}
    </section>
  );
}

export function DayView({ anchor, meetings, now }: { anchor: Date; meetings: Meeting[]; now: Date }) {
  if (meetings.length === 0) {
    return <Empty>Nenhuma reunião com outras pessoas neste dia.</Empty>;
  }
  return (
    <div className="flex flex-col gap-2 px-4 pb-8">
      {meetings.map((m) => (
        <MeetingCard key={m.id} meeting={m} now={now} />
      ))}
      <span className="sr-only">{dayLabel(anchor)}</span>
    </div>
  );
}

export function WeekView({ anchor, meetings, now }: { anchor: Date; meetings: Meeting[]; now: Date }) {
  if (meetings.length === 0) {
    return <Empty>Nenhuma reunião com outras pessoas nesta semana.</Empty>;
  }
  const byDay = groupByDay(meetings);
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i)).filter((d) =>
    byDay.has(dayKey(d)),
  );

  return (
    <div className="flex flex-col gap-5 px-4 pb-8">
      {days.map((d) => (
        <DayList key={dayKey(d)} day={d} meetings={byDay.get(dayKey(d)) ?? []} now={now} />
      ))}
    </div>
  );
}

const WEEKDAY_INITIALS = ["S", "T", "Q", "Q", "S", "S", "D"];

export function MonthView({
  anchor,
  meetings,
  now,
  selected,
  onSelect,
  onOpenDay,
}: {
  anchor: Date;
  meetings: Meeting[];
  now: Date;
  selected: Date;
  onSelect: (d: Date) => void;
  onOpenDay: (d: Date) => void;
}) {
  const byDay = groupByDay(meetings);
  const grid = monthGrid(anchor);
  const selectedMeetings = byDay.get(dayKey(selected)) ?? [];

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="px-4">
        <div className="grid grid-cols-7 pb-1 text-center text-xs font-medium text-text-2">
          {WEEKDAY_INITIALS.map((w, i) => (
            <div key={i} aria-hidden="true">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((d) => {
            const inMonth = d.getMonth() === anchor.getMonth();
            const count = (byDay.get(dayKey(d)) ?? []).filter((m) => m.status === "confirmed").length;
            const today = isSameDay(d, now);
            const isSelected = isSameDay(d, selected);
            return (
              <button
                key={dayKey(d)}
                type="button"
                onClick={() => onSelect(d)}
                aria-label={`${dayLabel(d)}${count ? `, ${count} reuniões` : ""}`}
                aria-pressed={isSelected}
                className={`flex h-11 flex-col items-center justify-center gap-0.5 text-[15px] tabular-nums ${
                  inMonth ? "" : "opacity-50 text-text-2"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    today
                      ? "bg-accent font-semibold text-on-accent"
                      : isSelected
                        ? "border-2 border-accent"
                        : ""
                  }`}
                >
                  {d.getDate()}
                </span>
                <span
                  aria-hidden="true"
                  className={`h-[5px] w-[5px] rounded-full ${count ? "bg-accent" : "bg-transparent"}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border px-4 pt-4">
        <div className="flex items-center justify-between">
          <h2
            className={`text-[13px] font-semibold ${isSameDay(selected, now) ? "text-accent" : "text-text-2"}`}
          >
            {isSameDay(selected, now) ? "Hoje · " : ""}
            {dayLabel(selected)} · {selectedMeetings.length}{" "}
            {selectedMeetings.length === 1 ? "reunião" : "reuniões"}
          </h2>
          <button
            type="button"
            onClick={() => onOpenDay(selected)}
            className="h-11 px-1 text-sm font-medium text-accent"
          >
            Abrir dia
          </button>
        </div>
        {selectedMeetings.length === 0 ? (
          <p className="py-4 text-text-2">Nenhuma reunião neste dia.</p>
        ) : (
          selectedMeetings.map((m) => <MeetingCard key={m.id} meeting={m} now={now} />)
        )}
      </div>
    </div>
  );
}
