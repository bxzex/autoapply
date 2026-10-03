import React, { useState, useEffect, useRef } from 'react'
import { 
  FileText, 
  Search, 
  Settings, 
  User, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  Github, 
  Linkedin, 
  Instagram, 
  Loader2, 
  MapPin,
  Briefcase,
  Layers,
  AlertCircle,
  Activity,
  Zap,
  Sparkles,
  X,
  Heart
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { extractTextFromPDF } from './lib/pdf'
import { getEmbedding, extractSkills, cosineSimilarity } from './lib/ml'
import { saveProfile, getProfile, saveApplication, getApplications, type UserProfile, type JobApplication } from './lib/db'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function App() {
  const [activeTab, setActiveTab] = useState<'profile' | 'search' | 'history' | 'config'>(() => {
    return (localStorage.getItem('activeTab') as any) || 'profile';
  })
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    Promise.all([getProfile(), getApplications()]).then(([p, a]) => {
      if (p) setProfile(p)
      if (a) setApplications(a)
      setLoading(false)
    })
  }, [])

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Refined Header */}
      <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <span className="font-bold text-lg text-slate-900 shrink-0">Auto<span className="text-[#b4532a]">Apply</span></span>

          <div className="flex items-center gap-1 overflow-x-auto">
            <button onClick={() => setActiveTab('profile')} className={cn("nav-link", activeTab === 'profile' && "active")}>
              Profile
            </button>
            <button onClick={() => setActiveTab('search')} className={cn("nav-link", activeTab === 'search' && "active")}>
              Listings
            </button>
            <button onClick={() => setActiveTab('history')} className={cn("nav-link", activeTab === 'history' && "active")}>
              Applications
            </button>
            <button onClick={() => setActiveTab('config')} className={cn("nav-link", activeTab === 'config' && "active")}>
              Settings
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <a 
              href="https://buy.stripe.com/9B6eVfd9E6OC3sr7cEaAw03" 
              target="_blank" 
              rel="noreferrer"
              className="text-sm text-slate-500 hover:text-slate-900 underline underline-offset-4"
            >
              Support the project
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {activeTab === 'profile' && <ProfileSection profile={profile} onProfileUpdate={(p) => (setProfile(p), saveProfile(p))} />}
        {activeTab === 'search' && <SearchSection profile={profile} onApply={() => getApplications().then(setApplications)} />}
        {activeTab === 'history' && <HistorySection applications={applications} />}
        {activeTab === 'config' && <ConfigSection profile={profile} onProfileUpdate={(p) => (setProfile(p), saveProfile(p))} />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
          <span>© 2026 <a href="https://bxzex.com" target="_blank" rel="noreferrer" className="underline">bxzex</a></span>
          <span>Listings from Adzuna and Arbeitnow</span>
          <a href="https://github.com/bxzex/autoapply" target="_blank" rel="noreferrer" className="underline">Source on GitHub</a>
        </div>
      </footer>
    </div>
  )
}

