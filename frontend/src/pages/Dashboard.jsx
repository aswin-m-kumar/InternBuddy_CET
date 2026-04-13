import { useMemo, useState } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { apiFetch, signOut } from "../lib/auth.jsx";
import internshipCellLogo from "../assets/logoicc.png";
import { LiquidGlassCard } from "../components/LiquidGlassCard.jsx";

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
const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_FILE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "pdf"];

const SCORE_COLORS = {
  high: "bg-emerald-100 text-emerald-800 border-emerald-300",
  medium: "bg-amber-100 text-amber-800 border-amber-300",
  low: "bg-rose-100 text-rose-800 border-rose-300",
};

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

function dismissibleToneClasses(tone) {
  if (tone === "danger") {
    return "border-red-400/50 bg-red-100 text-red-900";
  }
  if (tone === "warning") {
    return "border-amber-400/50 bg-amber-100 text-amber-900";
  }
  return "border-black/15 bg-black/5 text-black/70";
}

function scoreBucket(score) {
  if (score >= 70) {
    return "high";
  }
  if (score >= 40) {
    return "medium";
  }
  return "low";
}

function isResumePdf(file) {
  if (!file) {
    return false;
  }
  return file.name.toLowerCase().endsWith(".pdf");
}

function buildDeadlineAlerts(deadline) {
  if (!deadline) {
    return [];
  }

  const alerts = [];
  if (deadline.expired) {
    const daysAgo = deadline.days_ago || 0;
    alerts.push({
      id: `deadline-expired-${daysAgo}`,
      tone: "danger",
      text: `Deadline Passed - This internship closed ${daysAgo} days ago${deadline.raw ? ` (deadline: ${deadline.raw})` : ""}`,
    });
  } else if (
    deadline.expiring_soon &&
    typeof deadline.days_remaining === "number"
  ) {
    alerts.push({
      id: `deadline-soon-${deadline.days_remaining}`,
      tone: "warning",
      text: `Closing Soon - ${deadline.days_remaining} days remaining${deadline.parsed ? `. Apply before ${deadline.parsed}.` : "."}`,
    });
  }

  if (deadline.deadline_warning === "none_found") {
    alerts.push({
      id: "deadline-none-found",
      tone: "neutral",
      text: "No deadline detected - verify before applying.",
    });
  }

  if (deadline.deadline_warning === "rolling") {
    alerts.push({
      id: "deadline-rolling",
      tone: "neutral",
      text: "Rolling admissions - no fixed deadline.",
    });
  }

  if (deadline.deadline_assumed_year) {
    const assumedYear = (deadline.parsed || "").slice(0, 4) || "current year";
    alerts.push({
      id: `deadline-assumed-${assumedYear}`,
      tone: "warning",
      text: `Deadline year was assumed as ${assumedYear} - verify manually.`,
    });
  }

  return alerts;
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("summarizer");

  const [inputType, setInputType] = useState("url");
  const [inputValue, setInputValue] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [transportWarnings, setTransportWarnings] = useState([]);

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeDragActive, setResumeDragActive] = useState(false);
  const [resumeInputError, setResumeInputError] = useState("");

  const [matchInputType, setMatchInputType] = useState("url");
  const [matchUrl, setMatchUrl] = useState("");
  const [matchText, setMatchText] = useState("");
  const [matchPosterFile, setMatchPosterFile] = useState(null);

  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [matchInternship, setMatchInternship] = useState(null);
  const [matchDeadline, setMatchDeadline] = useState(null);
  const [matchAnalysis, setMatchAnalysis] = useState(null);
  const [matchWarnings, setMatchWarnings] = useState([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);
  const [deadlineExpiredLocked, setDeadlineExpiredLocked] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  const submitLabel = useMemo(() => {
    if (inputType === "url") {
      return "Summarize internship link";
    }
    if (inputType === "text") {
      return "Summarize pasted details";
    }
    return "Extract and summarize poster";
  }, [inputType]);

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
      let data;
      if (inputType === "upload") {
        const formData = new FormData();
        formData.append("file", uploadFile);
        ({ response, data } = await apiFetch(
          "/api/internships/summarize-file",
          {
            method: "POST",
            body: formData,
          },
        ));
      } else {
        ({ response, data } = await apiFetch("/api/internships/summarize", {
          method: "POST",
          body: JSON.stringify({
            input_type: inputType,
            input: inputValue.trim(),
          }),
        }));
      }

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

  function resetMatchResultState() {
    setMatchInternship(null);
    setMatchDeadline(null);
    setMatchAnalysis(null);
    setMatchWarnings([]);
    setDismissedAlertIds([]);
    setDeadlineExpiredLocked(false);
  }

  function onResumeFileSelected(file) {
    setResumeInputError("");
    setMatchError("");
    resetMatchResultState();

    if (!file) {
      setResumeFile(null);
      return;
    }

    if (!isResumePdf(file)) {
      setResumeInputError("Only PDF resumes are allowed");
      setResumeFile(null);
      return;
    }

    if (file.size > MAX_RESUME_SIZE_BYTES) {
      setResumeInputError("Resume file is too large. Keep it under 5MB");
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  }

  function clearMatchInputsForMode(mode) {
    if (mode !== "url") {
      setMatchUrl("");
    }
    if (mode !== "text") {
      setMatchText("");
    }
    if (mode !== "upload") {
      setMatchPosterFile(null);
    }
  }

  function switchMatchMode(mode) {
    setMatchInputType(mode);
    setMatchError("");
    resetMatchResultState();
    clearMatchInputsForMode(mode);
  }

  const isMatchUrlValid =
    matchInputType !== "url" || isValidHttpUrl(matchUrl.trim());
  const hasInternshipInput =
    (matchInputType === "url" &&
      matchUrl.trim().length > 0 &&
      isMatchUrlValid) ||
    (matchInputType === "text" && matchText.trim().length > 0) ||
    (matchInputType === "upload" && Boolean(matchPosterFile));

  const analyzeDisabled =
    matchLoading || !resumeFile || !hasInternshipInput || deadlineExpiredLocked;

  const deadlineAlerts = buildDeadlineAlerts(matchDeadline).filter(
    (alert) => !dismissedAlertIds.includes(alert.id),
  );

  const warningAlerts = (matchWarnings || [])
    .map((warning, index) => ({
      id: `warning-${index}-${warning}`,
      tone: "neutral",
      text: warning,
    }))
    .filter((alert) => !dismissedAlertIds.includes(alert.id));

  async function handleAnalyzeMatch(event) {
    event.preventDefault();

    setMatchError("");
    setResumeInputError("");
    setDismissedAlertIds([]);

    if (!resumeFile) {
      setResumeInputError("Upload your resume PDF before analyzing");
      return;
    }

    if (!isResumePdf(resumeFile)) {
      setResumeInputError("Only PDF resumes are allowed");
      return;
    }

    if (resumeFile.size > MAX_RESUME_SIZE_BYTES) {
      setResumeInputError("Resume file is too large. Keep it under 5MB");
      return;
    }

    if (!hasInternshipInput) {
      setMatchError("Provide internship input before analyzing");
      return;
    }

    if (matchInputType === "url" && !isMatchUrlValid) {
      setMatchError(
        "Provide a valid internship URL starting with http:// or https://",
      );
      return;
    }

    if (matchInputType === "upload") {
      if (!isSupportedUpload(matchPosterFile)) {
        setMatchError(
          "Supported internship uploads: PNG, JPG, JPEG, WEBP, PDF",
        );
        return;
      }
      if (matchPosterFile.size > MAX_UPLOAD_SIZE_BYTES) {
        setMatchError("Internship poster is too large. Keep it under 8MB");
        return;
      }
    }

    setMatchLoading(true);
    resetMatchResultState();

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);

      if (matchInputType === "url") {
        formData.append("url", matchUrl.trim());
      } else if (matchInputType === "text") {
        formData.append("raw_text", matchText.trim());
      } else {
        formData.append("poster", matchPosterFile);
      }

      const { response, data } = await apiFetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Too many requests. Please wait a minute and try again.",
          );
        }

        if (data.error === "DEADLINE_EXPIRED") {
          setDeadlineExpiredLocked(true);
          setMatchDeadline({
            raw: data.deadline || null,
            expired: true,
            days_ago: data.days_ago,
            expiring_soon: false,
          });
          setMatchError(
            data.message || "This internship deadline has already passed.",
          );
          return;
        }

        const fallbackMessage =
          data.message ||
          data.error ||
          "Something went wrong. Please try again.";
        if (data.error === "RESUME_EXTRACTION_FAILED") {
          setResumeInputError(fallbackMessage);
          return;
        }
        throw new Error(fallbackMessage);
      }

      setMatchInternship(data.internship || null);
      setMatchDeadline(data.deadline || null);
      setMatchAnalysis(data.analysis || null);
      setMatchWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      setDeadlineExpiredLocked(Boolean(data.deadline?.expired));
    } catch (analyzeError) {
      setMatchError(
        analyzeError.message || "Something went wrong. Please try again.",
      );
    } finally {
      setMatchLoading(false);
    }
  }

  async function handleSignOut() {
    setSignOutLoading(true);
    try {
      await signOut();
    } finally {
      setSignOutLoading(false);
      window.location.hash = "#auth";
    }
  }

  const analysisScore =
    typeof matchAnalysis?.score === "number" ? matchAnalysis.score : 0;
  const scoreType = scoreBucket(analysisScore);

  return (
    <div className="relative min-h-[100svh] overflow-hidden text-[#14161b]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <ShaderGradientCanvas
          style={{ width: "100%", height: "100%" }}
          lazyLoad={undefined}
          fov={100}
          pixelDensity={1}
          pointerEvents="none"
        >
          <ShaderGradient
            animate="on"
            type="waterPlane"
            wireframe={false}
            shader="defaults"
            uTime={8}
            uSpeed={0.3}
            uStrength={0.8}
            uDensity={1.5}
            uFrequency={0}
            uAmplitude={0}
            positionX={0}
            positionY={0}
            positionZ={0}
            rotationX={50}
            rotationY={0}
            rotationZ={-60}
            color1="#d9daeb"
            color2="#dedde5"
            color3="#212121"
            reflection={0.1}
            cAzimuthAngle={180}
            cPolarAngle={80}
            cDistance={2.8}
            cameraZoom={9.1}
            lightType="3d"
            brightness={1}
            envPreset="city"
            grain="off"
            toggleAxis={false}
            zoomOut={false}
            hoverState=""
            enableTransition={false}
          />
        </ShaderGradientCanvas>
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.26)_0%,rgba(9,23,26,0.12)_35%,rgba(9,23,26,0.45)_100%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-4 pb-8 pt-6 sm:px-8">
        <header className="mb-7 rounded-3xl border border-black/10 bg-white/70 p-4 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signOutLoading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-black/20 bg-white/80 px-4 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signOutLoading ? "Signing out..." : "Sign out"}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("summarizer")}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                activeTab === "summarizer"
                  ? "bg-[#17181c] text-white"
                  : "bg-black/5 text-black/65 hover:bg-black/10"
              }`}
            >
              Internship Summarizer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("resume")}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                activeTab === "resume"
                  ? "bg-[#17181c] text-white"
                  : "bg-black/5 text-black/65 hover:bg-black/10"
              }`}
            >
              Resume Match
            </button>
          </div>
        </header>

        {activeTab === "summarizer" ? (
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
                    Submit a link, pasted details, or upload to receive a
                    verified internship summary.
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
        ) : (
          <div className="space-y-5">
            <form onSubmit={handleAnalyzeMatch} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <section className="rounded-3xl border border-black/10 bg-white/75 p-5 shadow-[0_28px_50px_-36px_rgba(0,0,0,0.45)] backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/55">
                    Resume PDF
                  </p>

                  <label
                    className={`mt-3 flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-6 text-center transition ${
                      resumeDragActive
                        ? "border-black/40 bg-black/10"
                        : "border-black/25 bg-[#f8f8fa] hover:bg-[#efeff3]"
                    }`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setResumeDragActive(true);
                    }}
                    onDragLeave={() => setResumeDragActive(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setResumeDragActive(false);
                      const file = event.dataTransfer.files?.[0] || null;
                      onResumeFileSelected(file);
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(event) =>
                        onResumeFileSelected(event.target.files?.[0] || null)
                      }
                    />
                    <p className="text-lg font-bold text-[#16181d]">
                      Upload Resume
                    </p>
                    <p className="text-sm text-black/55">
                      Drag and drop or click to upload PDF (max 5MB)
                    </p>
                    <span className="rounded-full bg-[#17181c] px-4 py-1 text-xs font-semibold text-white">
                      Choose PDF
                    </span>
                  </label>

                  {resumeFile && (
                    <div className="mt-3 rounded-xl border border-black/10 bg-white p-3 text-xs text-black/70">
                      Selected:{" "}
                      <span className="font-semibold text-black">
                        {resumeFile.name}
                      </span>
                    </div>
                  )}

                  {resumeInputError && (
                    <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-900">
                      <div className="flex items-start justify-between gap-2">
                        <span>{resumeInputError}</span>
                        <button
                          type="button"
                          aria-label="Dismiss resume error"
                          className="text-red-900/80"
                          onClick={() => setResumeInputError("")}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-black/10 bg-white/75 p-5 shadow-[0_28px_50px_-36px_rgba(0,0,0,0.45)] backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/55">
                    Internship Input
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {INPUT_MODES.map((mode) => (
                      <button
                        key={`match-${mode.id}`}
                        type="button"
                        onClick={() => switchMatchMode(mode.id)}
                        className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                          matchInputType === mode.id
                            ? "bg-[#17181c] text-white"
                            : "bg-black/5 text-black/65 hover:bg-black/10"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  <p className="mt-3 text-sm text-black/60">
                    {
                      INPUT_MODES.find((mode) => mode.id === matchInputType)
                        ?.helper
                    }
                  </p>

                  <div className="mt-3 space-y-3">
                    {matchInputType === "url" && (
                      <input
                        type="url"
                        value={matchUrl}
                        onChange={(event) => {
                          setMatchUrl(event.target.value);
                          resetMatchResultState();
                        }}
                        placeholder="https://www.linkedin.com/jobs/view/..."
                        className="w-full rounded-xl border border-black/20 bg-white px-4 py-2.5 text-black placeholder-black/35 focus:border-black/50 focus:outline-none focus:ring-2 focus:ring-black/15"
                      />
                    )}

                    {matchInputType === "text" && (
                      <textarea
                        rows={8}
                        value={matchText}
                        onChange={(event) => {
                          setMatchText(event.target.value);
                          resetMatchResultState();
                        }}
                        placeholder="Paste internship details here..."
                        className="w-full resize-y rounded-xl border border-black/20 bg-white px-4 py-3 text-black placeholder-black/35 focus:border-black/50 focus:outline-none focus:ring-2 focus:ring-black/15"
                      />
                    )}

                    {matchInputType === "upload" && (
                      <div>
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-black/25 bg-[#f8f8fa] px-4 py-6 text-center transition hover:bg-[#efeff3]">
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp,.pdf"
                            className="hidden"
                            onChange={(event) => {
                              setMatchPosterFile(
                                event.target.files?.[0] || null,
                              );
                              resetMatchResultState();
                            }}
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
                        {matchPosterFile && (
                          <div className="mt-3 rounded-xl border border-black/10 bg-white p-3 text-xs text-black/70">
                            Selected:{" "}
                            <span className="font-semibold text-black">
                              {matchPosterFile.name}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <button
                type="submit"
                disabled={analyzeDisabled}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#66d7cb] via-[#8ac7ff] to-[#d9daeb] px-6 py-3 text-sm font-extrabold text-[#071317] shadow-[0_18px_40px_-18px_rgba(102,215,203,0.85)] transition-all hover:scale-[1.01] hover:shadow-[0_22px_48px_-18px_rgba(102,215,203,0.95)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[0_10px_24px_-18px_rgba(102,215,203,0.45)] disabled:hover:scale-100"
              >
                {matchLoading ? (
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
                    <span>Analyzing your profile...</span>
                  </>
                ) : (
                  <span>Analyze Match</span>
                )}
              </button>
            </form>

            {matchError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-900">
                <div className="flex items-start justify-between gap-2">
                  <span>{matchError}</span>
                  <button
                    type="button"
                    aria-label="Dismiss analysis error"
                    onClick={() => setMatchError("")}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {[...deadlineAlerts, ...warningAlerts].map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl border p-3 text-sm ${dismissibleToneClasses(alert.tone)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span>{alert.text}</span>
                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() =>
                      setDismissedAlertIds((prev) => [...prev, alert.id])
                    }
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {matchAnalysis && (
              <LiquidGlassCard
                draggable={false}
                expandable={false}
                width="100%"
                height="auto"
                className="w-full overflow-hidden"
                blurIntensity="md"
                borderRadius="24px"
                glowIntensity="md"
                shadowIntensity="md"
              >
                <div className="rounded-3xl border border-black/10 bg-white/80 p-5 backdrop-blur-md">
                  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-5 text-center">
                    <div
                      className={`rounded-full border px-5 py-2 text-2xl font-extrabold ${SCORE_COLORS[scoreType]}`}
                    >
                      {analysisScore} / 100
                    </div>
                    <p className="text-lg font-bold text-black/80">
                      {matchAnalysis.recommendation}
                    </p>
                    <span className="rounded-full border border-black/15 bg-black/5 px-3 py-1 text-xs font-semibold text-black/70">
                      Confidence: {matchAnalysis.confidence}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-emerald-300/60 bg-emerald-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                        Matched Skills
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(matchAnalysis.matched_skills || []).length ? (
                          matchAnalysis.matched_skills.map((skill) => (
                            <span
                              key={`matched-${skill}`}
                              className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-emerald-800/70">
                            No matched skills identified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-rose-300/60 bg-rose-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-800">
                        Missing Skills
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(matchAnalysis.missing_skills || []).length ? (
                          matchAnalysis.missing_skills.map((skill) => (
                            <span
                              key={`missing-${skill}`}
                              className="rounded-full border border-rose-300 bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-rose-800/70">
                            No missing skills listed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          matchAnalysis.eligibility_met
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {matchAnalysis.eligibility_met
                          ? "✓ Eligible"
                          : "✗ Not Eligible"}
                      </span>
                      {matchInternship?.title && (
                        <span className="text-sm font-semibold text-black/75">
                          {matchInternship.title}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-black/70">
                      {matchAnalysis.eligibility_notes ||
                        "Eligibility notes not available."}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border-l-4 border-emerald-400 border-y border-r border-black/10 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/55">
                        Strengths
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/80">
                        {(matchAnalysis.strengths || []).length ? (
                          matchAnalysis.strengths.map((item) => (
                            <li key={`strength-${item}`}>{item}</li>
                          ))
                        ) : (
                          <li>No strengths listed.</li>
                        )}
                      </ul>
                    </div>

                    <div className="rounded-xl border-l-4 border-rose-400 border-y border-r border-black/10 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/55">
                        Gaps
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/80">
                        {(matchAnalysis.gaps || []).length ? (
                          matchAnalysis.gaps.map((item) => (
                            <li key={`gap-${item}`}>{item}</li>
                          ))
                        ) : (
                          <li>No critical gaps listed.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <span
                      className={`inline-flex rounded-full border px-5 py-2 text-sm font-bold ${SCORE_COLORS[scoreType]}`}
                    >
                      Recommendation: {matchAnalysis.recommendation}
                    </span>
                  </div>
                </div>
              </LiquidGlassCard>
            )}
          </div>
        )}

        <footer className="mt-6 border-t border-black/10 pt-4 text-center">
          <p className="text-xs text-black/50">
            Built for Internship Cell CET by Aswin M Kumar
          </p>
        </footer>
      </div>
    </div>
  );
}
