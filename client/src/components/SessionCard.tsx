import { ArrowRight, CalendarDays, Clock3, MapPin, Monitor, UsersRound } from "lucide-react";
import { Link } from "wouter";

export type SessionCardData = {
  id: number;
  title: string;
  subject: string;
  description?: string;
  startsAt: Date | string;
  endsAt?: Date | string;
  location: string | null;
  onlineLink?: string | null;
  format: "in_person" | "online" | "hybrid";
  capacity: number;
  seatsTaken: number;
  hostName?: string | null;
};

export function formatSessionTime(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default function SessionCard({ session, compact = false }: { session: SessionCardData; compact?: boolean }) {
  const seats = Math.max(session.capacity - session.seatsTaken, 0);
  const isOnline = session.format === "online";
  return (
    <article className={`group relative rounded-2xl border border-[#d7e8e4] bg-white p-5 shadow-[0_18px_38px_-30px_rgba(19,50,77,0.45)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_45px_-28px_rgba(19,50,77,0.55)] ${compact ? "" : "sm:p-6"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-[#e5f4f0] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.11em] text-[#0d7676]">{session.subject}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${seats > 0 ? "bg-[#fff6df] text-[#996a11]" : "bg-[#f9e8e8] text-[#a04444]"}`}>{seats > 0 ? `${seats} seat${seats === 1 ? "" : "s"} open` : "Waitlist only"}</span>
      </div>
      <h3 className="mt-4 text-lg font-bold tracking-tight text-[#16314d]">{session.title}</h3>
      {!compact && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#607487]">{session.description || "A focused peer study session with a clear shared goal."}</p>}
      <div className="mt-5 space-y-2 text-sm text-[#5d7483]">
        <p className="flex items-center gap-2"><CalendarDays className="size-4 text-[#0d7676]" />{formatSessionTime(session.startsAt)}</p>
        <p className="flex items-center gap-2"><Clock3 className="size-4 text-[#0d7676]" />{session.endsAt ? `${Math.round((new Date(session.endsAt).getTime() - new Date(session.startsAt).getTime()) / 3_600_000 * 10) / 10} hours` : "Flexible duration"}</p>
        <p className="flex items-center gap-2"><span className="grid size-4 place-items-center">{isOnline ? <Monitor className="size-4 text-[#0d7676]" /> : <MapPin className="size-4 text-[#0d7676]" />}</span>{isOnline ? "Online study room" : session.location || "Location shared after joining"}</p>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-[#e5efec] pt-4">
        <span className="flex items-center gap-2 text-xs font-semibold text-[#607487]"><UsersRound className="size-4" />{session.seatsTaken}/{session.capacity} committed</span>
        <Link href={`/sessions/${session.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-[#0d7676] transition group-hover:gap-2">Details <ArrowRight className="size-4" /></Link>
      </div>
    </article>
  );
}
