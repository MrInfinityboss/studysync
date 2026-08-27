import { startGoogleLogin, startLogin } from "@/const";
import { ArrowRight, BookOpen, CalendarCheck2, Check, Compass, PlusCircle, ShieldCheck, UsersRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const authState = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("auth") : null;
  const authMessage = authState === "google-cancelled" ? "Google sign-in was cancelled. You can choose another account and try again." : authState ? "Google sign-in was not completed. Please try again or use Manus sign-in." : null;
  return (
    <div className="min-h-screen overflow-hidden bg-[#f7fbfa] text-[#16314d]">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#16314d] text-[#e7bd5c]"><BookOpen className="size-5" /></span><span className="font-serif text-2xl font-semibold tracking-tight">StudySync</span></Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#4f697b] md:flex"><a href="#how-it-works" className="hover:text-[#0d7676]">How it works</a><a href="#principles" className="hover:text-[#0d7676]">Built for focus</a></nav>
        <Button onClick={startLogin} variant="outline" className="border-[#9bcfc7] bg-white text-[#0d7676] hover:bg-[#e8f5f2]">Sign in</Button>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-28 lg:pt-20">
          <div className="absolute -left-24 top-0 size-80 rounded-full bg-[#dff4ee] blur-3xl" /><div className="absolute right-0 top-24 size-64 rounded-full bg-[#f7e6bc]/55 blur-3xl" />
          <div className="relative flex flex-col items-start justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b9e0d8] bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.13em] text-[#0d7676]"><span className="size-1.5 rounded-full bg-[#0d7676]" />A calmer way to coordinate</div>
            <h1 className="mt-6 max-w-2xl font-serif text-5xl font-semibold leading-[1.03] tracking-tight text-[#16314d] sm:text-6xl lg:text-7xl">Find your people. <span className="text-[#0d7676]">Protect</span> your focus.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#5d7483]">StudySync helps you discover focused, small-group sessions—without the noise of group chats and missed messages.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button onClick={startGoogleLogin} size="lg" className="bg-[#0d7676] px-6 text-white shadow-[0_16px_30px_-14px_rgba(13,118,118,0.75)] hover:bg-[#095e61]"><span className="mr-2 grid size-5 place-items-center rounded-full bg-white font-sans text-xs font-extrabold text-[#4285f4]">G</span>Continue with Google</Button><Button onClick={startLogin} variant="outline" size="lg" className="border-[#9bcfc7] bg-white px-5 text-[#16314d] hover:bg-[#e8f5f2]">Use alternate sign-in</Button><a href="#how-it-works" className="inline-flex items-center justify-center rounded-lg px-2 text-sm font-bold text-[#16314d] hover:text-[#0d7676]">See how it works</a></div>
            <p className="mt-3 text-xs text-[#78909e]">Google sign-in uses your verified email address to create or connect your StudySync profile.</p>
            {authMessage && <p role="alert" className="mt-4 max-w-xl rounded-xl border border-[#eed1d1] bg-[#fff5f5] px-4 py-3 text-sm text-[#9a4444]">{authMessage}</p>}
            <div className="mt-11 grid grid-cols-3 gap-6 border-t border-[#d7e8e4] pt-6 text-sm"><div><p className="font-serif text-2xl font-semibold text-[#16314d]">01</p><p className="mt-1 leading-5 text-[#607487]">Discover a clear goal</p></div><div><p className="font-serif text-2xl font-semibold text-[#16314d]">02</p><p className="mt-1 leading-5 text-[#607487]">Commit to a time</p></div><div><p className="font-serif text-2xl font-semibold text-[#16314d]">03</p><p className="mt-1 leading-5 text-[#607487]">Learn together</p></div></div>
          </div>
          <div className="relative mx-auto w-full max-w-[560px] pt-3 lg:pt-10">
            <div className="absolute inset-0 rotate-3 rounded-[2.4rem] bg-[#c7ebe3]" />
            <div className="relative rounded-[2.25rem] border border-white/80 bg-white p-5 shadow-[0_30px_70px_-34px_rgba(19,50,77,0.45)] sm:p-7">
              <div className="flex items-center justify-between border-b border-[#e5efec] pb-5"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#16314d] text-[#e7bd5c]"><BookOpen className="size-5" /></span><div><p className="font-bold">Your next focus block</p><p className="text-sm text-[#78909e]">Make time for what matters.</p></div></div><span className="rounded-full bg-[#e5f4f0] px-3 py-1 text-xs font-bold text-[#0d7676]">Today</span></div>
              <div className="mt-6 rounded-2xl bg-[#16314d] p-6 text-white"><div className="flex items-center justify-between"><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-[#bde5dc]">STUDY SESSION</span><span className="size-2 rounded-full bg-[#e7bd5c]" /></div><h2 className="mt-5 font-serif text-2xl font-semibold">Bring a question. Leave with a plan.</h2><div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 text-sm text-[#c9e4df]"><span className="flex items-center gap-2"><CalendarCheck2 className="size-4 text-[#e7bd5c]" />Choose a time</span><span className="flex items-center gap-2"><UsersRound className="size-4 text-[#e7bd5c]" />Keep it small</span></div></div>
              <div className="mt-5 grid grid-cols-2 gap-4"><div className="rounded-2xl border border-[#dfece9] p-4"><Compass className="size-5 text-[#0d7676]" /><p className="mt-5 text-sm font-bold">Explore sessions</p><p className="mt-1 text-xs leading-5 text-[#718697]">Search with confidence.</p></div><div className="rounded-2xl bg-[#f8efd8] p-4"><PlusCircle className="size-5 text-[#a2761f]" /><p className="mt-5 text-sm font-bold">Host one well</p><p className="mt-1 text-xs leading-5 text-[#7e7356]">Set a goal and capacity.</p></div></div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-[#d7e8e4] bg-white py-20"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="max-w-xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0d7676]">Designed around commitment</p><h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight">A study session should be simple to say yes to.</h2></div><div className="mt-12 grid gap-6 md:grid-cols-3">{[["Discover","Search by subject, format, time, and available seats—then see the essentials at a glance.",Compass],["Host","Give your group a clear purpose, schedule, location, and participant capacity.",PlusCircle],["Learn","Join with confidence, manage your commitments, and stay focused on the work.",CalendarCheck2]].map(([title, body, Icon], index) => <article key={String(title)} className="rounded-2xl border border-[#dcebe7] p-7"><span className="text-sm font-bold text-[#a37620]">0{index + 1}</span><Icon className="mt-7 size-6 text-[#0d7676]" /><h3 className="mt-5 text-xl font-bold">{String(title)}</h3><p className="mt-3 leading-7 text-[#607487]">{String(body)}</p></article>)}</div></div></section>
        <section id="principles" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-10"><div className="rounded-[2rem] bg-[#dff2ed] p-8 sm:p-10"><ShieldCheck className="size-7 text-[#0d7676]" /><h2 className="mt-7 font-serif text-3xl font-semibold">Thoughtful by design.</h2><p className="mt-4 max-w-md leading-7 text-[#527278]">The platform is structured around clear session details, capacity awareness, and user-owned commitments.</p></div><div className="flex flex-col justify-center"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0d7676]">StudySync principles</p><ul className="mt-6 space-y-5">{["A clear goal before a calendar commitment.","Smaller groups with useful participant context.","Simple states: available, joined, waitlisted, or cancelled."].map((item) => <li key={item} className="flex gap-3 text-lg text-[#35536b]"><span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-[#0d7676] text-white"><Check className="size-3" /></span>{item}</li>)}</ul></div></section>
      </main>
      <footer className="border-t border-[#d7e8e4] px-5 py-8 text-center text-sm text-[#78909e]">StudySync · Built for intentional academic collaboration.</footer>
    </div>
  );
}
