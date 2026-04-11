import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LogIn, Sparkles, ShieldCheck } from "lucide-react";
import {
  GOOGLE_CLIENT_ID,
  fetchCurrentUser,
  loadGoogleIdentity,
  signInWithGoogleCredential,
} from "../lib/auth.jsx";
import { LiquidGlassCard } from "../components/LiquidGlassCard.jsx";

export function Auth() {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signedInUser, setSignedInUser] = useState(null);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        const current = await fetchCurrentUser();
        if (!active) {
          return;
        }

        if (current.authenticated) {
          setSignedInUser(current.user);
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch {
        // Ignore session lookup failures and fall back to the sign-in UI.
      }

      try {
        const google = await loadGoogleIdentity();
        if (!active || !googleButtonRef.current) {
          return;
        }

        google.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async ({ credential }) => {
            try {
              setError("");
              setLoading(true);
              const user = await signInWithGoogleCredential(credential);
              if (user) {
                setSignedInUser(user);
              }
              navigate("/dashboard", { replace: true });
            } catch (signInError) {
              setError(
                signInError.message ||
                  "Google sign-in failed. Please try again.",
              );
            } finally {
              if (active) {
                setLoading(false);
              }
            }
          },
          cancel_on_tap_outside: true,
        });

        google.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 360,
        });
      } catch (authError) {
        if (active) {
          setError(
            authError.message || "Google sign-in is unavailable right now.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      active = false;
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";
      }
    };
  }, [navigate]);

  return (
    <LiquidGlassCard
      draggable={false}
      expandable={false}
      width="100%"
      height="auto"
      className="mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/15"
      blurIntensity="xl"
      borderRadius="32px"
      glowIntensity="xl"
      shadowIntensity="xl"
    >
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="relative overflow-hidden border-b border-white/10 bg-white/8 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(76,183,222,0.22),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(102,215,203,0.18),transparent_35%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
                <Sparkles className="h-3.5 w-3.5" />
                Google OAuth
              </div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">
                Secure access
              </p>
              <h1 className="mt-3 max-w-md text-4xl font-black tracking-tight text-white sm:text-5xl">
                Sign in with Google and keep your internship workflow in sync.
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-white/70">
                Your login is verified by the Flask backend and stored as a
                session, so the dashboard, uploads, and resume matching can use
                the same signed-in user.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "One-click Google sign-in.",
                "Backend session on success.",
                "Works with your dashboard flow.",
                "No password storage required.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/12 bg-black/15 p-4 text-sm leading-6 text-white/70"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/12 bg-black/20 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#08171a]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Session-backed auth
                  </p>
                  <p className="text-sm text-white/60">
                    The backend verifies the Google credential and sets an
                    HttpOnly session cookie.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                Account
              </p>
              <h2 className="mt-2 text-3xl font-black text-white">
                Continue with your Google account
              </h2>
            </div>
            <Link
              to="/"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              Landing
            </Link>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-black/15 p-5">
            <p className="text-sm leading-7 text-white/70">
              {signedInUser
                ? `Signed in as ${signedInUser.name || signedInUser.email}. Redirecting to the dashboard.`
                : "Use the Google button below to create or open your account. The backend will verify the token and create the user session."}
            </p>

            <div className="mt-5 rounded-2xl border border-white/12 bg-black/20 p-4">
              {loading && !error ? (
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-[#66d7cb]" />
                  Loading Google sign-in...
                </div>
              ) : (
                <div
                  ref={googleButtonRef}
                  className="flex min-h-[44px] items-center justify-center"
                />
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/35 bg-red-500/10 p-4 text-sm text-red-100">
                {error}
              </div>
            )}

            {!GOOGLE_CLIENT_ID && (
              <div className="mt-4 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 text-sm text-amber-100">
                Set VITE_GOOGLE_CLIENT_ID in the frontend and GOOGLE_CLIENT_ID
                in the backend before using Google sign-in.
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#66d7cb] to-[#4cb7de] px-5 py-3 text-sm font-bold text-white transition hover:scale-[1.01]"
              >
                Continue to dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-black/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-black/20"
              >
                <LogIn className="h-4 w-4" />
                Skip for now
              </button>
            </div>
          </div>
        </section>
      </div>
    </LiquidGlassCard>
  );
}
