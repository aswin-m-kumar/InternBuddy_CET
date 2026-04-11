import { useMemo, useState } from "react";
import { API_BASE } from "../lib/auth.jsx";
import internshipCellLogo from "../assets/logoicc.png";

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
  {
    id: "upload",
    label: "Poster upload",
    helper:
      "Upload a PNG/JPG/WEBP image or PDF and extract details automatically",
  },
];

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_FILE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "pdf"];

function DetailPill({ label, value }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/85 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.12em] text-black/50">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#1b1c20]">
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

function isSupportedUpload(file) {
  if (!file) {
    return false;
  }

  const extension = file.name.toLowerCase().split(".").pop();
  return SUPPORTED_FILE_EXTENSIONS.includes(extension);
}

function confidenceLabel(score) {
  if (score >= 85) {
    return "High confidence";
  }
  if (score >= 60) {
    return "Medium confidence";
  }
  return "Low confidence";
}

export function Dashboard() {
  const [inputType, setInputType] = useState("url");
  const [inputValue, setInputValue] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [transportWarnings, setTransportWarnings] = useState([]);

  const submitLabel = useMemo(() => {
    if (inputType === "url") {
      return "Summarize internship link";
    }
    if (inputType === "text") {
      return "Summarize pasted details";
    }
    return "Extract and summarize poster";
  }, [inputType]);

  async function parseJsonResponse(response) {
    const responseText = await response.text();
    if (!responseText) {
      return {};
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return {};
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setTransportWarnings([]);

    if (inputType === "upload") {
      if (!uploadFile) {
        setError("Choose an image or PDF poster before submitting");
        return;
      }

      if (!isSupportedUpload(uploadFile)) {
        setError("Supported uploads: PNG, JPG, JPEG, WEBP, PDF");
        return;
      }

      if (uploadFile.size > MAX_UPLOAD_SIZE_BYTES) {
        setError("File too large. Keep upload under 8MB");
        return;
      }
    } else {
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
    }

    setLoading(true);

    try {
      let response;
      if (inputType === "upload") {
        const formData = new FormData();
        formData.append("file", uploadFile);
        response = await fetch(`${API_BASE}/api/internships/summarize-file`, {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch(`${API_BASE}/api/internships/summarize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input_type: inputType,
            input: inputValue.trim(),
          }),
        });
      }

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize internship details");
      }

      setSummary(data.summary || null);
      setSubmissionId(data.internship_id || null);
      setTransportWarnings(Array.isArray(data.warnings) ? data.warnings : []);
    } catch (submitError) {
      setSummary(null);
      setSubmissionId(null);
      setError(submitError.message || "Something went wrong while summarizing");
    } finally {
      setLoading(false);
    }
  }

  const confidenceScore =
    typeof summary?.confidence_score === "number"
      ? summary.confidence_score
      : null;
  const verificationWarnings = Array.isArray(summary?.verification_warnings)
    ? summary.verification_warnings
    : [];

  return (
    <div className="relative z-50 mx-auto flex w-full max-w-6xl flex-col px-4 pb-8 pt-6 text-[#14161b] sm:px-8">
      <header className="mb-7 rounded-3xl border border-black/10 bg-white/70 p-4 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-20 w-20 overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shadow-inner shadow-black/5">
            <img
              src={internshipCellLogo}
              alt="Internship Cell CET logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-black/55">
              Internship Cell CET
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0f1115] sm:text-4xl">
              InternBuddy
            </h1>
            <p className="mt-2 text-sm text-black/65">
              Submit internship links, text, or posters to get verified
              summaries with confidence scoring.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-black/10 bg-white/75 p-5 shadow-[0_28px_50px_-36px_rgba(0,0,0,0.45)] backdrop-blur-md">
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
                    ? "bg-[#17181c] text-white"
                    : "bg-black/5 text-black/65 hover:bg-black/10"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <p className="mb-4 text-sm text-black/60">
            {INPUT_MODES.find((mode) => mode.id === inputType)?.helper}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {inputType === "url" && (
              <input
                type="url"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/..."
                className="w-full rounded-xl border border-black/20 bg-white px-4 py-2.5 text-black placeholder-black/35 transition-all focus:border-black/50 focus:outline-none focus:ring-2 focus:ring-black/15"
              />
            )}

            {inputType === "text" && (
              <textarea
                rows={9}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Paste internship title, company, role description, skills, location, stipend, and duration..."
                className="w-full resize-y rounded-xl border border-black/20 bg-white px-4 py-3 text-black placeholder-black/35 transition-all focus:border-black/50 focus:outline-none focus:ring-2 focus:ring-black/15"
              />
            )}

            {inputType === "upload" && (
              <div className="space-y-3">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-black/25 bg-[#f8f8fa] px-4 py-6 text-center transition hover:bg-[#efeff3]">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.pdf"
                    className="hidden"
                    onChange={(event) =>
                      setUploadFile(event.target.files?.[0] || null)
                    }
                  />
                  <p className="text-sm font-semibold text-[#16181d]">
                    Upload Internship Poster
                  </p>
                  <p className="text-xs text-black/55">
                    PNG, JPG, WEBP, or PDF up to 8MB
                  </p>
                  <span className="rounded-full bg-[#17181c] px-4 py-1 text-xs font-semibold text-white">
                    Choose File
                  </span>
                </label>

                {uploadFile && (
                  <div className="rounded-xl border border-black/10 bg-white p-3 text-xs text-black/70">
                    Selected:{" "}
                    <span className="font-semibold text-black">
                      {uploadFile.name}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#101115] via-[#242830] to-[#3f4652] px-6 py-3 text-sm font-bold text-white transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
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
                  <span>Processing request...</span>
                </>
              ) : (
                <span>{submitLabel}</span>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-900">
              {error}
            </div>
          )}

          {transportWarnings.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/15 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-900">
                Upload warnings
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-950/90">
                {transportWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-black/10 bg-white/75 p-5 shadow-[0_28px_50px_-36px_rgba(0,0,0,0.45)] backdrop-blur-md">
          {!summary ? (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-black/20 bg-[#f8f8fa] p-6 text-center">
              <p className="text-sm font-semibold text-[#16181d]">
                Summary appears here
              </p>
              <p className="mt-2 text-sm text-black/55">
                Submit a link, pasted details, or upload to receive a verified
                internship summary.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-black/45">
                  Internship summary
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#101115]">
                  {summary.title || "Untitled role"}
                </h2>
                <p className="text-sm font-semibold text-black/70">
                  {summary.company || "Unknown company"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <DetailPill label="Location" value={summary.location} />
                <DetailPill label="Duration" value={summary.duration} />
                <DetailPill label="Stipend" value={summary.stipend} />
              </div>

              {confidenceScore !== null && (
                <div className="rounded-xl border border-black/10 bg-white/85 p-3 text-xs text-black/80">
                  {confidenceLabel(confidenceScore)}: {confidenceScore}%
                </div>
              )}

              <div className="rounded-xl border border-black/10 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-black/45">
                  Role summary
                </p>
                <p className="mt-2 text-sm leading-6 text-black/85">
                  {summary.role_summary || "Summary not available"}
                </p>
              </div>

              <div className="rounded-xl border border-black/10 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-black/45">
                  Required skills
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(summary.skills || []).length === 0 ? (
                    <span className="text-sm text-black/55">
                      No skills extracted
                    </span>
                  ) : (
                    summary.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-black/15 bg-black/5 px-3 py-1 text-xs font-semibold text-black/80"
                      >
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-black/10 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-black/45">
                  Eligibility
                </p>
                <p className="mt-2 text-sm text-black/80">
                  {summary.eligibility || "Not mentioned in source details"}
                </p>
              </div>

              {verificationWarnings.length > 0 && (
                <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-red-900">
                    Verification warnings
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-red-900/85">
                    {verificationWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-black/60">
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
                    className="font-semibold text-black underline decoration-black/35 underline-offset-4"
                  >
                    Open source listing
                  </a>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="mt-6 border-t border-black/10 pt-4 text-center">
        <p className="text-xs text-black/50">
          Built for Internship Cell CET by Aswin M Kumar
        </p>
      </footer>
    </div>
  );
}
