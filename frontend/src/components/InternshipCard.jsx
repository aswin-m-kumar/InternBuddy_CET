import { motion } from 'motion/react';

export function InternshipCard({ internship, onToggleSave }) {
  const eligibility = internship.eligibility;
  const isEligible = eligibility?.eligible || false;
  const score = eligibility?.score || 0;

  const getSourceColor = (source) => {
    switch (source) {
      case 'linkedin': return 'text-[#0077b5] bg-[#0077b5]/10 border-[#0077b5]/30';
      case 'internship_cell': return 'text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/30';
      default: return 'text-[#66d7cb] bg-[#66d7cb]/10 border-[#66d7cb]/30';
    }
  };

  const getEligibilityBadge = () => {
    if (!eligibility) return null;
    if (score >= 70) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#4ade80]/20 px-2.5 py-1 text-xs font-semibold text-[#4ade80]">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {score}% Match
        </span>
      );
    }
    if (score >= 40) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#fbbf24]/20 px-2.5 py-1 text-xs font-semibold text-[#fbbf24]">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {score}% Match
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-400">
        {score}% Match
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-2xl border border-white/15 bg-[#081f26]/85 p-5 backdrop-blur-lg transition-all hover:border-white/25 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${getSourceColor(internship.source)}`}>
              {internship.source?.replace('_', ' ')}
            </span>
            {eligibility && getEligibilityBadge()}
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-[#66d7cb] transition-colors">
            {internship.title}
          </h3>
          <p className="text-sm font-semibold text-[#66d7cb]">{internship.company}</p>
        </div>
        <button
          onClick={onToggleSave}
          className={`rounded-full p-2 transition-colors ${
            internship.saved
              ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
              : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
          }`}
        >
          <svg className="h-5 w-5" fill={internship.saved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/60">
        {internship.location && (
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {internship.location}
          </span>
        )}
        {internship.duration && (
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {internship.duration}
          </span>
        )}
        {internship.stipend && (
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {internship.stipend}
          </span>
        )}
      </div>

      {eligibility?.matching_skills && eligibility.matching_skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {eligibility.matching_skills.slice(0, 5).map((skill, i) => (
            <span key={i} className="rounded-full bg-[#4ade80]/10 px-2 py-0.5 text-xs text-[#4ade80]">
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <a
          href={internship.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-xl bg-gradient-to-r from-[#66d7cb] to-[#4cb7de] py-2.5 text-center text-sm font-bold text-white transition-all hover:scale-[1.02]"
        >
          Apply Now
        </a>
        {eligibility?.reason && (
          <button
            onClick={() => alert(eligibility.reason)}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
          >
            Why?
          </button>
        )}
      </div>
    </motion.div>
  );
}
