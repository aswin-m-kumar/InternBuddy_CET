import { useState, useEffect } from 'react';
import { API_BASE } from '../lib/auth.jsx';
import { ResumeUpload } from '../components/ResumeUpload';
import { InternshipCard } from '../components/InternshipCard';

export function Dashboard() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [profile, setProfile] = useState({
    education: null,
    skills: [],
    experience: null,
    projects: [],
    has_resume: false
  });

  useEffect(() => {
    fetchProfile();
    fetchInternships();
  }, [searchQuery, filterLocation, activeTab]);

  async function fetchProfile() {
    try {
      const res = await fetch(`${API_BASE}/api/resume`);
      const data = await res.json();
      if (res.ok) {
        setProfile({
          education: data.education,
          skills: data.skills || [],
          experience: data.experience,
          projects: data.projects || [],
          has_resume: Boolean(data.has_resume)
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }

  async function fetchInternships() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (filterLocation) params.append('location', filterLocation);
      if (activeTab === 'saved') params.append('saved', 'true');

      const url = activeTab === 'saved'
        ? `${API_BASE}/api/saved`
        : `${API_BASE}/api/internships?${params}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setInternships(data.internships || []);
      }
    } catch (err) {
      console.error('Failed to fetch internships:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSave(id, isSaved) {
    try {
      const res = await fetch(`${API_BASE}/api/internships/${id}/save`, {
        method: isSaved ? 'DELETE' : 'POST'
      });
      if (res.ok) {
        fetchInternships();
      }
    } catch (err) {
      console.error('Toggle save failed:', err);
    }
  }

  const eligibleCount = internships.filter((i) => i.eligibility?.eligible).length;

  async function handleUploadComplete() {
    await fetchProfile();
    fetchInternships();
  }

  return (
    <div className="relative z-50 mx-auto flex w-full max-w-5xl flex-col px-5 pb-8 pt-6 text-slate-100 sm:px-10">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-[#e2fffb] via-[#b9fdff] to-[#f8ffff] bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            InternBuddy CET
          </h1>
          <p className="text-sm text-white/60">
            Upload your resume and start exploring internships instantly
          </p>
        </div>
      </header>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#66d7cb]/30 bg-[#66d7cb]/10 p-3 text-center">
          <p className="text-2xl font-bold text-[#66d7cb]">{internships.length}</p>
          <p className="text-xs text-white/60">Internships</p>
        </div>
        <div className="rounded-xl border border-[#4ade80]/30 bg-[#4ade80]/10 p-3 text-center">
          <p className="text-2xl font-bold text-[#4ade80]">{eligibleCount}</p>
          <p className="text-xs text-white/60">Eligible</p>
        </div>
        <div className="rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/10 p-3 text-center">
          <p className="text-2xl font-bold text-[#fbbf24]">{profile.skills?.length || 0}</p>
          <p className="text-xs text-white/60">Skills</p>
        </div>
        <div className="rounded-xl border border-[#a78bfa]/30 bg-[#a78bfa]/10 p-3 text-center">
          <p className="text-2xl font-bold text-[#a78bfa]">{profile.education?.year || 'N/A'}</p>
          <p className="text-xs text-white/60">Batch</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, company, or skills..."
            className="w-full rounded-xl border border-white/20 bg-[#062128]/85 px-4 py-2.5 text-white placeholder-white/50 backdrop-blur-md transition-all focus:border-[#66d7cb] focus:outline-none focus:ring-2 focus:ring-[#66d7cb]/30"
          />
        </div>
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="rounded-xl border border-white/20 bg-[#062128]/85 px-4 py-2.5 text-white backdrop-blur-md focus:border-[#66d7cb] focus:outline-none focus:ring-2 focus:ring-[#66d7cb]/30"
        >
          <option value="">All Locations</option>
          <option value="remote">Remote</option>
          <option value="bangalore">Bangalore</option>
          <option value="delhi">Delhi</option>
          <option value="mumbai">Mumbai</option>
          <option value="trivandrum">Trivandrum</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {['all', 'saved'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition-all ${
              activeTab === tab
                ? 'bg-[#66d7cb] text-[#062128]'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Resume Section */}
        <div className="lg:col-span-1">
          <ResumeUpload user={profile} onUploadComplete={handleUploadComplete} />
        </div>

        {/* Internships List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="h-8 w-8 animate-spin text-[#66d7cb]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : internships.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-[#081f26]/85 p-8 text-center backdrop-blur-lg">
              <p className="text-white/60">No internships found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {internships.map((intern) => (
                <InternshipCard
                  key={intern.id}
                  internship={intern}
                  onToggleSave={() => handleToggleSave(intern.id, intern.saved)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
