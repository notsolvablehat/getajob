import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Zap, Shield, Play } from "lucide-react";
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

function AuthPage() {
  const [view, setView] = useState<"login" | "register">("login");

  return (
    <div className="flex min-h-screen" style={{ background: "#0d0d0f" }}>
      {/* Left side — visual area */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/[0.07] p-10 lg:flex" style={{ background: "#141416" }}>
        
        {/* Glow effect */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "80%",
            height: "80%",
            background: "radial-gradient(ellipse at center, rgba(124,111,255,0.08) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div
              className="h-[7px] w-[7px] rounded-full bg-[#7c6fff]"
              style={{ boxShadow: "0 0 8px rgba(124,111,255,0.4)" }}
            />
            <span className="text-[17px] font-semibold tracking-tight text-[#ececec]">
              GetaJob
            </span>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-6 max-w-md">
          <h1 className="text-4xl font-semibold tracking-tight text-[#ececec] leading-tight">
            Automate your job search.
          </h1>
          <p className="text-[#7a7a85] text-[15px] leading-relaxed">
            Stop filling out the same forms over and over. Scrape jobs from Greenhouse, setup your profile once, and apply to dozens of jobs while you sleep.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(124,111,255,0.1)]">
                <Zap size={14} className="text-[#7c6fff]" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-semibold text-[#ececec]">Lightning fast</span>
                <span className="text-[12px] text-[#4a4a55]">Scrape jobs instantly</span>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(124,111,255,0.1)]">
                <Shield size={14} className="text-[#7c6fff]" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-semibold text-[#ececec]">Safe & Secure</span>
                <span className="text-[12px] text-[#4a4a55]">Review before submit</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[12px] text-[#4a4a55]">
          © {new Date().getFullYear()} GetaJob
        </div>
      </div>

      {/* Right side — form area */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24 relative overflow-hidden">
        
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
          <div
            className="h-[7px] w-[7px] rounded-full bg-[#7c6fff]"
            style={{ boxShadow: "0 0 8px rgba(124,111,255,0.4)" }}
          />
          <span className="text-[17px] font-semibold tracking-tight text-[#ececec]">
            GetaJob
          </span>
        </div>

        {/* Mobile Background glow */}
        <div
          className="pointer-events-none fixed left-1/2 top-0 -translate-x-1/2 lg:hidden"
          style={{
            width: 500,
            height: 350,
            background: "radial-gradient(ellipse at top, rgba(124,111,255,0.10) 0%, transparent 70%)",
          }}
        />

        <div className="mx-auto w-full max-w-[360px] relative z-10">
          <div className="mb-8">
            <h2 className="text-[24px] font-semibold tracking-tight text-[#ececec]">
              {view === "login" ? "Welcome back" : "Create an account"}
            </h2>
            <p className="mt-2 text-[13px] text-[#7a7a85]">
              {view === "login"
                ? "Log in to your account to continue your automated job search."
                : "Enter your details below to create your account and get started."}
            </p>
          </div>

          <div className="w-full">
            {view === "login" ? <LoginForm /> : <RegisterForm />}
          </div>

          <div className="mt-8 text-center text-[13px] text-[#7a7a85]">
            {view === "login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  onClick={() => setView("register")}
                  className="font-medium text-[#7c6fff] hover:text-[#8c7fff] hover:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  onClick={() => setView("login")}
                  className="font-medium text-[#7c6fff] hover:text-[#8c7fff] hover:underline"
                >
                  Log in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Login Form ───────────────────────────────────────────────────────────────
function LoginForm() {
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-[12px] font-medium text-[#7a7a85]">Email</Label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          className="border-white/[0.07] bg-[#1a1a1d] h-[40px] text-[13px] text-[#ececec] placeholder:text-[#4a4a55] focus-visible:border-[#7c6fff]/40 focus-visible:ring-0 rounded-[8px]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[12px] font-medium text-[#7a7a85]">Password</Label>
        <div className="relative">
          <Input
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-white/[0.07] bg-[#1a1a1d] h-[40px] text-[13px] pr-10 text-[#ececec] placeholder:text-[#4a4a55] focus-visible:border-[#7c6fff]/40 focus-visible:ring-0 rounded-[8px]"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a55] hover:text-[#7a7a85]"
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={login.isPending}
        className="mt-2 w-full h-[40px] gap-2 rounded-full bg-[#7c6fff] text-[13px] font-medium text-white hover:bg-[#8c7fff]"
        style={{ boxShadow: "0 4px 14px rgba(124,111,255,0.3)" }}
      >
        {login.isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Logging in…
          </>
        ) : (
          "Log in to dashboard"
        )}
      </Button>
    </form>
  );
}

// ── Register Form ────────────────────────────────────────────────────────────
function RegisterForm() {
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-[12px] font-medium text-[#7a7a85]">Full Name</Label>
        <Input
          type="text"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="border-white/[0.07] bg-[#1a1a1d] h-[40px] text-[13px] text-[#ececec] placeholder:text-[#4a4a55] focus-visible:border-[#7c6fff]/40 focus-visible:ring-0 rounded-[8px]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[12px] font-medium text-[#7a7a85]">Email</Label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border-white/[0.07] bg-[#1a1a1d] h-[40px] text-[13px] text-[#ececec] placeholder:text-[#4a4a55] focus-visible:border-[#7c6fff]/40 focus-visible:ring-0 rounded-[8px]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[12px] font-medium text-[#7a7a85]">Password</Label>
        <div className="relative">
          <Input
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="border-white/[0.07] bg-[#1a1a1d] h-[40px] text-[13px] pr-10 text-[#ececec] placeholder:text-[#4a4a55] focus-visible:border-[#7c6fff]/40 focus-visible:ring-0 rounded-[8px]"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a55] hover:text-[#7a7a85]"
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={register.isPending}
        className="mt-2 w-full h-[40px] gap-2 rounded-full bg-[#7c6fff] text-[13px] font-medium text-white hover:bg-[#8c7fff]"
        style={{ boxShadow: "0 4px 14px rgba(124,111,255,0.3)" }}
      >
        {register.isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
