import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Bot,
  Camera,
  LayoutGrid,
  Link,
  Search,
  TrendingUp,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import brandIcon from "../assets/icon.png";

const capabilities = [
  {
    icon: Link,
    title: "Link Summarizer",
    description:
      "Turn long internship descriptions into concise bullet points instantly.",
  },
  {
    icon: Search,
    title: "Text Extraction",
    description:
      "Paste raw text from WhatsApp, emails, or posts and extract structured details.",
  },
  {
    icon: Camera,
    title: "Poster OCR",
    description:
      "Scan campus posters or flyers to pull out contact and deadline info.",
  },
  {
    icon: Bell,
    title: "Deadline Alerts",
    description:
      "Track upcoming deadlines and stay ahead of every important application date.",
  },
  {
    icon: UserRound,
    title: "Resume Match",
    description:
      "Get a fit score based on your uploaded resume and current internship requirements.",
  },
  {
    icon: TrendingUp,
    title: "Skill Gap Analysis",
    description:
      "See which skills to highlight or learn for every role you want to target.",
  },
];

const processSteps = [
  {
    title: "Paste Link",
    description: "Drop any internship URL or job post text.",
    icon: Link,
  },
  {
    title: "AI Extraction",
    description: "AI summarizes requirements and benefits automatically.",
    icon: Bot,
  },
  {
    title: "Resume Match",
    description: "Instant score based on your profile.",
    icon: UserRound,
  },
];

const initialSignInState = {
  email: "",
  password: "",
};

const initialSignUpState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="space-y-3 text-center">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5e5e63]/70">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-black tracking-tight text-[#1b1c20] sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto max-w-2xl text-sm leading-7 text-[#52616e] sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function GlassCard({ className = "", children }) {
  return (
    <div
      className={`glass-panel rounded-[1.5rem] shadow-[0_18px_60px_-30px_rgba(17,24,39,0.45)] ${className}`}
    >
      {children}
    </div>
  );
}

function IconBubble({ icon: Icon }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/50 bg-white/40 text-[#5e5e63] shadow-sm">
      <Icon className="h-6 w-6" />
    </div>
  );
}

function ButtonSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.84 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.84 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.41-5.192l-6.19-5.238C29.146 35.091 26.715 36 24 36c-5.202 0-9.62-3.317-11.283-7.946l-6.52 5.025C9.51 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.066 12.066 0 01-4.083 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export function Landing() {
  const [activeModal, setActiveModal] = useState(null);
  const [signInForm, setSignInForm] = useState(initialSignInState);
  const [signUpForm, setSignUpForm] = useState(initialSignUpState);
  const [signInError, setSignInError] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [signInSuccess, setSignInSuccess] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);

  const closeModal = () => {
    if (signInLoading || signUpLoading) {
      return;
    }

    setActiveModal(null);
    setSignInError("");
    setSignUpError("");
    setSignInSuccess("");
    setSignUpSuccess("");
  };

  const openSignIn = () => {
    setActiveModal("signin");
    setSignInError("");
    setSignInSuccess("");
    setSignUpError("");
    setSignUpSuccess("");
  };

  const openSignUp = () => {
    setActiveModal("signup");
    setSignInError("");
    setSignInSuccess("");
    setSignUpError("");
    setSignUpSuccess("");
  };

  useEffect(() => {
    if (!activeModal) {
      return undefined;
    }

    const initialOverflow = document.body.style.overflow;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = initialOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [activeModal, signInLoading, signUpLoading]);

  const handleSignInSubmit = async (event) => {
    event.preventDefault();
    setSignInError("");
    setSignInSuccess("");

    if (!signInForm.email.trim() || !signInForm.password.trim()) {
      setSignInError("Please enter your email and password.");
      return;
    }

    if (!emailPattern.test(signInForm.email.trim())) {
      setSignInError("Please enter a valid email address.");
      return;
    }

    setSignInLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setSignInSuccess(
        "Signed in. Welcome back to the CET internship community.",
      );
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUpSubmit = async (event) => {
    event.preventDefault();
    setSignUpError("");
    setSignUpSuccess("");

    const fullName = signUpForm.fullName.trim();
    const email = signUpForm.email.trim().toLowerCase();

    if (!fullName) {
      setSignUpError("Please enter your full name.");
      return;
    }

    if (!email || !emailPattern.test(email)) {
      setSignUpError("Please enter a valid email address.");
      return;
    }

    if (signUpForm.password.length < 8) {
      setSignUpError("Password must be at least 8 characters long.");
      return;
    }

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setSignUpError("Passwords do not match.");
      return;
    }

    setSignUpLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      setSignUpSuccess("Account created successfully. You can now sign in.");
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  };

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-[radial-gradient(circle_at_center,rgba(250,250,252,0.3)_0%,rgba(160,168,182,0.66)_100%),linear-gradient(135deg,#f6f7f9_0%,#d7dbe2_50%,#9ca4b1_100%)] text-[#1b1c20]">
      <header className="flex w-full justify-center px-4 pt-6 sm:px-4">
        <div className="glass-panel w-full max-w-[1152px] rounded-[2rem] px-4 py-4 shadow-[0_12px_50px_-26px_rgba(0,0,0,0.35)] backdrop-blur-[24px] sm:rounded-full sm:px-6 sm:py-3 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/60 bg-white/70 shadow-sm">
                <img
                  src={brandIcon}
                  alt="InternBuddy CET"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <h1 className="text-sm font-extrabold tracking-tight text-[#253440] sm:text-lg">
                  InternBuddy CET
                </h1>
                <span className="mt-1 inline-flex w-fit rounded-full bg-[#ddeaf7] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#4b525e] sm:mt-0">
                  Internship Cell
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:gap-6">
              <nav className="hidden items-center gap-8 md:flex">
                <a
                  className="text-sm font-medium text-[#253440] transition-opacity hover:opacity-70"
                  href="#process"
                >
                  How it works
                </a>
                <a
                  className="text-sm font-medium text-[#253440] transition-opacity hover:opacity-70"
                  href="#features"
                >
                  Features
                </a>
                <a
                  className="text-sm font-medium text-[#253440] transition-opacity hover:opacity-70"
                  href="#cta"
                >
                  Community
                </a>
              </nav>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:w-auto md:gap-2">
                <button
                  type="button"
                  onClick={openSignIn}
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-transparent px-5 py-2.5 text-sm font-bold text-[#111827] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:bg-white/15 sm:px-6"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={openSignUp}
                  className="liquid-gradient-btn inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-px sm:px-6"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1152px] flex-col gap-20 px-4 py-10 pb-16 sm:px-6 sm:py-12 lg:gap-24 lg:px-6">
        <section className="glass-panel relative overflow-hidden rounded-[1.5rem] p-6 text-center shadow-[0_20px_90px_-40px_rgba(17,24,39,0.45)] backdrop-blur-[24px] sm:p-8 lg:p-12">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <h2 className="text-4xl font-black leading-[1.08] tracking-[-0.03em] text-[#1b1c20] sm:text-5xl lg:text-6xl">
              Find internships smarter. Apply with confidence.
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-7 text-[#52616e] sm:text-lg">
              InternBuddy CET is a free community tool built for CET students.
              It summarizes internship listings, checks deadlines, and helps you
              match opportunities with your resume in one place.
            </p>

            <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={openSignUp}
                className="liquid-gradient-btn inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold text-white transition hover:-translate-y-0.5 hover:brightness-110 sm:px-8"
              >
                Sign Up - It&apos;s Free
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={openSignIn}
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-transparent px-6 py-4 text-base font-bold text-[#1b1c20] transition-colors hover:bg-white/20 sm:px-8"
              >
                Sign In
              </button>
            </div>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-[1.25rem] border border-white/40 bg-white/20 shadow-2xl sm:mt-12">
            <div className="hidden lg:block">
              <div className="flex items-center justify-between border-b border-white/20 bg-[#ddeaf7]/50 px-4 py-3">
                <div className="flex gap-2">
                  <div className="size-3 rounded-full bg-[#9f403d]/50" />
                  <div className="size-3 rounded-full bg-[#4c5360]/50" />
                  <div className="size-3 rounded-full bg-[#525257]/50" />
                </div>
                <div className="flex gap-3">
                  <div className="rounded-md bg-white/30 px-4 py-1 text-xs font-bold text-[#253440]">
                    Summarizer
                  </div>
                  <div className="rounded-md px-4 py-1 text-xs font-medium text-[#52616e]">
                    Resume Match
                  </div>
                </div>
                <div className="size-4 opacity-0" />
              </div>

              <div className="relative grid min-h-[400px] gap-6 bg-white/10 p-8 text-left lg:grid-cols-[1fr_16rem]">
                <GlassCard className="p-6">
                  <div className="mb-4 h-4 w-24 rounded-full bg-[#253440]/10" />
                  <div className="space-y-3">
                    <div className="h-3 w-full rounded-full bg-[#253440]/5" />
                    <div className="h-3 w-5/6 rounded-full bg-[#253440]/5" />
                    <div className="h-3 w-4/6 rounded-full bg-[#253440]/5" />
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="h-20 rounded-md bg-white/20" />
                    <div className="h-20 rounded-md bg-white/20" />
                  </div>
                </GlassCard>

                <GlassCard className="flex flex-col gap-4 p-4">
                  <div className="h-8 w-full rounded-full bg-[#5e5e63]/20" />
                  <div className="flex flex-1 items-center justify-center">
                    <div className="flex size-32 items-center justify-center rounded-full border-4 border-dashed border-white/35">
                      <UploadCloud className="h-10 w-10 text-white/40" />
                    </div>
                  </div>
                </GlassCard>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
              </div>
            </div>

            <div className="lg:hidden">
              <div className="flex h-20 items-center justify-between bg-slate-200/40 px-4 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-slate-800" />
                  <span className="text-lg font-bold tracking-tight text-slate-800">
                    InternBuddy CET
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openSignUp}
                  className="rounded-full bg-[#101115] px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
                >
                  Sign Up
                </button>
              </div>

              <div className="space-y-10 px-4 pb-6 pt-8 sm:px-6">
                <div className="space-y-4 text-center">
                  <h3 className="text-3xl font-black leading-tight tracking-tight text-[#1b1c20] sm:text-4xl">
                    Find internships smarter. Apply with confidence.
                  </h3>
                  <p className="mx-auto max-w-2xl text-base font-medium leading-7 text-[#52616e] sm:text-lg">
                    A CET-first internship community workspace for discovery,
                    tracking, and resume matching.
                  </p>
                </div>

                <div className="flex flex-col gap-4 px-4 sm:flex-row sm:px-8">
                  <button
                    type="button"
                    onClick={openSignUp}
                    className="liquid-gradient-btn inline-flex items-center justify-center gap-2 rounded-lg px-6 py-4 text-lg font-bold text-white shadow-xl transition hover:brightness-110"
                  >
                    Sign Up - It&apos;s Free
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={openSignIn}
                    className="rounded-lg border border-white/30 bg-white/15 px-6 py-4 text-lg font-bold text-[#1b1c20] transition-colors hover:bg-white/25"
                  >
                    Sign In
                  </button>
                </div>

                <GlassCard className="relative overflow-hidden p-2 shadow-2xl">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-white/20 bg-white/40 shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/55 via-transparent to-[#ddeaf7]/40" />
                    <div className="absolute inset-0 flex items-center justify-center p-5">
                      <div className="glass-panel max-w-[82%] rounded-[1.25rem] p-5 text-left">
                        <div className="flex items-center gap-3">
                          <div className="flex size-11 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white/70 text-white">
                            <img
                              src={brandIcon}
                              alt="InternBuddy CET"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#5e5e63]/70">
                              Live Preview
                            </div>
                            <div className="text-sm font-bold text-[#1b1c20]">
                              Internship summary card
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="h-3 w-full rounded-full bg-slate-300/50" />
                          <div className="h-3 w-5/6 rounded-full bg-slate-300/50" />
                          <div className="h-3 w-4/6 rounded-full bg-slate-300/50" />
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </section>

        <section id="process" className="space-y-8 sm:space-y-12">
          <SectionTitle
            eyebrow="The Process"
            title="Three steps to your dream role"
          />

          <GlassCard className="relative overflow-hidden p-6 sm:p-8">
            <div className="grid gap-8 md:grid-cols-3">
              {processSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/50 bg-white/45 shadow-lg">
                      <Icon className="h-6 w-6 text-[#253440]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1b1c20]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#52616e]">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </section>

        <section id="features" className="space-y-8 sm:space-y-12">
          <SectionTitle
            eyebrow="Features"
            title="Powerful Toolkit"
            description="Precision tools built for the CET internship community."
          />

          <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <GlassCard
                  key={item.title}
                  className="group p-6 transition-transform hover:-translate-y-1 sm:p-8"
                >
                  <div className="space-y-4">
                    <IconBubble icon={Icon} />
                    <div>
                      <h3 className="text-xl font-bold text-[#1b1c20]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[#52616e]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        <section
          id="cta"
          className="glass-panel relative overflow-hidden rounded-[1.5rem] border border-white/40 p-6 shadow-[0_20px_90px_-40px_rgba(17,24,39,0.45)] backdrop-blur-[24px] sm:p-8 lg:p-10"
        >
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#5e5e63]/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-[#ddeaf7]/50 blur-3xl" />
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <h2 className="max-w-2xl text-3xl font-black leading-tight text-[#1b1c20] sm:text-4xl">
              A free community workspace for CET internship journeys
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-[#52616e] sm:text-base">
              Built to help CET students discover opportunities, stay on top of
              deadlines, and apply together with confidence.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={openSignUp}
                className="liquid-gradient-btn w-full rounded-lg px-6 py-4 text-lg font-bold text-white shadow-xl transition hover:brightness-110 sm:w-auto sm:px-10"
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={openSignIn}
                className="w-full rounded-lg border border-white/30 bg-transparent px-6 py-4 text-lg font-bold text-[#1b1c20] transition hover:bg-white/20 sm:w-auto sm:px-10"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full bg-[#cfd8e6]/70 py-12 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
          <div className="space-y-2 text-center md:text-left">
            <div className="text-lg font-black text-[#111827]">
              InternBuddy CET
            </div>
            <p className="max-w-xs text-xs font-semibold uppercase tracking-[0.2em] text-[#52616e]">
              Built for Internship Cell CET by Aswin M Kumar
            </p>
          </div>
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
            <a
              className="text-sm uppercase tracking-[0.2em] text-[#52616e] transition-colors hover:text-[#1b1c20]"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="text-sm uppercase tracking-[0.2em] text-[#52616e] transition-colors hover:text-[#1b1c20]"
              href="#"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </footer>

      {activeModal ? (
        <div
          className="auth-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onClick={handleBackdropClick}
        >
          <div className="auth-sheet relative max-h-[92svh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/30 bg-white/20 p-6 shadow-[0_25px_80px_-45px_rgba(2,6,23,0.85)] backdrop-blur-xl sm:rounded-3xl sm:p-8">
            <button
              type="button"
              onClick={closeModal}
              disabled={signInLoading || signUpLoading}
              aria-label="Close modal"
              className="absolute right-4 top-4 rounded-full p-2 text-[#111827]/70 transition hover:bg-white/30 hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            {activeModal === "signin" ? (
              <div>
                <div className="mb-6 flex items-center gap-3 pr-10">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-sm">
                    <img
                      src={brandIcon}
                      alt="InternBuddy CET"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5e5e63]/75">
                      InternBuddy CET
                    </p>
                    <h3 className="text-2xl font-black text-[#111827]">
                      Welcome back
                    </h3>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleSignInSubmit}>
                  <div>
                    <label
                      htmlFor="signin-email"
                      className="text-sm font-semibold text-[#1f2937]"
                    >
                      Email
                    </label>
                    <input
                      id="signin-email"
                      type="email"
                      value={signInForm.email}
                      onChange={(event) =>
                        setSignInForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-[#111827] placeholder:text-[#1f2937]/60 focus:border-[#111827]/35 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signin-password"
                      className="text-sm font-semibold text-[#1f2937]"
                    >
                      Password
                    </label>
                    <input
                      id="signin-password"
                      type="password"
                      value={signInForm.password}
                      onChange={(event) =>
                        setSignInForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-[#111827] placeholder:text-[#1f2937]/60 focus:border-[#111827]/35 focus:outline-none"
                    />
                  </div>

                  {signInError ? (
                    <div className="rounded-xl border border-rose-400 bg-rose-100 px-4 py-3 text-sm font-medium text-rose-800">
                      {signInError}
                    </div>
                  ) : null}

                  {signInSuccess ? (
                    <div className="rounded-xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-800">
                      {signInSuccess}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={signInLoading}
                    className="liquid-gradient-btn inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    {signInLoading ? (
                      <>
                        <ButtonSpinner />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={openSignUp}
                  className="mt-4 w-full text-sm text-[#1f2937]"
                >
                  Don&apos;t have an account?{" "}
                  <span className="font-bold underline decoration-[#111827]/50 underline-offset-4">
                    Sign Up
                  </span>
                </button>

                <div className="my-4 h-px bg-white/35" />

                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/25 px-4 py-3 text-sm font-semibold text-[#111827] transition hover:bg-white/35"
                >
                  <GoogleMark />
                  Continue with Google
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6 flex items-center gap-3 pr-10">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-sm">
                    <img
                      src={brandIcon}
                      alt="InternBuddy CET"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5e5e63]/75">
                      InternBuddy CET
                    </p>
                    <h3 className="text-2xl font-black text-[#111827]">
                      Join InternBuddy CET
                    </h3>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleSignUpSubmit}>
                  <div>
                    <label
                      htmlFor="signup-name"
                      className="text-sm font-semibold text-[#1f2937]"
                    >
                      Full Name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      value={signUpForm.fullName}
                      onChange={(event) =>
                        setSignUpForm((current) => ({
                          ...current,
                          fullName: event.target.value,
                        }))
                      }
                      placeholder="Your full name"
                      autoComplete="name"
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-[#111827] placeholder:text-[#1f2937]/60 focus:border-[#111827]/35 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-email"
                      className="text-sm font-semibold text-[#1f2937]"
                    >
                      Email
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      value={signUpForm.email}
                      onChange={(event) =>
                        setSignUpForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-[#111827] placeholder:text-[#1f2937]/60 focus:border-[#111827]/35 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-password"
                      className="text-sm font-semibold text-[#1f2937]"
                    >
                      Password
                    </label>
                    <input
                      id="signup-password"
                      type="password"
                      value={signUpForm.password}
                      onChange={(event) =>
                        setSignUpForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-[#111827] placeholder:text-[#1f2937]/60 focus:border-[#111827]/35 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-confirm-password"
                      className="text-sm font-semibold text-[#1f2937]"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="signup-confirm-password"
                      type="password"
                      value={signUpForm.confirmPassword}
                      onChange={(event) =>
                        setSignUpForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-[#111827] placeholder:text-[#1f2937]/60 focus:border-[#111827]/35 focus:outline-none"
                    />
                  </div>

                  {signUpError ? (
                    <div className="rounded-xl border border-rose-400 bg-rose-100 px-4 py-3 text-sm font-medium text-rose-800">
                      {signUpError}
                    </div>
                  ) : null}

                  {signUpSuccess ? (
                    <div className="rounded-xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-800">
                      {signUpSuccess}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={signUpLoading}
                    className="liquid-gradient-btn inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    {signUpLoading ? (
                      <>
                        <ButtonSpinner />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={openSignIn}
                  className="mt-4 w-full text-sm text-[#1f2937]"
                >
                  Already have an account?{" "}
                  <span className="font-bold underline decoration-[#111827]/50 underline-offset-4">
                    Sign In
                  </span>
                </button>

                <div className="my-4 h-px bg-white/35" />

                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/25 px-4 py-3 text-sm font-semibold text-[#111827] transition hover:bg-white/35"
                >
                  <GoogleMark />
                  Continue with Google
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
