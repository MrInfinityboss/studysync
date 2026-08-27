import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { BookOpen, CalendarDays, Compass, Home, LogOut, PlusCircle, UserCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/sessions/new", label: "Host a session", icon: PlusCircle },
  { href: "/my-sessions", label: "My sessions", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

function AccessGate() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5faf8] px-5">
      <section className="max-w-md rounded-[2rem] border border-[#cfe7e1] bg-white p-10 text-center shadow-[0_22px_65px_-35px_rgba(19,50,77,0.45)]">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-[#dff2ed] text-[#0d7676]"><BookOpen className="size-7" /></div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0d7676]">StudySync access</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-[#16314d]">Your study space awaits.</h1>
        <p className="mt-4 leading-7 text-[#607487]">Sign in to find focused sessions, keep your commitments organised, and host a group of your own.</p>
        <Button onClick={startLogin} className="mt-7 w-full bg-[#0d7676] text-white hover:bg-[#095e61]">Sign in to continue</Button>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-[#0d7676] hover:underline">Return to the landing page</Link>
      </section>
    </main>
  );
}

export default function StudyShell({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#f5faf8] text-[#607487]"><div className="study-pulse size-12 rounded-full bg-[#0d7676]" /></div>;
  }
  if (!isAuthenticated) return <AccessGate />;

  const initial = user?.name?.trim().charAt(0).toUpperCase() || "S";
  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-[#f5faf8] text-[#16314d]">
      <header className="sticky top-0 z-30 border-b border-[#d7e8e4]/90 bg-[#f5faf8]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-7">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[#16314d] text-[#e3b957]"><BookOpen className="size-5" /></span>
            <span className="font-serif text-xl font-semibold tracking-tight">StudySync</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[#607487] sm:block">Hello, {user?.name?.split(" ")[0] || "Scholar"}</span>
            <Link href="/profile" className="grid size-9 place-items-center rounded-full bg-[#c9ece4] text-sm font-bold text-[#0d7676]" aria-label="Open profile">{initial}</Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="hidden text-[#607487] hover:bg-[#e7f3f0] hover:text-[#16314d] sm:inline-flex" aria-label="Sign out"><LogOut className="size-4" /></Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-[#d7e8e4] px-4 py-7 lg:flex">
          <p className="px-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#78909e]">Your workspace</p>
          <nav className="mt-4 space-y-1" aria-label="Authenticated navigation">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = location === href || (href === "/discover" && location.startsWith("/sessions/") && !location.endsWith("/edit"));
              return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-[#16314d] text-white shadow-sm" : "text-[#607487] hover:bg-[#e7f3f0] hover:text-[#16314d]"}`}><Icon className="size-[18px]" />{label}</Link>;
            })}
          </nav>
          <div className="mt-auto rounded-2xl bg-[#dff2ed] p-4">
            <p className="text-sm font-bold text-[#16314d]">A better study rhythm.</p>
            <p className="mt-2 text-xs leading-5 text-[#507278]">Keep groups small, goals clear, and time protected.</p>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 pb-24 pt-7 sm:px-7 lg:px-10 lg:py-10">{children}</main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-white/70 bg-[#16314d]/95 p-1.5 shadow-[0_18px_45px_-15px_rgba(19,50,77,0.65)] backdrop-blur lg:hidden" aria-label="Mobile navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return <Link key={href} href={href} aria-label={label} className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[0.62rem] font-bold ${active ? "bg-[#0d7676] text-white" : "text-[#cce5df]"}`}><Icon className="size-[18px]" /><span className="max-w-[62px] truncate">{label.split(" ")[0]}</span></Link>;
        })}
      </nav>
    </div>
  );
}
