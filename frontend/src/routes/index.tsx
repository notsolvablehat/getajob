import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { RefreshCw, Play, Zap, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LandingPage,
});

function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "#0d0d0f",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Simple top nav */}
      <nav
        className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.07] px-8"
        style={{
          background: "rgba(13,13,15,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-[7px] w-[7px] rounded-full bg-[#7c6fff]"
            style={{ boxShadow: "0 0 8px rgba(124,111,255,0.4)" }}
          />
          <span className="text-[15px] font-semibold tracking-tight text-[#ececec]">
            GetaJob
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-white/[0.11] bg-[#212126] text-[12px] text-[#7a7a85] hover:bg-[#1a1a1d] hover:text-[#ececec]"
            >
              Log in
            </Button>
          </Link>
          <Link to="/auth">
            <Button
              size="sm"
              className="rounded-full bg-[#7c6fff] text-[12px] text-white hover:bg-[#8c7fff]"
              style={{ boxShadow: "0 2px 12px rgba(124,111,255,0.25)" }}
            >
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center px-6 pb-24 pt-24 text-center">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: 600,
            height: 400,
            background:
              "radial-gradient(ellipse at top, rgba(124,111,255,0.12) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10 mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(124,111,255,0.2)] bg-[rgba(124,111,255,0.08)] px-3 py-1">
          <Zap size={11} className="text-[#7c6fff]" />
          <span className="text-[11px] font-medium text-[#7c6fff]">
            Greenhouse-powered job automation
          </span>
        </div>

        <h1 className="relative z-10 mb-5 max-w-[640px] text-[44px] font-semibold leading-[1.15] tracking-[-1px] text-[#ececec]">
          Apply to dozens of jobs
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #7c6fff, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            while you sleep.
          </span>
        </h1>

        <p className="relative z-10 mb-10 max-w-[460px] text-[16px] leading-relaxed text-[#7a7a85]">
          GetaJob scrapes open roles from Greenhouse career pages, auto-fills
          every application form, and captures a screenshot as proof — all in
          the background.
        </p>

        <div className="relative z-10 flex items-center gap-3">
          <Link to="/auth">
            <Button
              className="gap-2 rounded-full bg-[#7c6fff] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#8c7fff]"
              style={{ boxShadow: "0 4px 24px rgba(124,111,255,0.35)" }}
            >
              <Play size={14} />
              Get Started — it's free
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[820px] px-6 pb-24">
        <h2 className="mb-10 text-center text-[13px] font-medium uppercase tracking-[0.1em] text-[#4a4a55]">
          How it works
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              step: "01",
              icon: RefreshCw,
              title: "Scrape Jobs",
              desc: "Enter a Greenhouse company slug and we'll fetch all open roles via their public API.",
            },
            {
              step: "02",
              icon: Play,
              title: "Auto-Apply",
              desc: "Our Playwright automation fills every application form using your saved profile and resume.",
            },
            {
              step: "03",
              icon: Eye,
              title: "Screenshot Proof",
              desc: "A screenshot is captured at the confirmation step — proof of completion, nothing submitted without your review.",
            },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div
              key={step}
              className="flex flex-col gap-4 rounded-[14px] border border-white/[0.07] p-5"
              style={{ background: "#141416" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(124,111,255,0.1)" }}
                >
                  <Icon size={16} className="text-[#7c6fff]" />
                </div>
                <span className="text-[11px] font-semibold tracking-[0.06em] text-[#4a4a55]">
                  {step}
                </span>
              </div>
              <div>
                <h3 className="mb-1.5 text-[14px] font-semibold text-[#ececec]">
                  {title}
                </h3>
                <p className="text-[13px] leading-relaxed text-[#7a7a85]">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-[820px] px-6 pb-24">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              icon: Shield,
              title: "No fake submissions",
              desc: "Screenshots are captured before any final submit click. You stay in full control.",
            },
            {
              icon: Zap,
              title: "Blazing fast scraping",
              desc: "Pulls 10–15 open roles in seconds via the Greenhouse public JSON API.",
            },
            {
              icon: RefreshCw,
              title: "Apply to all in one click",
              desc: "Queue up every scraped job and let the automation run sequentially in the background.",
            },
            {
              icon: Eye,
              title: "Full visibility",
              desc: "Track status per job: Not Started, Processing, Screenshot Captured, or Failed with reason.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-4 rounded-[14px] border border-white/[0.07] p-5"
              style={{ background: "#141416" }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "rgba(124,111,255,0.1)" }}
              >
                <Icon size={15} className="text-[#7c6fff]" />
              </div>
              <div>
                <h3 className="mb-1 text-[13px] font-semibold text-[#ececec]">
                  {title}
                </h3>
                <p className="text-[12px] leading-relaxed text-[#7a7a85]">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 text-center">
        <div
          className="relative mx-auto max-w-[500px] overflow-hidden rounded-[20px] border border-white/[0.07] px-8 py-14"
          style={{ background: "#141416" }}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
            style={{
              width: 320,
              height: 200,
              background:
                "radial-gradient(ellipse at top, rgba(124,111,255,0.1) 0%, transparent 70%)",
            }}
          />
          <h2 className="relative z-10 mb-3 text-[24px] font-semibold tracking-tight text-[#ececec]">
            Ready to automate your job search?
          </h2>
          <p className="relative z-10 mb-7 text-[13px] text-[#7a7a85]">
            Set up your profile, upload your resume, and start scraping.
          </p>
          <Link to="/auth">
            <Button
              className="relative z-10 gap-2 rounded-full bg-[#7c6fff] px-6 text-white hover:bg-[#8c7fff]"
              style={{ boxShadow: "0 4px 20px rgba(124,111,255,0.3)" }}
            >
              <Play size={14} />
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] py-6 text-center text-[12px] text-[#4a4a55]">
        © {new Date().getFullYear()} GetaJob · Built with Greenhouse API +
        Playwright
      </footer>
    </div>
  );
}
