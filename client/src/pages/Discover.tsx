import StudyShell from "@/components/StudyShell";
import SessionCard, { type SessionCardData } from "@/components/SessionCard";
import { trpc } from "@/lib/trpc";
import { CalendarDays, Filter, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const subjects = ["", "Mathematics", "Computer Science", "Physics", "Chemistry", "Business", "Languages", "Other"];

export default function Discover() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [format, setFormat] = useState<"" | "in_person" | "online" | "hybrid">("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [dateRange, setDateRange] = useState<"all" | "today" | "week">("all");
  const [today] = useState(() => new Date());
  const filters = useMemo(() => {
    const start = new Date(today); start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    if (dateRange === "today") end.setDate(end.getDate() + 1);
    if (dateRange === "week") end.setDate(end.getDate() + 7);
    return { query: query || undefined, subject: subject || undefined, location: location || undefined, format: format || undefined, availableOnly, from: dateRange === "all" ? undefined : start.getTime(), to: dateRange === "all" ? undefined : end.getTime() };
  }, [availableOnly, dateRange, format, location, query, subject, today]);
  const { data, isLoading, error } = trpc.sessions.list.useQuery(filters);
  return <StudyShell>
    <div className="mx-auto max-w-6xl"><section className="rounded-[1.75rem] bg-[#16314d] px-6 py-8 text-white sm:px-9"><p className="text-sm font-bold uppercase tracking-[0.15em] text-[#bde5dc]">Session discovery</p><div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="font-serif text-4xl font-semibold tracking-tight">Find a study space.</h1><p className="mt-2 text-[#c8e1dc]">Search for a time, topic, and format that works for you.</p></div><Link href="/sessions/new" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#e7bd5c] px-4 text-sm font-bold text-[#16314d] hover:bg-[#f2cd75]">Host a session</Link></div></section>
      <section className="mt-6 rounded-2xl border border-[#d7e8e4] bg-white p-4 shadow-[0_18px_38px_-32px_rgba(19,50,77,0.45)] sm:p-5"><div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_170px_minmax(160px,.8fr)_170px_145px]"><label className="flex h-11 items-center gap-2 rounded-xl border border-[#c9ddd8] px-3 focus-within:border-[#0d7676] focus-within:ring-2 focus-within:ring-[#bde5dc]"><Search className="size-4 text-[#0d7676]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-[#90a3ad]" placeholder="Search sessions or goals" /></label><label className="relative"><span className="sr-only">Filter by subject</span><select value={subject} onChange={(event) => setSubject(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-[#c9ddd8] bg-white px-3 text-sm text-[#35536b] outline-none focus:border-[#0d7676]">{subjects.map((item) => <option key={item || "all"} value={item}>{item || "All subjects"}</option>)}</select><SlidersHorizontal className="pointer-events-none absolute right-3 top-3.5 size-4 text-[#0d7676]" /></label><label className="flex h-11 items-center gap-2 rounded-xl border border-[#c9ddd8] px-3 focus-within:border-[#0d7676] focus-within:ring-2 focus-within:ring-[#bde5dc]"><span className="text-[#0d7676]">⌖</span><input value={location} onChange={(event) => setLocation(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-[#90a3ad]" placeholder="Location" /></label><label className="relative"><span className="sr-only">Filter by format</span><select value={format} onChange={(event) => setFormat(event.target.value as typeof format)} className="h-11 w-full appearance-none rounded-xl border border-[#c9ddd8] bg-white px-3 text-sm text-[#35536b] outline-none focus:border-[#0d7676]"><option value="">Any format</option><option value="in_person">In person</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select><Filter className="pointer-events-none absolute right-3 top-3.5 size-4 text-[#0d7676]" /></label><label className="relative"><span className="sr-only">Filter by date</span><select value={dateRange} onChange={(event) => setDateRange(event.target.value as typeof dateRange)} className="h-11 w-full appearance-none rounded-xl border border-[#c9ddd8] bg-white px-3 text-sm text-[#35536b] outline-none focus:border-[#0d7676]"><option value="all">Any time</option><option value="today">Today</option><option value="week">This week</option></select><CalendarDays className="pointer-events-none absolute right-3 top-3.5 size-4 text-[#0d7676]" /></label></div><label className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#527278]"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} className="size-4 rounded border-[#a7c9c2] accent-[#0d7676]" />Only show available seats</label></section>
      <div className="mt-8 flex items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0d7676]">Results</p><h2 className="mt-1 font-serif text-3xl font-semibold">{isLoading ? "Finding sessions…" : `${data?.length ?? 0} session${data?.length === 1 ? "" : "s"} to explore`}</h2></div></div>
      {error && <div className="mt-5 rounded-xl border border-[#f0caca] bg-[#fff4f4] p-4 text-sm text-[#9b4141]">We could not search sessions right now. Please try again.</div>}
      <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{isLoading ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-white" />) : data?.length ? data.map((session) => <SessionCard key={session.id} session={session as SessionCardData} />) : <div className="rounded-2xl border border-dashed border-[#b7d8d1] bg-white p-10 text-center md:col-span-2 xl:col-span-3"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e5f4f0] text-[#0d7676]"><Search className="size-5" /></div><h3 className="mt-5 text-lg font-bold">No sessions match these filters.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#607487]">Try widening the time or format filters, or create a focused study group of your own.</p><Link href="/sessions/new" className="mt-5 inline-flex text-sm font-bold text-[#0d7676] hover:underline">Create a study session →</Link></div>}</section>
    </div>
  </StudyShell>;
}
