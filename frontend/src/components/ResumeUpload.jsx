import { useState } from 'react';
import { motion } from 'motion/react';
import { API_BASE } from '../lib/auth.jsx';

export function ResumeUpload({ onUploadComplete, user }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/resume/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setParsedData(data.data);
      onUploadComplete?.(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const hasResume = user?.has_resume || parsedData;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-white/15 bg-[#081f26]/85 p-5 backdrop-blur-lg"
    >
      <h3 className="mb-4 flex items-center text-lg font-bold text-[#9bfef0]">
        Your Resume
      </h3>

      {hasResume ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-[#4ade80]/30 bg-[#4ade80]/10 p-4">
            <svg className="h-8 w-8 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-[#4ade80]">Resume parsed successfully</p>
              <p className="text-sm text-white/60">Your profile is being used for matching</p>
            </div>
          </div>

          {parsedData?.education && (
            <div className="rounded-xl border border-white/10 bg-[#05161b]/90 p-4">
              <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-white/70">Extracted Info</h4>
              <div className="space-y-2 text-sm text-white/80">
                <p><span className="text-white/50">Degree:</span> {parsedData.education.degree || 'N/A'}</p>
                <p><span className="text-white/50">Branch:</span> {parsedData.education.branch || 'N/A'}</p>
                <p><span className="text-white/50">Year:</span> {parsedData.education.year || 'N/A'}</p>
                {parsedData.education.cgpa && <p><span className="text-white/50">CGPA:</span> {parsedData.education.cgpa}</p>}
              </div>
            </div>
          )}

          {parsedData?.skills && parsedData.skills.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-[#05161b]/90 p-4">
              <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-white/70">Skills Detected</h4>
              <div className="flex flex-wrap gap-2">
                {parsedData.skills.slice(0, 15).map((skill, i) => (
                  <span key={i} className="rounded-full bg-[#66d7cb]/20 px-3 py-1 text-xs font-semibold text-[#66d7cb]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="sr-only">Upload new resume</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
            <span className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Upload New Resume
            </span>
          </label>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg className="h-16 w-16 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="mb-4 text-sm text-white/70">Upload your resume to get personalized internship matches</p>
          <label className="inline-block">
            <input
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
            <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#66d7cb] to-[#4cb7de] px-6 py-3 font-bold text-white transition-all hover:scale-[1.02]">
              {uploading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Parsing...</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload Resume (PDF)</span>
                </>
              )}
            </span>
          </label>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-100">
          {error}
        </div>
      )}
    </motion.div>
  );
}
