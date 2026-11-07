import Link from "next/link";
import { formatTime } from "@/lib/dates";
import type { Meeting } from "@/lib/meetings";

export function isLive(m: Meeting, now: Date): boolean {
  const t = now.getTime();
  return m.status === "confirmed" && new Date(m.starts_at).getTime() <= t && t < new Date(m.ends_at).getTime();
}

function progress(m: Meeting): string {
  return m.total === 0 ? "Pauta vazia" : `${m.done}/${m.total}`;
}

export function MeetingCard({ meeting, now }: { meeting: Meeting; now: Date }) {
  const live = isLive(meeting, now);
  const cancelled = meeting.status === "cancelled";

  return (
    <div className={`flex flex-col gap-3 rounded-xl p-3.5 ${live ? "bg-live" : "border border-border"}`}>
      <Link href={`/reuniao/${meeting.id}`} className="flex items-center gap-3">
        <span
          className={`w-12 shrink-0 text-[13px] tabular-nums ${live ? "font-semibold text-accent" : "text-text-2"}`}
        >
          {formatTime(meeting.starts_at)}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block text-base font-medium ${cancelled ? "text-text-2 line-through" : ""}`}
          >
            {meeting.title}
          </span>
          {live ? (
            <span className="block text-[13px] text-text-2">
              Em andamento · até {formatTime(meeting.ends_at)}
            </span>
          ) : null}
          {cancelled ? <span className="block text-[13px] text-danger">Cancelada</span> : null}
        </span>
        <span
          className={`shrink-0 text-[13px] tabular-nums ${live ? "font-semibold" : "text-text-2"}`}
        >
          {progress(meeting)}
        </span>
      </Link>
      {live ? (
        <Link
          href={`/reuniao/${meeting.id}/ao-vivo`}
          className="flex h-11 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-on-accent"
        >
          Modo Reunião
        </Link>
      ) : null}
    </div>
  );
}
