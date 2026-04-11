import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { LiquidGlassCard } from "../components/LiquidGlassCard.jsx";
import heroImage from "../assets/hero.png";

const highlights = [
  {
    icon: BriefcaseBusiness,
    title: "Any internship link",
    text: "Process public internship pages from career portals, company sites, and form-based listings.",
  },
  {
    icon: FileSearch,
    title: "Resume matching",
    text: "Compare a PDF resume against the role and surface a practical match score with gaps.",
  },
  {
    icon: ShieldCheck,
    title: "Safer extraction",
    text: "Public URLs are checked before fetches, and uploads stay within the expected file limits.",
  },
];

const steps = [
  "Paste a public internship link, details, or poster.",
  "The backend extracts structured fields and a verified summary.",
  "Upload a resume to see the strongest fit, missing skills, and recommendations.",
];

export function Landing() {
  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div className="rounded-[2rem] border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-xl sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-black/20 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.8)]">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">
                Internship Cell CET
              </p>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                InternBuddy
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#061317] transition hover:scale-[1.02]"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <section className="grid flex-1 gap-6 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-8">
        <LiquidGlassCard
          draggable={false}
          expandable={false}
          width="100%"
          height="100%"
          className="overflow-hidden rounded-[2rem] border border-white/15"
          blurIntensity="xl"
          borderRadius="32px"
          glowIntensity="xl"
          shadowIntensity="xl"
        >
          <div className="grid h-full gap-8 p-6 sm:p-8 xl:grid-cols-[1.1fr_0.9fr] xl:p-10">
            <div className="flex flex-col justify-between gap-8">
              <div className="max-w-2xl space-y-5">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Verified internship assistant
                </span>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                    Find, summarize, and match internships faster.
                  </h2>
                  <p className="max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                    InternBuddy turns public internship links, pasted details,
                    and posters into clean summaries, while also matching
                    resumes against the role.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#66d7cb] to-[#4cb7de] px-5 py-3 text-sm font-bold text-white transition hover:scale-[1.02]"
                  >
                    Start analyzing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                  >
                    Create account
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/15 bg-black/15 p-4 backdrop-blur-md"
                    >
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/65">
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-x-8 top-8 h-56 rounded-full bg-[#4cb7de]/20 blur-3xl" />
              <div className="absolute bottom-10 left-8 h-44 w-44 rounded-full bg-[#66d7cb]/15 blur-3xl" />
              <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/15 bg-white/8 p-4 shadow-[0_30px_80px_-36px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                <img
                  src={heroImage}
                  alt="InternBuddy preview illustration"
                  className="h-[420px] w-full rounded-[1.5rem] object-cover object-center"
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/15 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Flow
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Link, resume, result
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Coverage
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Links, text, and posters
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </LiquidGlassCard>

        <div className="grid gap-6">
          <LiquidGlassCard
            draggable={false}
            expandable={false}
            width="100%"
            height="100%"
            className="overflow-hidden rounded-[2rem] border border-white/15"
            blurIntensity="lg"
            borderRadius="32px"
            glowIntensity="lg"
            shadowIntensity="lg"
          >
            <div className="p-6 sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                How it works
              </p>
              <h3 className="mt-2 text-2xl font-black text-white">
                Three steps to a clearer application.
              </h3>
              <div className="mt-6 space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-4 rounded-2xl border border-white/12 bg-white/8 p-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[#08171a]">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-white/72">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </LiquidGlassCard>

          <LiquidGlassCard
            draggable={false}
            expandable={false}
            width="100%"
            height="100%"
            className="overflow-hidden rounded-[2rem] border border-white/15"
            blurIntensity="lg"
            borderRadius="32px"
            glowIntensity="lg"
            shadowIntensity="lg"
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                    Ready to use
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    Built for public internship listings.
                  </h3>
                </div>
                <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                  No setup required
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Open the dashboard to paste a link, upload a poster, or compare
                a resume. The UI now starts with a landing experience and an
                auth entry point, but the matching flow stays intact.
              </p>
            </div>
          </LiquidGlassCard>
        </div>
      </section>
    </main>
  );
}
