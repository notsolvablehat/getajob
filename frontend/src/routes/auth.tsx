import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail, Lock, ArrowRight, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLogin, useRegister } from "@/hooks/useAuth";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AuthPage,
});

// ── Floating job cards data ──────────────────────────────────────────────────
const JOB_CARDS = [
  { company: "Stripe", role: "Senior Backend Engineer", location: "San Francisco, CA", icon: "S", color: "#6772e5", rotation: -8, x: 4, y: 8, delay: 0 },
  { company: "Vercel", role: "Full Stack Engineer", location: "Remote", icon: "▲", color: "#ececec", rotation: 6, x: 68, y: 6, delay: 3 },
  { company: "Notion", role: "Software Engineer", location: "New York, NY", icon: "N", color: "#ececec", rotation: -5, x: 2, y: 42, delay: 5 },
  { company: "Linear", role: "Product Engineer", location: "Remote", icon: "◆", color: "#5e6ad2", rotation: 7, x: 72, y: 38, delay: 1.5 },
  { company: "Discord", role: "Backend Engineer", location: "Remote", icon: "D", color: "#5865f2", rotation: -6, x: 5, y: 74, delay: 7 },
  { company: "GitHub", role: "Staff Engineer", location: "Remote", icon: "◯", color: "#ececec", rotation: 5, x: 70, y: 72, delay: 4 },
];

function FloatingJobCard({ card }: { card: typeof JOB_CARDS[0] }) {
  return (
    <div
      className="pointer-events-none absolute select-none"
      style={{
        left: `${card.x}%`,
        top: `${card.y}%`,
        rotate: `${card.rotation}deg`,
        animation: `gaj-float-card 6s ease-in-out ${card.delay}s infinite alternate`,
      }}
    >
      <div
        className="flex min-w-[160px] flex-col gap-2 rounded-[12px] border p-3.5"
        style={{
          background: "rgba(20,20,22,0.55)",
          borderColor: "rgba(255,255,255,0.09)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          opacity: 0.45,
        }}
      >
        {/* Company header */}
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-[11px] font-bold"
            style={{ background: "rgba(255,255,255,0.06)", color: card.color }}
          >
            {card.icon}
          </div>
          <span className="text-[13px] font-semibold text-[#c8c8d0]">
            {card.company}
          </span>
        </div>

        {/* Role */}
        <p className="text-[11px] font-medium text-[#6a6a75]">{card.role}</p>

        {/* Location */}
        <div className="flex items-center gap-1 text-[10px] text-[#4a4a55]">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 14 6 14s6-8.75 6-14c0-3.314-2.686-6-6-6z"/>
            <circle cx="12" cy="8" r="2"/>
          </svg>
          {card.location}
        </div>
      </div>
    </div>
  );
}

// ── Terminal header dots ─────────────────────────────────────────────────────
function TerminalHeader() {
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex items-center gap-3 border-b px-5 py-3"
      style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
    >
      {/* Traffic light dots */}
      <div className="flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] opacity-70" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e] opacity-70" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28c840] opacity-70" />
      </div>

      {/* Command */}
      <span className="flex-1 text-center font-mono text-[12px] text-[#7a7a85]">
        <span className="text-[#7c6fff]">$ </span>
        getajob --auth
        <span
          className="ml-0.5 inline-block h-[13px] w-[7px] translate-y-[1px] rounded-[1px] bg-[#7c6fff]"
          style={{ opacity: cursorVisible ? 1 : 0, transition: "opacity 0.1s" }}
        />
      </span>
    </div>
  );
}

// ── Stats ticker ─────────────────────────────────────────────────────────────
function StatsTicker() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-8 border-t px-6 py-3"
      style={{
        background: "rgba(13,13,15,0.80)",
        borderColor: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <TrendingUp size={13} className="text-[#7c6fff] shrink-0" />
      <span className="text-[12px] text-[#4a4a55]">
        <span className="font-semibold tabular-nums text-[#ececec]">3,241</span>
        {" "}jobs applied
      </span>
      <span className="h-[3px] w-[3px] rounded-full bg-[#4a4a55]" />
      <span className="text-[12px] text-[#4a4a55]">
        <span className="font-semibold tabular-nums text-[#ececec]">148</span>
        {" "}companies
      </span>
      <span className="h-[3px] w-[3px] rounded-full bg-[#4a4a55]" />
      <span className="flex items-center gap-1.5 text-[12px] text-[#4a4a55]">
        Keep going
        <span
          className="h-1.5 w-1.5 rounded-full bg-[#34d399]"
          style={{ animation: "gaj-blink-dot 1.5s ease-in-out infinite" }}
        />
      </span>
    </div>
  );
}

