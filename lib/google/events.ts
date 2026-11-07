// Transforma um evento da API do Google Calendar em uma reunião do Pautas.
// Função pura, sem rede: regras do PRD ("só reuniões com outras pessoas").

export type GoogleAttendee = {
  email?: string;
  self?: boolean;
  resource?: boolean;
  responseStatus?: string;
};

export type GoogleEvent = {
  id: string;
  status?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: GoogleAttendee[];
  hangoutLink?: string;
  conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  recurringEventId?: string;
};

export type MeetingRow = {
  google_event_id: string;
  recurring_event_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  meet_url: string | null;
  attendees_count: number;
  status: "confirmed";
};

export type MappedEvent =
  | { kind: "meeting"; meeting: MeetingRow }
  | { kind: "skip"; reason: "cancelled" | "all_day" | "no_guests" | "declined" | "invalid" };

export function mapEvent(event: GoogleEvent): MappedEvent {
  if (event.status === "cancelled") return { kind: "skip", reason: "cancelled" };

  const start = event.start?.dateTime;
  const end = event.end?.dateTime;
  if (!start || !end) {
    // Evento de dia inteiro usa "date" em vez de "dateTime".
    return { kind: "skip", reason: event.start?.date ? "all_day" : "invalid" };
  }

  const attendees = event.attendees ?? [];
  const others = attendees.filter((a) => !a.self && !a.resource);
  if (others.length === 0) return { kind: "skip", reason: "no_guests" };

  const me = attendees.find((a) => a.self);
  if (me?.responseStatus === "declined") return { kind: "skip", reason: "declined" };

  const videoEntry = event.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === "video" && e.uri,
  );

  return {
    kind: "meeting",
    meeting: {
      google_event_id: event.id,
      recurring_event_id: event.recurringEventId ?? null,
      title: event.summary?.trim() || "(sem título)",
      starts_at: new Date(start).toISOString(),
      ends_at: new Date(end).toISOString(),
      meet_url: event.hangoutLink ?? videoEntry?.uri ?? null,
      attendees_count: others.length,
      status: "confirmed",
    },
  };
}
