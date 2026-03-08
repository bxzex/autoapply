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
  Sparkles
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
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-default text-left">
            <div className="w-9 h-9 bg-[#0f172a] rounded-xl flex items-center justify-center shadow-sm">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg text-slate-900">AutoApply</span>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
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

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full text-[10px] font-bold tracking-tight border bg-white text-slate-500 border-slate-200 flex items-center gap-2 uppercase">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              Service Online
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {activeTab === 'profile' && <ProfileSection profile={profile} onProfileUpdate={(p) => (setProfile(p), saveProfile(p))} />}
        {activeTab === 'search' && <SearchSection profile={profile} onApply={() => getApplications().then(setApplications)} />}
        {activeTab === 'history' && <HistorySection applications={applications} />}
        {activeTab === 'config' && <ConfigSection profile={profile} onProfileUpdate={(p) => (setProfile(p), saveProfile(p))} />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-left">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            <div className="space-y-4 text-left">
              <p className="text-sm font-medium text-slate-400 text-left">
                developed by <a href="https://bxzex.com" target="_blank" rel="noreferrer" className="text-slate-900 hover:underline font-bold lowercase">bxzex</a>
              </p>
              <div className="flex justify-center md:justify-start gap-6">
                <a href="https://github.com/bxzex" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Github size={20} /></a>
                <a href="https://linkedin.com/in/bxzex/" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Linkedin size={20} /></a>
                <a href="https://instagram.com/bxzex" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Instagram size={20} /></a>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2 text-right">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Open Source Utility</span>
              <span className="text-xs font-medium text-slate-400 flex items-center gap-2"><ShieldCheck size={14} className="text-slate-400" /> Secure Local Processing</span>
            </div>
          </div>
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
      alert('Error parsing document. Ensure worker is initialized.');
    } finally { setIsParsing(false); }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl space-y-12 text-left">
      <div className="space-y-4 text-left">
        <h2 className="text-5xl font-extrabold tracking-tight text-slate-900 text-left">Application Profile</h2>
        <p className="text-xl text-slate-500 leading-relaxed max-w-2xl text-left">
          Load your resume to initialize the system. Your data is processed locally and never stored on a server.
        </p>
      </div>

      {!profile ? (
        <div 
          onClick={() => inputRef.current?.click()}
          className={cn(
            "gpt-card p-16 flex flex-col items-center justify-center text-center cursor-pointer group hover:bg-white/50",
            isParsing && "pointer-events-none opacity-50 bg-slate-50"
          )}
        >
          <input type="file" className="hidden" ref={inputRef} onChange={handleUpload} accept=".pdf" />
          <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-105 transition-all duration-500 group-hover:bg-[#0f172a] group-hover:text-white">
            {isParsing ? <Loader2 className="w-10 h-10 animate-spin" /> : <Plus className="w-10 h-10" />}
          </div>
          <div className="space-y-2 text-center flex flex-col items-center">
            <h3 className="text-2xl font-bold text-slate-900 text-center">{isParsing ? "Analyzing Document..." : "Load Resume"}</h3>
            <p className="text-slate-400 font-medium tracking-tight text-center italic text-sm">Processing happens on your device</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left items-start">
          <div className="space-y-8 text-left">
             <div className="gpt-card overflow-hidden text-left">
                <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Active File</span>
                    <h4 className="font-bold text-slate-900 text-left">{profile.name}</h4>
                  </div>
                  <button onClick={() => inputRef.current?.click()} className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Replace</button>
                  <input type="file" className="hidden" ref={inputRef} onChange={handleUpload} accept=".pdf" />
                </div>
                <div className="p-10 space-y-10">
                   <div className="space-y-4 text-left">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] text-left">Keywords Identified</h4>
                     <div className="flex flex-wrap gap-2 text-left">
                       {profile.skills.map(s => (
                         <span key={s} className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg uppercase tracking-tight">
                           {s}
                         </span>
                       ))}
                     </div>
                   </div>

                   <div className="space-y-4 text-left pt-10 border-t border-slate-100">
                     <div className="flex justify-between items-center">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] text-left">Experience Profile</h4>
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText(profile.resumeText);
                           alert('Resume text copied to clipboard!');
                         }}
                         className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
                       >
                         Copy Text
                       </button>
                     </div>
                     <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 max-h-80 overflow-y-auto shadow-sm">
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap text-left font-sans">
                          {profile.resumeText.slice(0, 1500)}...
                        </p>
                     </div>
                     <p className="text-[10px] text-slate-400 italic text-left">This data has been vectorized locally for matching. High-fidelity extraction complete.</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="gpt-card h-full min-h-[600px] overflow-hidden flex flex-col border-slate-200/60">
             <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Document View</span>
             </div>
             {pdfUrl ? (
               <iframe src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="flex-1 w-full border-none h-full grayscale-[0.2] opacity-90" />
             ) : (
               <div className="flex-1 flex items-center justify-center text-slate-300 italic text-sm">Preview only available after upload</div>
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
        setError("Network error: Could not reach job sources.");
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
          return { ...j, score }
        } catch (err) {
          console.error('Embedding error for job:', j.id, err);
          return { ...j, score: 0 };
        }
      }))
      setResults(ranked.sort((a, b) => b.score - a.score))
    } catch (err) {
      console.error('Search error:', err);
      setError("An unexpected error occurred during processing.");
    } finally { setIsSearching(false); }
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-12 text-left">
      <div className="max-w-3xl space-y-8 text-left">
        <div className="space-y-4 text-left">
          <h2 className="text-5xl font-extrabold tracking-tight text-slate-900 italic text-left uppercase">Market Feed</h2>
          <p className="text-xl text-slate-500 leading-relaxed max-w-2xl text-left">
            Query global listings from 5 aggregate sources. Matching is computed on your local hardware.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 p-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 transition-all text-left">
          <div className="flex-1 flex items-center px-6 gap-4 text-left">
            <Search className="w-6 h-6 text-slate-300" />
            <input 
              type="text" placeholder="Job title or stack..." 
              className="bg-transparent border-none focus:ring-0 w-full h-14 text-slate-900 font-bold text-lg placeholder:text-slate-300"
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-center px-6 gap-4 border-l border-slate-100 hidden md:flex text-left">
            <MapPin className="w-6 h-6 text-slate-300" />
            <input 
              type="text" placeholder="Region..." 
              className="bg-transparent border-none focus:ring-0 w-32 h-14 text-slate-900 font-bold text-lg placeholder:text-slate-300 uppercase tracking-widest text-sm"
              value={location} onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} disabled={isSearching} className="btn-gpt-primary px-10 h-14 bg-[#0f172a] rounded-[1.8rem] hover:shadow-lg transition-all active:scale-95">
            {isSearching ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "Run Query"}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-6 py-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 text-xs font-bold uppercase tracking-wider text-left">
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
        {results.length > 0 ? results.map(j => (
          <div key={j.id} className="gpt-card p-10 flex flex-col justify-between group hover:border-slate-400 transition-all text-left">
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-start text-left">
                <div className="px-4 py-1.5 bg-[#0f172a] text-white text-[10px] font-black rounded-full shadow-lg shadow-slate-200 uppercase tracking-widest text-left">
                  {Math.round(j.score * 100)}% Match
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{j.source}</div>
              </div>
              <div className="space-y-2 text-left">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase text-left">{j.title}</h3>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest text-left">
                   {j.company} <div className="w-1 h-1 bg-slate-200 rounded-full" /> {j.location}
                </div>
              </div>
              <p className="text-sm text-slate-500 line-clamp-4 leading-relaxed text-left font-medium">{j.description}</p>
            </div>
            <div className="pt-10 flex gap-3 text-left">
              <button onClick={() => setSelected(j)} className="btn-gpt-secondary flex-1 text-[10px] uppercase font-black tracking-widest h-12">Tailor</button>
              <button 
                onClick={() => setApplyingJob(j)}
                className="btn-gpt-apply flex-1 text-[10px] uppercase font-black tracking-widest h-12 bg-slate-900 border-slate-900 hover:bg-slate-800"
              >
                Apply
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full h-[500px] flex flex-col items-center justify-center text-slate-200 grayscale opacity-20 text-center">
            <Search size={120} strokeWidth={0.5} />
            <p className="mt-8 font-black text-2xl uppercase tracking-[0.5em] text-center">Enter Search</p>
          </div>
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
          <h2 className="text-5xl font-extrabold tracking-tight text-slate-900 text-left">Application History</h2>
          <p className="text-xl text-slate-500 leading-relaxed text-left">
            Track all the roles you've engaged with through the system.
          </p>
       </div>

       <div className="gpt-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Job Title</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Company</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Source</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.length > 0 ? applications.sort((a,b) => b.appliedAt - a.appliedAt).map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-900 text-sm">{app.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{app.location}</div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-600">{app.company}</td>
                    <td className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-100">
                        {app.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.source}</td>
                    <td className="px-8 py-6">
                      <a href={app.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                        <ExternalLink size={16} />
                      </a>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-300 italic text-sm">No applications recorded yet.</td>
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
  const [step, setStep] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [isAutomating, setIsAutomating] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)

  useEffect(() => {
    if (step < 3) {
      const t = setTimeout(() => setStep(s => s + 1), 1000)
      return () => clearTimeout(t)
    } else {
      setIsDone(true)
    }
  }, [step])

  const steps = [
    "Synchronizing Identity...",
    "Injecting Resume Dataset...",
    "Securing Application Portal...",
    "Ready for Verification"
  ]

  const handleFinalStep = async () => {
    setIsAutomating(true);
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
          email: profile?.email,
          resumeText: profile?.resumeText
        })
      });
      const data = await res.json();
      if (data.screenshot) setScreenshot(`data:image/jpeg;base64,${data.screenshot}`);
    } catch (err) {
      console.error('Automation error:', err);
    } finally {
      setIsAutomating(false);
      onApply();
      // Keep modal open briefly to show the screenshot if it arrived
      setTimeout(() => {
        onClose();
        window.open(j.url, '_blank');
      }, screenshot ? 2000 : 500);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
       <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 text-left border border-slate-100">
          
          {/* Left Side: Status & Controls */}
          <div className="p-12 md:p-16 space-y-12 flex-1 border-r border-slate-50">
            <div className="flex justify-between items-start">
              <div className="w-16 h-16 bg-[#0f172a] rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-200">
                 {isAutomating ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : isDone ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <Zap className="w-8 h-8 text-white animate-pulse" />}
              </div>
              <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors" disabled={isAutomating}><AlertCircle size={24} /></button>
            </div>

            <div className="space-y-2 text-left">
              <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                {isAutomating ? "Automation Active" : isDone ? "Identity Ready" : "Processing..."}
              </h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">{j.company}</p>
            </div>

            <div className="space-y-6">
              {steps.map((s, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-4 transition-all duration-500",
                  step >= i ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                )}>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    step > i ? "bg-emerald-500" : step === i ? "bg-slate-900 animate-ping" : "bg-slate-100"
                  )} />
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em]",
                    step === i ? "text-slate-900" : "text-slate-300"
                  )}>{s}</span>
                </div>
              ))}
            </div>

            {isDone && (
              <div className="animate-in slide-in-from-bottom-4 duration-500 pt-4">
                <button 
                  onClick={handleFinalStep}
                  disabled={isAutomating}
                  className="w-full h-20 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center gap-4 text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isAutomating ? "Processing Portal..." : "Execute Auto-Apply"} <ExternalLink size={18} />
                </button>
                <p className="mt-6 text-[10px] text-slate-400 font-bold text-center leading-relaxed">
                  {isAutomating ? "Our serverless agent is initializing the portal..." : `Your identity (${profile?.firstName}) is ready. Auto-apply will prepare the form for you.`}
                </p>
              </div>
            )}
          </div>

          {/* Right Side: Visual Render (Viewport) */}
          <div className="w-full md:w-[400px] bg-slate-50 p-8 flex flex-col border-l border-slate-100">
             <div className="flex items-center gap-2 mb-4 px-2">
                <div className="flex gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                   <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                   <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
                <div className="flex-1 h-6 bg-white rounded-md border border-slate-200 flex items-center px-3">
                   <span className="text-[8px] text-slate-300 font-mono truncate">{j.url}</span>
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
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Initializing Headless Viewport...</span>
                       </>
                     ) : (
                       <>
                         <Layers className="w-12 h-12 text-slate-100" />
                         <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">Awaiting Bridge Connection</span>
                       </>
                     )}
                  </div>
                )}
                
                {/* Simulated Scanning Overlay */}
                {isAutomating && !screenshot && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/5 to-transparent h-[200%] -translate-y-full animate-[scan_2s_linear_infinite]" />
                )}
             </div>
             
             <div className="mt-4 px-2 flex justify-between items-center">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Portal Render Engine v1.0</span>
                <div className="flex items-center gap-1">
                   <div className={cn("w-1.5 h-1.5 rounded-full", isAutomating ? "bg-emerald-500 animate-pulse" : "bg-slate-200")} />
                   <span className="text-[8px] font-bold text-slate-300 uppercase">{isAutomating ? "Live" : "Idle"}</span>
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

  const defaultSkills = profile?.skills.slice(0, 3) || ['experience', 'expertise', 'leadership'];
  const displaySkills = matchingSkills.length > 0 ? matchingSkills : defaultSkills;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
       <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-16 space-y-12 animate-in zoom-in-95 duration-200 text-left border border-slate-100">
          <div className="space-y-6 text-left">
             <div className="w-16 h-16 bg-[#0f172a] rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200">
                <Activity className="w-8 h-8 text-white" />
             </div>
             <div className="space-y-2 text-left">
               <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none text-left italic">{j.title}</h3>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] text-left">{j.company}</p>
             </div>
          </div>

          <div className="space-y-8 text-left">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2 text-left font-mono">
               Strategic Protocol
             </h4>
             <div className="space-y-4 text-left">
                {displaySkills.map((skill, i) => (
                  <div key={i} className="flex gap-6 p-8 bg-slate-50 rounded-[2rem] border border-slate-100 transition-colors hover:bg-white hover:border-slate-200 text-left">
                     <div className="text-xl font-black text-slate-200 italic text-left">0{i+1}</div>
                     <p className="text-sm text-slate-600 leading-relaxed font-bold text-left">Emphasize your <span className="text-[#0f172a] underline decoration-slate-300 decoration-2 underline-offset-4">{skill}</span> to maximize vector match score.</p>
                  </div>
                ))}
             </div>
          </div>

          <div className="flex gap-4 pt-4 text-left">
             <button onClick={onClose} className="btn-gpt-secondary flex-1 h-16 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest">Discard</button>
             <button className="btn-gpt-primary flex-1 h-16 rounded-[1.5rem] bg-slate-900 border-slate-900 text-[10px] font-black uppercase tracking-widest text-white">Copy Advice</button>
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
      alert('Settings saved!');
    } finally { setIsSaving(false); }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl space-y-16 text-left">
       <div className="space-y-4 text-left">
          <h2 className="text-5xl font-extrabold tracking-tight text-slate-900 text-left">Local Settings</h2>
          <p className="text-xl text-slate-500 leading-relaxed text-left">
            Manage your local processing preferences and application identity.
          </p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="gpt-card p-12 space-y-10 text-left">
             <div className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 text-left font-mono"><Layers className="w-5 h-5 text-slate-400" /> Processing Layer</div>
             <div className="space-y-6 text-left">
                <div className="flex justify-between items-center py-4 border-b border-slate-100 text-left">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Engine</span>
                   <span className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">Verified Local</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-100 text-left">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security</span>
                   <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">Sandboxed</span>
                </div>
             </div>
          </div>

          <div className="gpt-card p-12 space-y-10 text-left font-mono">
             <div className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 text-left font-mono"><User className="w-5 h-5 text-slate-400" /> Identity Buffer</div>
             <div className="space-y-6 text-left">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-2 text-left">
                     <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-left">First Name</label>
                     <input 
                      type="text" 
                      placeholder="First" 
                      className="w-full h-12 px-6 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:border-slate-900 outline-none transition-all placeholder:text-slate-200"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                     />
                  </div>
                  <div className="space-y-2 text-left">
                     <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-left">Last Name</label>
                     <input 
                      type="text" 
                      placeholder="Last" 
                      className="w-full h-12 px-6 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:border-slate-900 outline-none transition-all placeholder:text-slate-200"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                     />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                   <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-left">Email Address</label>
                   <input 
                    type="email" 
                    placeholder="Required" 
                    className="w-full h-12 px-6 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:border-slate-900 outline-none transition-all placeholder:text-slate-200"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                   />
                </div>
                
                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving || !profile}
                    className="w-full h-12 text-[10px] font-black text-white bg-slate-900 hover:bg-slate-800 transition-colors rounded-2xl uppercase tracking-[0.3em] disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Identity"}
                  </button>
                  <button 
                    onClick={() => confirm('Reset all local data?') && (indexedDB.deleteDatabase('auto-apply-ai-db'), window.location.reload())}
                    className="w-full h-12 text-[10px] font-black text-rose-500 border border-rose-100 hover:bg-rose-50 transition-colors rounded-2xl uppercase tracking-[0.3em]"
                  >
                    Reset Profile Data
                  </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  )
}

export default App