function ProfileSection({ profile, onProfileUpdate }: { profile: UserProfile | null, onProfileUpdate: (p: UserProfile) => void }) {
  const [isParsing, setIsParsing] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile?.resumeFile && !pdfUrl) {
      const blob = new Blob([profile.resumeFile as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [profile?.resumeFile])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    try {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(file));
      const text = await extractTextFromPDF(file);
      const skills = await extractSkills(text);
      const embedding = await getEmbedding(text);
      const resumeFile = new Uint8Array(await file.arrayBuffer());

      onProfileUpdate({ 
        ...profile,
        id: 'current', 
        name: file.name, 
        resumeText: text, 
        resumeFile,
        skills, 
        embedding, 
        updatedAt: Date.now() 
      } as UserProfile);
    } catch (err) {
      console.error(err);
      alert('Could not read that PDF. Try exporting it again, or use a text-based PDF rather than a scan.');
    } finally { setIsParsing(false); }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl space-y-12 text-left">
      <div className="space-y-4 text-left">
        <h2 className="text-3xl font-bold text-slate-900 text-left">Your resume</h2>
        <p className="text-xl text-slate-500 leading-relaxed max-w-2xl text-left">
          Upload a PDF. It is read in your browser and kept on this device; listings are ranked against it.
        </p>
      </div>

      {!profile ? (
        <div 
          onClick={() => inputRef.current?.click()}
          className={cn(
            "gpt-card p-12 flex flex-col items-center justify-center text-center cursor-pointer group hover:bg-white/50",
            isParsing && "pointer-events-none opacity-50 bg-slate-50"
          )}
        >
          <input type="file" className="hidden" ref={inputRef} onChange={handleUpload} accept=".pdf" />
          <div className="w-20 h-20 bg-slate-100 rounded-md flex items-center justify-center mb-8 group-hover:scale-105 transition-all duration-500 group-hover:bg-[#0f172a] group-hover:text-white">
            {isParsing ? <Loader2 className="w-10 h-10 animate-spin" /> : <Plus className="w-10 h-10" />}
          </div>
          <div className="space-y-2 text-center flex flex-col items-center">
            <h3 className="text-2xl font-bold text-slate-900 text-center">{isParsing ? "Reading your resume…" : "Upload resume (PDF)"}</h3>
            <p className="text-slate-400 font-medium text-center text-sm">Click to choose a file</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left items-start">
          <div className="space-y-8 text-left">
             <div className="gpt-card overflow-hidden text-left">
                <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                  <div className="space-y-1 text-left">
                    <span className="text-xs font-bold text-slate-400 text-left">File</span>
                    <h4 className="font-bold text-slate-900 text-left">{profile.name}</h4>
                  </div>
                  <button onClick={() => inputRef.current?.click()} className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Replace</button>
                  <input type="file" className="hidden" ref={inputRef} onChange={handleUpload} accept=".pdf" />
                </div>
                <div className="p-10 space-y-10">
                   <div className="space-y-4 text-left">
                     <h4 className="text-xs font-bold text-slate-400 text-left">Skills found</h4>
                     <div className="flex flex-wrap gap-2 text-left">
                       {profile.skills.map(s => (
                         <span key={s} className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg">
                           {s}
                         </span>
                       ))}
                     </div>
                   </div>

                   <div className="space-y-4 text-left pt-10 border-t border-slate-100">
                     <div className="flex justify-between items-center">
                       <h4 className="text-xs font-bold text-slate-400 text-left">Extracted text</h4>
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText(profile.resumeText);
                           
                         }}
                         className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
                       >
                         Copy Text
                       </button>
                     </div>
                     <div className="bg-white p-8 rounded-md border border-slate-200/60 max-h-80 overflow-y-auto shadow-sm">
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap text-left font-sans">
                          {profile.resumeText.slice(0, 1500)}...
                        </p>
                     </div>
                     <p className="text-xs text-slate-400 text-left">Shows the first 1,500 characters.</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="gpt-card h-full min-h-[600px] overflow-hidden flex flex-col border-slate-200/60">
             <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Your resume</span>
             </div>
             {pdfUrl ? (
               <iframe src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="flex-1 w-full border-none h-full grayscale-[0.2] opacity-90" />
             ) : (
               <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Preview only available after upload</div>
             )}
          </div>
        </div>
      )}
    </div>
  )
}

