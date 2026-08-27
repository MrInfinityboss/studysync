import StudyShell from "@/components/StudyShell";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpen, Save, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

type FormState = { title: string; subject: string; description: string; date: string; startTime: string; endTime: string; location: string; onlineLink: string; format: "in_person" | "online" | "hybrid"; capacity: number; tags: string };
const tomorrow = new Date(Date.now() + 86_400_000);
const initialForm: FormState = { title: "", subject: "", description: "", date: tomorrow.toISOString().slice(0, 10), startTime: "16:00", endTime: "17:30", location: "", onlineLink: "", format: "in_person", capacity: 6, tags: "" };

export default function SessionForm() {
  const [, params] = useRoute("/sessions/:id/edit");
  const id = params?.id ? Number(params.id) : undefined;
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<FormState>(initialForm);
  const detail = trpc.sessions.detail.useQuery({ id: id ?? 0 }, { enabled: Boolean(id) });
  const create = trpc.sessions.create.useMutation({ onSuccess: ({ id: createdId }) => { toast.success("Your session is ready."); setLocation(`/sessions/${createdId}`); }, onError: (error) => toast.error(error.message) });
  const update = trpc.sessions.update.useMutation({ onSuccess: () => { toast.success("Session updated."); setLocation(`/sessions/${id}`); }, onError: (error) => toast.error(error.message) });
  useEffect(() => {
    if (!detail.data) return;
    const startsAt = new Date(detail.data.startsAt); const endsAt = new Date(detail.data.endsAt);
    setForm({ title: detail.data.title, subject: detail.data.subject, description: detail.data.description, date: startsAt.toISOString().slice(0, 10), startTime: startsAt.toTimeString().slice(0, 5), endTime: endsAt.toTimeString().slice(0, 5), location: detail.data.location || "", onlineLink: detail.data.onlineLink || "", format: detail.data.format, capacity: detail.data.capacity, tags: detail.data.tags.join(", ") });
  }, [detail.data]);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (status: "draft" | "published") => {
    const startsAt = new Date(`${form.date}T${form.startTime}`).getTime(); const endsAt = new Date(`${form.date}T${form.endTime}`).getTime();
    const payload = { title: form.title, subject: form.subject, description: form.description, startsAt, endsAt, location: form.location || null, onlineLink: form.onlineLink || null, format: form.format, capacity: Number(form.capacity), status, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) };
    if (id) update.mutate({ id, data: payload }); else create.mutate(payload);
  };
  const pending = create.isPending || update.isPending;
  if (id && detail.isLoading) {
    return <StudyShell><div className="mx-auto max-w-4xl"><div className="h-7 w-36 animate-pulse rounded bg-[#e5f0ed]" /><div className="mt-6 h-44 animate-pulse rounded-[1.75rem] bg-[#dcebe7]" /><div className="mt-6 h-[520px] animate-pulse rounded-2xl bg-white" /></div></StudyShell>;
  }
  return <StudyShell>
    <div className="mx-auto max-w-4xl"><Link href={id ? `/sessions/${id}` : "/dashboard"} className="inline-flex items-center gap-2 text-sm font-bold text-[#0d7676] hover:underline"><ArrowLeft className="size-4" />{id ? "Back to session" : "Back to overview"}</Link>
      <div className="mt-6 rounded-[1.75rem] bg-[#16314d] px-6 py-8 text-white sm:px-9"><p className="text-sm font-bold uppercase tracking-[0.15em] text-[#bde5dc]">Host a focused group</p><h1 className="mt-2 font-serif text-4xl font-semibold">{id ? "Refine your session." : "Create a study session."}</h1><p className="mt-3 max-w-xl text-[#c8e1dc]">A clear plan helps participants know exactly what they are joining.</p></div>
      {detail.error && <div className="mt-6 rounded-xl border border-[#f0caca] bg-[#fff4f4] p-4 text-sm text-[#9b4141]">This session could not be loaded for editing.</div>}
      <form onSubmit={(event) => { event.preventDefault(); submit("published"); }} className="mt-6 rounded-2xl border border-[#d7e8e4] bg-white p-5 shadow-[0_22px_55px_-42px_rgba(19,50,77,0.5)] sm:p-8"><div className="grid gap-6 md:grid-cols-2"><label className="md:col-span-2"><span className="field-label">Session title</span><input required value={form.title} onChange={(event) => set("title", event.target.value)} className="field-input" placeholder="e.g. Calculus II problem-solving review" /></label><label><span className="field-label">Subject</span><input required value={form.subject} onChange={(event) => set("subject", event.target.value)} className="field-input" placeholder="e.g. Mathematics" /></label><label><span className="field-label">Participant capacity</span><input required type="number" min="2" max="40" value={form.capacity} onChange={(event) => set("capacity", Number(event.target.value))} className="field-input" /></label><label><span className="field-label">Date</span><input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.date} onChange={(event) => set("date", event.target.value)} className="field-input" /></label><div className="grid grid-cols-2 gap-3"><label><span className="field-label">Start</span><input required type="time" value={form.startTime} onChange={(event) => set("startTime", event.target.value)} className="field-input" /></label><label><span className="field-label">End</span><input required type="time" value={form.endTime} onChange={(event) => set("endTime", event.target.value)} className="field-input" /></label></div><label><span className="field-label">Format</span><select value={form.format} onChange={(event) => set("format", event.target.value as FormState["format"])} className="field-input"><option value="in_person">In person</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></label><label><span className="field-label">Tags</span><input value={form.tags} onChange={(event) => set("tags", event.target.value)} className="field-input" placeholder="exam prep, problem solving" /></label><label className="md:col-span-2"><span className="field-label">Location</span><input value={form.location} onChange={(event) => set("location", event.target.value)} className="field-input" placeholder="e.g. Library, Room 204" /></label><label className="md:col-span-2"><span className="field-label">Online link</span><input type="url" value={form.onlineLink} onChange={(event) => set("onlineLink", event.target.value)} className="field-input" placeholder="https://… (required if there is no physical location)" /></label><label className="md:col-span-2"><span className="field-label">Description and expectations</span><textarea required value={form.description} onChange={(event) => set("description", event.target.value)} className="field-input min-h-32 resize-y" placeholder="Explain the goal, material to bring, and what participants can expect." /></label></div>
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#e5efec] pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs leading-5 text-[#718697]"><BookOpen className="size-4 text-[#0d7676]" />Saved sessions can stay as drafts until you are ready to share them.</p><div className="flex gap-3"><button type="button" disabled={pending} onClick={() => submit("draft")} className="inline-flex h-11 items-center justify-center rounded-xl border border-[#b9d7d1] px-4 text-sm font-bold text-[#0d7676] hover:bg-[#eaf5f2] disabled:opacity-60"><Save className="mr-2 size-4" />Save draft</button><button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0d7676] px-4 text-sm font-bold text-white hover:bg-[#095e61] disabled:opacity-60"><Send className="mr-2 size-4" />{pending ? "Saving…" : id ? "Update session" : "Publish session"}</button></div></div>
      </form>
    </div>
  </StudyShell>;
}
