import { useMemo, useState } from "react";
import { API_BASE } from "../lib/auth.jsx";

const INPUT_MODES = [
  {
    id: "url",
    label: "Internship link",
    helper: "Paste a LinkedIn or company careers URL",
  },
  {
    id: "text",
    label: "Pasted details",
    helper: "Paste full internship details from a poster, email, or message",
  },
];

function DetailPill({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#061920]/90 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#dbfdf7]">
        {value || "Not specified"}
      </p>
    </div>
  );
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function Dashboard() {
  const [inputType, setInputType] = useState("url");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);

  const submitLabel = useMemo(() => {
    return inputType === "url"
      ? "Summarize internship link"
      : "Summarize pasted details";
  }, [inputType]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError(
        inputType === "url"
          ? "Paste a valid internship URL"
          : "Paste internship details before submitting",
      );
      return;
    }

    if (inputType === "url" && !isValidHttpUrl(trimmed)) {
      setError("Paste a full URL starting with http:// or https://");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/internships/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_type: inputType,
          input: trimmed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to summarize internship details");
      }

      setSummary(data.summary || null);
      setSubmissionId(data.internship_id || null);
    } catch (submitError) {
      setSummary(null);
      setSubmissionId(null);
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-50 mx-auto flex w-full max-w-5xl flex-col px-5 pb-8 pt-6 text-slate-100 sm:px-10">
      <header className="mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#9be8df]/70">
          Internship Cell CET
        </p>
        <h1 className="bg-gradient-to-r from-[#e2fffb] via-[#b9fdff] to-[#f8ffff] bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
          InternBuddy Summarizer
        </h1>
        <p className="mt-2 text-sm text-white/65">
          Paste internship links or raw details and get a concise structured
          summary instantly.
        </p>
        <p className="mt-1 text-xs text-white/45">
          Built for Internship Cell CET by Aswin M Kumar
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/15 bg-[#081f26]/85 p-5 backdrop-blur-lg">
          <div className="mb-4 flex flex-wrap gap-2">
            {INPUT_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setInputType(mode.id);
                  setError("");
                }}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  inputType === mode.id
                    ? "bg-[#66d7cb] text-[#062128]"
                    : "bg-white/5 text-white/75 hover:bg-white/10"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <p className="mb-4 text-sm text-white/55">
            {INPUT_MODES.find((mode) => mode.id === inputType)?.helper}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {inputType === "url" ? (
              <input
                type="url"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/..."
                className="w-full rounded-xl border border-white/20 bg-[#062128]/85 px-4 py-2.5 text-white placeholder-white/50 backdrop-blur-md transition-all focus:border-[#66d7cb] focus:outline-none focus:ring-2 focus:ring-[#66d7cb]/30"
              />
            ) : (
              <textarea
                rows={9}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Paste internship title, company, role description, skills, location, stipend, and duration..."
                className="w-full resize-y rounded-xl border border-white/20 bg-[#062128]/85 px-4 py-3 text-white placeholder-white/50 backdrop-blur-md transition-all focus:border-[#66d7cb] focus:outline-none focus:ring-2 focus:ring-[#66d7cb]/30"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#66d7cb] to-[#4cb7de] px-6 py-3 text-sm font-bold text-white transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
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
                  <span>Summarizing internship...</span>
                </>
              ) : (
                <span>{submitLabel}</span>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="mt-5 rounded-xl border border-[#66d7cb]/20 bg-[#66d7cb]/10 p-3 text-xs text-[#baf6ee]">
            If LinkedIn blocks scraping, switch to Pasted details mode and paste
            the internship description.
          </div>
        </section>

        <section className="rounded-2xl border border-white/15 bg-[#081f26]/85 p-5 backdrop-blur-lg">
          {!summary ? (
            <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-[#05161b]/80 p-6 text-center">
              <p className="text-sm font-semibold text-[#baf6ee]">
                Summary appears here
              </p>
              <p className="mt-2 text-sm text-white/55">
                Submit a link or pasted details to get title, company,
                requirements, eligibility, stipend, and location in one view.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                  Internship summary
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-white">
                  {summary.title || "Untitled role"}
                </h2>
                <p className="text-sm font-semibold text-[#66d7cb]">
                  {summary.company || "Unknown company"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <DetailPill label="Location" value={summary.location} />
                <DetailPill label="Duration" value={summary.duration} />
                <DetailPill label="Stipend" value={summary.stipend} />
              </div>

              <div className="rounded-xl border border-white/10 bg-[#05161b]/90 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                  Role summary
                </p>
                <p className="mt-2 text-sm leading-6 text-white/85">
                  {summary.role_summary || "Summary not available"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#05161b]/90 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                  Required skills
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(summary.skills || []).length === 0 ? (
                    <span className="text-sm text-white/55">
                      No skills extracted
                    </span>
                  ) : (
                    summary.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[#66d7cb]/20 px-3 py-1 text-xs font-semibold text-[#66d7cb]"
                      >
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#05161b]/90 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                  Eligibility
                </p>
                <p className="mt-2 text-sm text-white/80">
                  {summary.eligibility || "Not mentioned in source details"}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
                <span>
                  {submissionId
                    ? `Saved with ID #${submissionId}`
                    : "Not stored yet"}
                </span>
                {summary.source_url && (
                  <a
                    href={summary.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#9be8df] underline decoration-[#9be8df]/45 underline-offset-4"
                  >
                    Open source listing
                  </a>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