function SearchSection({ profile, onApply }: { profile: UserProfile | null, onApply: () => void }) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [applyingJob, setApplyingJob] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    setResults([]);
    setError(null);
    try {
      const queryEmbedding = await getEmbedding(query);
      
      const res = await fetch(`/api/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`, {
        signal: AbortSignal.timeout(10000) // 10s client-side timeout
      }).catch(() => null);
      
      let combined = [];
      if (res && res.ok) {
        combined = await res.json();
      } else {
        setError("Could not reach the job boards. Try again in a moment.");
        setIsSearching(false);
        return;
      }

      if (combined.length === 0) {
        setError("No listings found for your query. Try a broader search.");
        setIsSearching(false);
        return;
      }

      const ranked = await Promise.all(combined.map(async (j: any) => {
        try {
          const jE = await getEmbedding(j.description + ' ' + j.title)
          let score = cosineSimilarity(queryEmbedding, jE)
          if (profile) score = (score * 0.4) + (cosineSimilarity(profile.embedding, jE) * 0.6)
          
          // Location Boost
          if (location) {
            const locLower = location.toLowerCase();
            const jLocLower = (j.location || '').toLowerCase();
            if (jLocLower.includes(locLower)) {
              score += 0.2; // Significant boost for exact location match
            } else if (jLocLower.includes('remote')) {
              score += 0.05; // Slight boost for remote
            }
          }
          
          return { ...j, score }
        } catch (err) {
          console.error('Embedding error for job:', j.id, err);
          return { ...j, score: 0 };
        }
      }))
      setResults(ranked.sort((a, b) => b.score - a.score))
    } catch (err) {
      console.error('Search error:', err);
      setError("Something went wrong while ranking the results. Try again.");
    } finally { setIsSearching(false); }
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-12 text-left">
      <div className="max-w-3xl space-y-8 text-left">
        <div className="space-y-4 text-left">
          <h2 className="text-3xl font-bold text-slate-900 text-left">Listings</h2>
          <p className="text-xl text-slate-500 leading-relaxed max-w-2xl text-left">
            Searches Adzuna (US) and Arbeitnow, then ranks each listing by how closely it matches your search and your resume.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 p-3 bg-white rounded-md border border-slate-200 text-left">
          <div className="flex-1 flex items-center px-6 gap-4 text-left">
            <Search className="w-6 h-6 text-slate-400" />
            <input 
              type="text" placeholder="Job title or skill" 
              className="bg-transparent border-none focus:ring-0 w-full h-14 text-slate-900 font-bold text-lg placeholder:text-slate-400"
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-center px-6 gap-4 md:border-l border-slate-100 text-left">
            <MapPin className="w-6 h-6 text-slate-400" />
            <input 
              type="text" placeholder="City or remote" 
              className="bg-transparent border-none focus:ring-0 w-32 h-14 text-slate-900 font-bold text-lg placeholder:text-slate-400 text-sm"
              value={location} onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} disabled={isSearching} className="btn-gpt-primary px-10 h-14 bg-[#0f172a] rounded-md hover:shadow-lg transition-all active:scale-95">
            {isSearching ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "Search"}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-6 py-3 bg-amber-50 text-amber-700 rounded-md border border-amber-100 text-xs font-bold text-left">
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
        {results.length > 0 ? results.map(j => (
          <div key={j.id} className="gpt-card p-6 flex flex-col justify-between group hover:border-slate-400 transition-all text-left">
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-start text-left">
                <div className="px-4 py-1.5 bg-[#0f172a] text-white text-xs font-semibold rounded-full shadow-lg shadow-slate-200 text-left">
                  {Math.round(j.score * 100)}% match
                </div>
                <div className="text-xs font-semibold text-slate-400">{j.source}</div>
              </div>
              <div className="space-y-2 text-left">
                <h3 className="text-2xl font-semibold text-slate-900 leading-[1.1] text-left">{j.title}</h3>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 text-left">
                   {j.company} <div className="w-1 h-1 bg-slate-200 rounded-full" /> {j.location}
                </div>
              </div>
              <p className="text-sm text-slate-500 line-clamp-4 leading-relaxed text-left font-medium">{j.description}</p>
            </div>
            <div className="pt-6 flex gap-3 text-left">
              <button onClick={() => setSelected(j)} className="btn-gpt-secondary flex-1 text-xs font-semibold h-12">Tips</button>
              <button 
                onClick={() => setApplyingJob(j)}
                className="btn-gpt-apply flex-1 text-xs font-semibold h-12"
              >
                Apply
              </button>
            </div>
          </div>
        )) : (
          <p className="col-span-full py-16 text-slate-500 text-sm">{isSearching ? 'Fetching and ranking listings…' : profile ? 'Search for a role to see listings.' : 'Search for a role to see listings. Upload your resume on the Profile tab to rank them against it.'}</p>
        )}
      </div>

      {selected && <Modal j={selected} profile={profile} onClose={() => setSelected(null)} />}
      {applyingJob && <ApplyModal j={applyingJob} profile={profile} onApply={onApply} onClose={() => setApplyingJob(null)} />}
    </div>
  )
}

