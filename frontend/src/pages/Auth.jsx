import { useState } from "react";
import { LockKeyhole, Mail, Sparkles } from "lucide-react";
import brandIcon from "../assets/icon.png";
import { signIn } from "../lib/auth";

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
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

function Spinner() {
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

export function Auth() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      await signIn({ email: form.email.trim(), password: form.password });
      window.location.hash = "";
    } catch (err) {
      setError(err.message || "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="liquid-bg flex min-h-[100svh] flex-col items-center justify-center overflow-hidden p-6">
      <header className="sticky top-0 z-50 flex w-full items-center justify-between px-6 py-4 text-slate-700 backdrop-blur-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#101115]" />
          <h1 className="text-xl font-bold tracking-tighter text-[#101115]">
            InternBuddy CET
          </h1>
        </div>
        <div className="hidden items-center gap-6 md:flex">
          <span className="cursor-pointer text-sm font-semibold tracking-tight text-slate-500 transition-opacity hover:opacity-80">
            Explore
          </span>
          <span className="cursor-pointer text-sm font-semibold tracking-tight text-slate-500 transition-opacity hover:opacity-80">
            Applications
          </span>
          <span className="cursor-pointer text-sm font-semibold tracking-tight text-[#101115] transition-opacity hover:opacity-80">
            Login
          </span>
        </div>
      </header>

      <main className="mt-4 mb-8 flex w-full max-w-md flex-grow items-center justify-center">
        <div className="glass-panel flex w-full flex-col gap-8 rounded-[2rem] p-8 shadow-2xl">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-[#253440]">
              Welcome, Engineer
            </h2>
            <p className="text-sm font-medium text-[#52616e]">
              Start your professional journey with CET.
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.05em] text-[#6d7c8a]">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6d7c8a]/80" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-black/10 bg-white/80 py-4 pr-4 pl-9 text-sm text-[#253440] placeholder:text-[#6d7c8a]/70 outline-none transition-all focus:border-[#6d7c8a]/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.05em] text-[#6d7c8a]">
                Security Key
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6d7c8a]/80" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-black/10 bg-white/80 py-4 pr-4 pl-9 text-sm text-[#253440] placeholder:text-[#6d7c8a]/70 outline-none transition-all focus:border-[#6d7c8a]/40"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <a
                className="text-xs font-semibold text-[#585f6c] transition-colors hover:text-[#253440]"
                href="#"
              >
                Forgot password?
              </a>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-400 bg-rose-100 px-4 py-3 text-sm font-medium text-rose-800">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="liquid-gradient-btn inline-flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-[#a4b4c3]/30" />
            <span className="mx-4 flex-shrink text-[10px] font-bold uppercase tracking-[0.1em] text-[#6d7c8a]/70">
              OR
            </span>
            <div className="flex-grow border-t border-[#a4b4c3]/30" />
          </div>

          <button
            type="button"
            className="glass-panel flex w-full items-center justify-center gap-3 rounded-xl border-white/20 bg-white/10 py-4 transition-colors hover:bg-white/30"
          >
            <GoogleMark />
            <span className="text-sm font-semibold text-[#253440]">
              Sign in with Google
            </span>
          </button>

          <div className="pt-2 text-center">
            <p className="text-sm text-[#52616e]">
              Don&apos;t have an account?{" "}
              <a
                className="font-bold text-[#253440] decoration-2 underline-offset-4 hover:underline"
                href="#signup"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="z-10 flex w-full flex-col items-center justify-center gap-6 bg-transparent py-8 text-xs uppercase tracking-[0.05em] text-slate-600 md:flex-row">
        <div className="flex items-center gap-6">
          <a className="transition-colors hover:text-slate-900" href="#">
            Privacy Policy
          </a>
          <a className="transition-colors hover:text-slate-900" href="#">
            Terms of Service
          </a>
          <a className="transition-colors hover:text-slate-900" href="#">
            Support
          </a>
        </div>
        <p className="opacity-70">
          © 2024 InternBuddy CET. Crafted for Excellence.
        </p>
      </footer>

      <div className="pointer-events-none fixed -top-[10%] -left-[10%] -z-10 h-[50vw] w-[50vw] rounded-full bg-[#ddeaf7] opacity-60 blur-[120px]" />
      <div className="pointer-events-none fixed -right-[10%] -bottom-[10%] -z-10 h-[40vw] w-[40vw] rounded-full bg-[#d8e0ee] opacity-50 blur-[100px]" />

      <img src={brandIcon} alt="" className="hidden" aria-hidden="true" />
    </div>
  );
}