// ── Main auth page ───────────────────────────────────────────────────────────
function AuthPage() {
  const [view, setView] = useState<"login" | "register">("login");

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
      style={{ background: "#0a0a0c" }}
    >
      {/* Floating job cards in background */}
      {JOB_CARDS.map((card) => (
        <FloatingJobCard key={card.company} card={card} />
      ))}

      {/* Ambient glow behind modal */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 520,
          height: 520,
          background:
            "radial-gradient(ellipse at center, rgba(124,111,255,0.12) 0%, transparent 65%)",
        }}
      />

      {/* Glass modal */}
      <div
        className="relative z-10 w-full max-w-[420px] mx-4 overflow-hidden rounded-[18px] border"
        style={{
          background: "rgba(15,15,18,0.75)",
          borderColor: "rgba(124,111,255,0.25)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow:
            "0 0 0 1px rgba(124,111,255,0.1), 0 32px 64px rgba(0,0,0,0.6), 0 0 80px rgba(124,111,255,0.06)",
        }}
      >
        <TerminalHeader />

        <div className="px-7 pb-8 pt-7">
          {view === "login" ? (
            <LoginForm onSwitch={() => setView("register")} />
          ) : (
            <RegisterForm onSwitch={() => setView("login")} />
          )}
        </div>
      </div>

      <StatsTicker />

      <style>{`
        @keyframes gaj-float-card {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-14px); }
        }
        @keyframes gaj-blink-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// ── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Login failed.";
      toast.error(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-[#ececec]">
          Welcome back
        </h1>
        <p className="mt-1.5 text-[13px] text-[#7a7a85]">
          Sign in to continue your job hunt.
        </p>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#4a4a55]">
          Email
        </Label>
        <div className="relative">
          <Mail
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4a55]"
          />
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="h-[44px] rounded-[10px] border-white/[0.07] bg-white/[0.04] pl-10 text-[13px] text-[#ececec] placeholder:text-[#4a4a55] transition-all focus-visible:border-[#7c6fff]/50 focus-visible:bg-white/[0.06] focus-visible:ring-0 focus-visible:ring-[#7c6fff]/20"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#4a4a55]">
            Password
          </Label>
          <button
            type="button"
            tabIndex={-1}
            className="text-[11px] text-[#7c6fff] hover:text-[#a78bfa]"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Lock
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4a55]"
          />
          <Input
            type={showPass ? "text" : "password"}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-[44px] rounded-[10px] border-white/[0.07] bg-white/[0.04] pl-10 pr-10 text-[13px] text-[#ececec] placeholder:text-[#4a4a55] transition-all focus-visible:border-[#7c6fff]/50 focus-visible:bg-white/[0.06] focus-visible:ring-0"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a4a55] hover:text-[#7a7a85]"
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={login.isPending}
        className="mt-1 flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] text-[13px] font-semibold text-white"
        style={{
          background: "linear-gradient(135deg, #7c6fff 0%, #9d8fff 100%)",
          boxShadow: "0 4px 16px rgba(124,111,255,0.35), 0 1px 0 rgba(255,255,255,0.12) inset",
        }}
      >
        {login.isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight size={14} />
          </>
        )}
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.07]" />
        <span className="text-[11px] text-[#4a4a55]">OR</span>
        <div className="h-px flex-1 bg-white/[0.07]" />
      </div>

      {/* GitHub */}
      <button
        type="button"
        className="flex h-[44px] w-full items-center justify-center gap-2.5 rounded-[10px] border border-white/[0.09] bg-white/[0.04] text-[13px] font-medium text-[#ececec] transition-colors hover:border-white/[0.15] hover:bg-white/[0.07]"
      >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-[#ececec]">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        Continue with GitHub
      </button>

      {/* Switch */}
      <p className="text-center text-[13px] text-[#7a7a85]">
        New here?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold text-[#7c6fff] hover:text-[#a78bfa]"
        >
          Create an account
        </button>
      </p>
    </form>
  );
}

// ── Register Form ────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const register = useRegister();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await register.mutateAsync({ name, email, password });
      toast.success("Account created! Welcome to GetaJob.");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Registration failed.";
      toast.error(msg);
    }
  }

  const inputCls =
    "h-[44px] rounded-[10px] border-white/[0.07] bg-white/[0.04] text-[13px] text-[#ececec] placeholder:text-[#4a4a55] transition-all focus-visible:border-[#7c6fff]/50 focus-visible:bg-white/[0.06] focus-visible:ring-0";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-[#ececec]">
          Create an account
        </h1>
        <p className="mt-1.5 text-[13px] text-[#7a7a85]">
          Set up your profile once. Apply to dozens automatically.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#4a4a55]">
          Full Name
        </Label>
        <Input
          type="text"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#4a4a55]">
          Email
        </Label>
        <div className="relative">
          <Mail size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4a55]" />
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`${inputCls} pl-10`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#4a4a55]">
          Password
        </Label>
        <div className="relative">
          <Lock size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4a55]" />
          <Input
            type={showPass ? "text" : "password"}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className={`${inputCls} pl-10 pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a4a55] hover:text-[#7a7a85]"
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={register.isPending}
        className="mt-1 flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] text-[13px] font-semibold text-white"
        style={{
          background: "linear-gradient(135deg, #7c6fff 0%, #9d8fff 100%)",
          boxShadow: "0 4px 16px rgba(124,111,255,0.35), 0 1px 0 rgba(255,255,255,0.12) inset",
        }}
      >
        {register.isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Creating account…
          </>
        ) : (
          <>
            Get started
            <ArrowRight size={14} />
          </>
        )}
      </Button>

      <p className="text-center text-[13px] text-[#7a7a85]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold text-[#7c6fff] hover:text-[#a78bfa]"
        >
          Log in
        </button>
      </p>
    </form>
  );
}