function HistorySection({ applications }: { applications: JobApplication[] }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12 text-left">
       <div className="space-y-4 text-left">
          <h2 className="text-3xl font-bold text-slate-900 text-left">Applications</h2>
          <p className="text-xl text-slate-500 leading-relaxed text-left">
            Every listing you have opened through Apply, newest first. Stored in this browser.
          </p>
       </div>

       <div className="gpt-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-6 text-xs font-semibold text-slate-400">Job Title</th>
                  <th className="px-8 py-6 text-xs font-semibold text-slate-400">Company</th>
                  <th className="px-8 py-6 text-xs font-semibold text-slate-400">Date</th>
                  <th className="px-8 py-6 text-xs font-semibold text-slate-400">Status</th>
                  <th className="px-8 py-6 text-xs font-semibold text-slate-400">Source</th>
                  <th className="px-8 py-6 text-xs font-semibold text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.length > 0 ? applications.sort((a,b) => b.appliedAt - a.appliedAt).map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-900 text-sm">{app.title}</div>
                      <div className="text-xs text-slate-400 font-medium">{app.location}</div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-600">{app.company}</td>
                    <td className="px-8 py-6 text-xs font-bold text-slate-400">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full border border-emerald-100">
                        {app.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-slate-400">{app.source}</td>
                    <td className="px-8 py-6">
                      <a href={app.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                        <ExternalLink size={16} />
                      </a>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 text-sm">No applications recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
       </div>
    </div>
  )
}

function ApplyModal({ j, profile, onApply, onClose }: { j: any, profile: UserProfile | null, onApply: () => void, onClose: () => void }) {
  const [step, setStep] = useState(4)
  const [isDone, setIsDone] = useState(false)
  const [isAutomating, setIsAutomating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)

  useEffect(() => {
    if (step < 4) {
      const t = setTimeout(() => setStep(s => s + 1), 800)
      return () => clearTimeout(t)
    } else {
      setIsDone(true)
    }
  }, [step])

  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && !isAutomating && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose, isAutomating]);

  const steps = [
    profile?.email ? `Uses ${[profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'your name'} and ${profile.email} from Settings` : "Add your name and email in Settings first",
    "Opens the listing in a headless browser",
    "Fills in the name and email fields it can find",
    "Saves the listing to Applications",
    "Opens the page so you can check and submit"
  ]

  const handleFinalStep = async () => {
    setIsAutomating(true);
    setError(null);
    await saveApplication({
      id: `app-${j.id}-${Date.now()}`,
      jobId: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      url: j.url,
      source: j.source,
      status: 'pending',
      appliedAt: Date.now()
    });

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobUrl: j.url,
          firstName: profile?.firstName,
          lastName: profile?.lastName,
          email: profile?.email
        })
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'The form could not be filled in');
      }

      const data = await res.json();
      if (data.screenshot) setScreenshot(`data:image/jpeg;base64,${data.screenshot}`);
      
      onApply();
      setTimeout(() => {
        onClose();
        window.open(j.url, '_blank');
      }, screenshot ? 2000 : 500);

    } catch (err: any) {
      console.error('Automation error:', err);
      setError(err.message || 'The form could not be filled in automatically. Open the listing and apply there.');
    } finally {
      setIsAutomating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60  animate-in fade-in duration-500">
       <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 text-left border border-slate-100">
          
          {/* Left Side: Status & Controls */}
          <div className="p-6 md:p-10 space-y-8 flex-1 border-r border-slate-50">
            <div className="flex justify-between items-start">
              <div className="h-6">
                 {isAutomating && <Loader2 className="w-6 h-6 animate-spin" />}
              </div>
              <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors" disabled={isAutomating}><X size={24} /></button>
            </div>

            <div className="space-y-2 text-left">
              <h3 className="text-3xl font-semibold text-slate-900 leading-none">
                {error ? "Could not fill the form" : isAutomating ? "Filling in the form…" : j.title}
              </h3>
              <p className="text-xs font-semibold text-slate-400">{j.company}</p>
            </div>

            {error ? (
              <div className="p-8 bg-rose-50 border border-rose-100 rounded-md space-y-4">
                <p className="text-xs font-bold text-rose-600 leading-relaxed">{error}</p>
                <button 
                  onClick={() => window.open(j.url, '_blank')}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-900 underline transition-colors"
                >
                  Open the listing
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {steps.map((s, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-4 transition-all duration-500",
                    step >= i ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  )}>
                    <div className={cn(
                      "w-1 h-1 rounded-full",
                      "bg-slate-400"
                    )} />
                    <span className={cn(
                      "text-xs font-semibold",
                      "text-slate-700"
                    )}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {isDone && !error && (
              <div className="animate-in slide-in-from-bottom-4 duration-500 pt-4">
                <button 
                  onClick={handleFinalStep}
                  disabled={isAutomating || !profile?.email}
                  className="w-full h-12 bg-[#b4532a] hover:bg-[#953f1d] text-white rounded-md flex items-center justify-center gap-3 text-sm font-semibold disabled:opacity-50"
                >
                  {isAutomating ? "Working…" : "Apply"} <ExternalLink size={18} />
                </button>
                <p className="mt-6 text-xs text-slate-400 font-bold text-center leading-relaxed">
                  {isAutomating ? "This can take up to 30 seconds." : "Nothing is submitted for you. You review and send it on the job site."}
                </p>
              </div>
            )}
          </div>

          {/* Right Side: Visual Render (Viewport) */}
          <div className="w-full md:w-[400px] bg-slate-50 p-8 flex flex-col border-l border-slate-100">
             <div className="flex items-center gap-2 mb-4 px-2">
                
                <div className="flex-1 h-6 bg-white rounded-md border border-slate-200 flex items-center px-3">
                   <span className="text-xs text-slate-400 truncate">{j.url}</span>
                </div>
             </div>
             
             <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-inner group">
                {screenshot ? (
                  <img src={screenshot} className="w-full h-full object-cover animate-in fade-in duration-1000" alt="Portal Preview" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                     {isAutomating ? (
                       <>
                         <div className="w-12 h-12 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                         <span className="text-xs font-bold text-slate-400">Opening the browser…</span>
                       </>
                     ) : (
                       <>
                                                  <span className="text-xs font-bold text-slate-400">The filled-in page appears here</span>
                       </>
                     )}
                  </div>
                )}
                
                
             </div>
             
             <div className="mt-4 px-2 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">Browser preview</span>
                <div className="flex items-center gap-1">
                   <span className="text-xs font-bold text-slate-400">{isAutomating ? "Running" : "Idle"}</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  )
}

function Modal({ j, profile, onClose }: { j: any, profile: UserProfile | null, onClose: () => void }) {
  const matchingSkills = React.useMemo(() => {
    if (!profile || !j.description) return [];
    const lowerDesc = j.description.toLowerCase();
    return profile.skills.filter(s => lowerDesc.includes(s.toLowerCase())).slice(0, 3);
  }, [profile, j]);

  const displaySkills = matchingSkills;
  const advice = displaySkills.map(s => `The listing mentions ${s}, and so does your resume. Put it near the top of your cover note.`);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const [copied, setCopied] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40  animate-in fade-in duration-300">
       <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow-xl p-6 md:p-10 space-y-8 animate-in zoom-in-95 duration-200 text-left border border-slate-100">
          <div className="space-y-6 text-left">
                          <div className="space-y-2 text-left">
               <h3 className="text-4xl font-semibold text-slate-900 leading-none text-left">{j.title}</h3>
               <p className="text-sm font-bold text-slate-400 text-left">{j.company}</p>
             </div>
          </div>

          <div className="space-y-8 text-left">
             <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-2 text-left">
               What to lead with
             </h4>
             <div className="space-y-4 text-left">
                {advice.length ? advice.map((a, i) => (
                  <p key={i} className="text-sm text-slate-700 leading-relaxed border-t border-slate-100 pt-3">{a}</p>
                )) : <p className="text-sm text-slate-500">{profile ? 'None of the skills found in your resume appear in this listing. Read it through for the requirements before applying.' : 'Upload your resume on the Profile tab to see which of your skills this listing asks for.'}</p>}
             </div>
          </div>

          <div className="flex gap-4 pt-4 text-left">
             <button onClick={onClose} className="btn-gpt-secondary flex-1 h-11 rounded-md text-xs font-semibold">Close</button>
             <button disabled={!advice.length} onClick={() => navigator.clipboard.writeText(advice.join('\n')).then(() => setCopied(true))} className="btn-gpt-primary flex-1 h-16 disabled:opacity-40">{copied ? 'Copied' : 'Copy tips'}</button>
          </div>
       </div>
    </div>
  )
}

function ConfigSection({ profile, onProfileUpdate }: { profile: UserProfile | null, onProfileUpdate: (p: UserProfile) => void }) {
  const [firstName, setFirstName] = useState(profile?.firstName || '')
  const [lastName, setLastName] = useState(profile?.lastName || '')
  const [email, setEmail] = useState(profile?.email || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await onProfileUpdate({ ...profile, firstName, lastName, email, updatedAt: Date.now() });
      
    } finally { setIsSaving(false); }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl space-y-16 text-left">
       <div className="space-y-4 text-left">
          <h2 className="text-3xl font-bold text-slate-900 text-left">Settings</h2>
          <p className="text-xl text-slate-500 leading-relaxed text-left">
            The details Apply fills in for you, and where your data lives.
          </p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="gpt-card p-6 space-y-6 text-left">
             <div className="text-xs font-semibold text-slate-900 flex items-center gap-2 text-left">How it works</div>
             <div className="space-y-6 text-left">
                <div className="flex justify-between items-center py-4 border-b border-slate-100 text-left">
                   <span className="text-xs text-slate-500">Matching</span>
                   <span className="text-xs text-slate-800 text-right">MiniLM embeddings, run in your browser</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-100 text-left">
                   <span className="text-xs text-slate-500">Storage</span>
                   <span className="text-xs text-slate-800 text-right">IndexedDB on this device. Name and email are sent only when you press Apply.</span>
                </div>
             </div>
          </div>

          <div className="gpt-card p-6 space-y-6 text-left">
             <div className="text-xs font-semibold text-slate-900 flex items-center gap-2 text-left">Your details</div>
             <div className="space-y-6 text-left">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-2 text-left">
                     <label className="text-xs font-semibold text-slate-400 text-left">First Name</label>
                     <input 
                      type="text" 
                      placeholder="First" 
                      className="w-full h-12 px-6 rounded-md bg-slate-50 border border-slate-200 text-sm font-bold focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                     />
                  </div>
                  <div className="space-y-2 text-left">
                     <label className="text-xs font-semibold text-slate-400 text-left">Last Name</label>
                     <input 
                      type="text" 
                      placeholder="Last" 
                      className="w-full h-12 px-6 rounded-md bg-slate-50 border border-slate-200 text-sm font-bold focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                     />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                   <label className="text-xs font-semibold text-slate-400 text-left">Email Address</label>
                   <input 
                    type="email" 
                    placeholder="you@example.com" 
                    className="w-full h-12 px-6 rounded-md bg-slate-50 border border-slate-200 text-sm font-bold focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                   />
                </div>
                
                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving || !profile}
                    className="w-full h-12 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors rounded-md disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button 
                    onClick={() => confirm('Delete your resume, details and application history from this browser?') && (indexedDB.deleteDatabase('auto-apply-db'), window.location.reload())}
                    className="w-full h-12 text-xs font-semibold text-rose-500 border border-rose-100 hover:bg-rose-50 transition-colors rounded-md"
                  >
                    Delete all local data
                  </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  )
}

export default App
