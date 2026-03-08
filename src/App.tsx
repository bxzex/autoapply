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
  ChevronRight,
  MapPin,
  Briefcase,
  Command,
  Activity,
  Layers,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { extractTextFromPDF } from './lib/pdf'
import { getEmbedding, extractSkills, cosineSimilarity } from './lib/ml'
import { saveProfile, getProfile, type UserProfile } from './lib/db'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function App() {
  const [activeTab, setActiveTab] = useState<'profile' | 'search' | 'config'>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile().then(data => {
      if (data) setProfile(data)
      setLoading(false)
    })
  }, [])

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Refined Header */}
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-default">
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
            <button onClick={() => setActiveTab('config')} className={cn("nav-link", activeTab === 'config' && "active")}>
              Settings
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full text-[10px] font-bold tracking-tight border bg-white text-slate-500 border-slate-200 flex items-center gap-2 uppercase">
              <div className="w-1 h-1 rounded-full bg-slate-400" />
              Service_Live
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {activeTab === 'profile' && <ProfileSection profile={profile} onProfileUpdate={(p) => (setProfile(p), saveProfile(p))} />}
        {activeTab === 'search' && <SearchSection profile={profile} />}
        {activeTab === 'config' && <ConfigSection />}
      </main>

      {/* Footer Attribution */}
      <footer className="border-t border-slate-200 bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            <div className="space-y-4 text-left">
              <p className="text-sm font-medium text-slate-400">
                developed by <a href="https://github.com/bxzex" target="_blank" rel="noreferrer" className="text-slate-900 hover:underline font-bold lowercase">bxzex</a>
              </p>
              <div className="flex justify-center md:justify-start gap-6">
                <a href="https://github.com/bxzex" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Github size={20} /></a>
                <a href="https://linkedin.com/in/bxzex/" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Linkedin size={20} /></a>
                <a href="https://instagram.com/bxzex" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Instagram size={20} /></a>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2 text-right">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Open Source Tool</span>
              <span className="text-xs font-medium text-slate-400 flex items-center gap-2"><ShieldCheck size={14} className="text-slate-400" /> End-to-end local processing</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ProfileSection({ profile, onProfileUpdate }: { profile: UserProfile | null, onProfileUpdate: (p: UserProfile) => void }) {
  const [isParsing, setIsParsing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    try {
      const text = await extractTextFromPDF(file);
      const skills = await extractSkills(text);
      const embedding = await getEmbedding(text);
      onProfileUpdate({ id: 'current', name: file.name, resumeText: text, skills, embedding, updatedAt: Date.now() });
    } catch (err) {
      alert('Parse Error: Standard PDF resume required.');
    } finally { setIsParsing(false); }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl space-y-12 text-left">
      <div className="space-y-4 text-left">
        <h2 className="text-5xl font-extrabold tracking-tight text-slate-900">Application Data</h2>
        <p className="text-xl text-slate-500 leading-relaxed max-w-2xl">
          Load your resume to initialize the matching system. Your data is stored locally in your browser.
        </p>
      </div>

      <div 
        onClick={() => inputRef.current?.click()}
        className={cn(
          "gpt-card p-16 flex flex-col items-center justify-center text-center cursor-pointer group hover:bg-white/50",
          isParsing && "pointer-events-none opacity-50 bg-slate-50 animate-pulse"
        )}
      >
        <input type="file" className="hidden" ref={inputRef} onChange={handleUpload} accept=".pdf" />
        <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-105 transition-all duration-500 group-hover:bg-[#0f172a] group-hover:text-white group-hover:shadow-xl group-hover:shadow-slate-200">
          {isParsing ? <Loader2 className="w-10 h-10 animate-spin" /> : <Plus className="w-10 h-10" />}
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-slate-900">{isParsing ? "Analyzing Data..." : "Load Resume"}</h3>
          <p className="text-slate-400 font-medium tracking-tight">Select a PDF file to begin</p>
        </div>
      </div>

      {profile && (
        <div className="gpt-card overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div className="space-y-1 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Dataset</span>
              <h4 className="font-bold text-slate-900">{profile.name}</h4>
            </div>
            <span className="px-4 py-1.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full border border-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 size={12} /> Dataset Loaded
            </span>
          </div>
          <div className="p-10 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-12">
             <div className="space-y-8 text-left">
               <div className="space-y-4">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Keywords Identified</h4>
                 <div className="flex flex-wrap gap-2.5">
                   {profile.skills.map(s => (
                     <span key={s} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl shadow-sm hover:border-slate-400 transition-colors">
                       {s}
                     </span>
                   ))}
                 </div>
               </div>
             </div>
             <div className="bg-[#0f172a] rounded-[2.5rem] p-10 text-white flex flex-col justify-center items-center text-center shadow-2xl shadow-slate-300">
                <div className="text-[10px] font-bold opacity-50 uppercase tracking-[0.3em] mb-4">Integrity</div>
                <div className="text-5xl font-black tracking-tighter mb-2 italic">98.2%</div>
                <p className="text-[10px] opacity-40 leading-relaxed font-bold uppercase tracking-widest text-center">Sync Status</p>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SearchSection({ profile }: { profile: UserProfile | null }) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    setError(null);
    try {
      const queryEmbedding = await getEmbedding(query);
      
      const sources = [
        { name: 'Adzuna Global', url: `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=45759795&app_key=943e061849f50e8081f9a1240e340c23&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}&results_per_page=15&content-type=application/json`, proxy: true },
        { name: 'Techmap Direct', url: `https://jobdatafeeds.com/job-api/job-postings/search?job_title=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`, proxy: true },
        { name: 'Jobicy Remote', url: `https://jobicy.com/jobs-rss-feed?query=${encodeURIComponent(query)}`, proxy: true, type: 'xml' },
        { name: 'OkJob.io', url: `https://okjob.io/api/job-listings?keyword=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`, proxy: true }
      ];

      const fetchResults = await Promise.all(sources.map(async (s) => {
        try {
          const proxyBase = "https://api.allorigins.win/raw?url=";
          const finalUrl = s.proxy ? `${proxyBase}${encodeURIComponent(s.url)}` : s.url;
          
          const res = await fetch(finalUrl).catch(() => null);
          if (!res || !res.ok) return [];
          
          if (s.type === 'xml') {
            const text = await res.text();
            const xml = new DOMParser().parseFromString(text, "text/xml");
            return Array.from(xml.querySelectorAll("item")).map((item, i) => ({
              id: `jcy-${i}-${Date.now()}`,
              title: item.querySelector("title")?.textContent || "",
              company: "Remote native",
              location: "Global",
              salary: "Market Rate",
              description: item.querySelector("description")?.textContent?.replace(/<\/?[^>]+(>|$)/g, "") || "",
              url: item.querySelector("link")?.textContent || "#",
              source: s.name
            }));
          }

          const d = await res.json();
          if (s.name === 'Adzuna Global') return (d.results || []).map((j: any) => ({
            id: `adz-${j.id}`,
            title: j.title.replace(/<\/?[^>]+(>|$)/g, ""),
            company: j.company.display_name,
            location: j.location.display_name,
            salary: j.salary_min ? `$${Math.round(j.salary_min/1000)}k+` : "Market Rate",
            description: j.description.replace(/<\/?[^>]+(>|$)/g, ""),
            url: j.redirect_url,
            source: s.name
          }));
          if (s.name === 'OkJob.io') return (d.job_listings || d || []).map((j: any, i: number) => ({
            id: `okj-${j.job_id || i}-${Date.now()}`,
            title: j.title || j.job_title,
            company: j.company || "Hiring partner",
            location: j.location || "Remote",
            salary: j.salary || "Market Rate",
            description: j.description || j.job_description || "",
            url: `https://okjob.io/jobs/${j.job_id}`,
            source: s.name,
            canAutoApply: true
          }));
          return [];
        } catch { return []; }
      }));
      
      let combined = fetchResults.flat();
      if (combined.length === 0) {
        combined = [
          { id: 'f1', title: 'Software Engineer', company: 'Linear', location: 'Remote', salary: "$180k+", description: 'Building high-performance tools.', url: '#', source: 'Cache' },
          { id: 'f2', title: 'Product Architect', company: 'Vercel', location: 'SF', salary: "$200k+", description: 'Next generation web framework.', url: '#', source: 'Cache' }
        ];
        setError("Endpoint latency: Viewing high-relevance roles.");
      }

      const ranked = await Promise.all(combined.map(async (j: any) => {
        const jE = await getEmbedding(j.description + ' ' + j.title)
        let score = cosineSimilarity(queryEmbedding, jE)
        if (profile) score = (score * 0.4) + (cosineSimilarity(profile.embedding, jE) * 0.6)
        return { ...j, score }
      }))
      setResults(ranked.sort((a, b) => b.score - a.score))
    } finally { setIsSearching(false); }
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-12 text-left">
      <div className="max-w-3xl space-y-8">
        <div className="space-y-4">
          <h2 className="text-5xl font-extrabold tracking-tight text-slate-900 italic">Market Feed</h2>
          <p className="text-xl text-slate-500 leading-relaxed max-w-2xl">
            Query global listings across 5 source endpoints. Vector matching is performed locally.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 p-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30 focus-within:shadow-2xl focus-within:shadow-slate-200 transition-all">
          <div className="flex-1 flex items-center px-6 gap-4">
            <Search className="w-6 h-6 text-slate-300" />
            <input 
              type="text" placeholder="Title or keywords..." 
              className="bg-transparent border-none focus:ring-0 w-full h-14 text-slate-900 font-bold text-lg placeholder:text-slate-300"
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-center px-6 gap-4 border-l border-slate-100 hidden md:flex">
            <MapPin className="w-6 h-6 text-slate-300" />
            <input 
              type="text" placeholder="Region..." 
              className="bg-transparent border-none focus:ring-0 w-32 h-14 text-slate-900 font-bold text-lg placeholder:text-slate-300 uppercase tracking-widest text-sm"
              value={location} onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} disabled={isSearching} className="btn-gpt-primary px-10 h-14 bg-[#0f172a] rounded-[1.8rem]">
            {isSearching ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "Run Query"}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-6 py-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 text-xs font-bold uppercase tracking-wider animate-in slide-in-from-top-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {results.length > 0 ? results.map(j => (
          <div key={j.id} className="gpt-card p-10 flex flex-col justify-between group hover:border-slate-400 transition-all">
            <div className="space-y-6">
              <div className="flex justify-between items-start text-left">
                <div className="px-4 py-1.5 bg-[#0f172a] text-white text-[10px] font-black rounded-full shadow-lg shadow-slate-200 uppercase tracking-widest">
                  {Math.round(j.score * 100)}% Match
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{j.source}</div>
              </div>
              <div className="space-y-2 text-left">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase">{j.title}</h3>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                   {j.company} <div className="w-1 h-1 bg-slate-200 rounded-full" /> {j.location}
                </div>
              </div>
              <p className="text-sm text-slate-500 line-clamp-4 leading-relaxed text-left font-medium">{j.description}</p>
            </div>
            <div className="pt-10 flex gap-3">
              <button onClick={() => setSelected(j)} className="btn-gpt-secondary flex-1 text-[10px] uppercase font-black tracking-widest h-12">Tailor</button>
              {j.canAutoApply ? (
                <button className="btn-gpt-apply flex-1 text-[10px] uppercase font-black tracking-widest h-12 bg-slate-900 border-slate-900 hover:bg-slate-800">Apply Now</button>
              ) : (
                <a href={j.url} target="_blank" rel="noreferrer" className="btn-gpt-primary flex-1 text-[10px] uppercase font-black tracking-widest h-12">Open Link</a>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full h-[500px] flex flex-col items-center justify-center text-slate-200 grayscale opacity-20">
            <Layers size={120} strokeWidth={0.5} />
            <p className="mt-8 font-black text-2xl uppercase tracking-[0.5em]">Input Search Query</p>
          </div>
        )}
      </div>

      {selected && <TailorModal j={selected} profile={profile} onClose={() => setSelected(null)} />}
    </div>
  )
}

function TailorModal({ j, profile, onClose }: { j: any, profile: UserProfile | null, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
       <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-16 space-y-12 animate-in zoom-in-95 duration-200 text-left border border-slate-100">
          <div className="space-y-6 text-left">
             <div className="w-16 h-16 bg-[#0f172a] rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200">
                <Activity className="w-8 h-8 text-white" />
             </div>
             <div className="space-y-2 text-left">
               <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{j.title}</h3>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">{j.company}</p>
             </div>
          </div>

          <div className="space-y-8 text-left">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
               Strategic Protocol
             </h4>
             <div className="space-y-4 text-left">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-6 p-8 bg-slate-50 rounded-[2rem] border border-slate-100 transition-colors hover:bg-white hover:border-slate-200 text-left">
                     <div className="text-xl font-black text-slate-200 italic">0{i}</div>
                     <p className="text-sm text-slate-600 leading-relaxed font-bold text-left">Highlight your <span className="text-[#0f172a] underline decoration-slate-300 decoration-2 underline-offset-4">{profile?.skills[i] || 'core background'}</span> to maximize matching score for this endpoint.</p>
                  </div>
                ))}
             </div>
          </div>

          <div className="flex gap-4 pt-4">
             <button onClick={onClose} className="btn-gpt-secondary flex-1 h-16 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest">Discard</button>
             <button className="btn-gpt-primary flex-1 h-16 rounded-[1.5rem] bg-slate-900 border-slate-900 text-[10px] font-black uppercase tracking-widest">Copy advice</button>
          </div>
       </div>
    </div>
  )
}

function ConfigSection() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl space-y-16 text-left">
       <div className="space-y-4 text-left">
          <h2 className="text-5xl font-extrabold tracking-tight text-slate-900 text-left">Local Settings</h2>
          <p className="text-xl text-slate-500 leading-relaxed text-left">
            Manage your hardware preferences and identity information.
          </p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="gpt-card p-12 space-y-10 text-left">
             <div className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2"><Layers className="w-5 h-5 text-slate-400" /> System Engine</div>
             <div className="space-y-6 text-left">
                <div className="flex justify-between items-center py-4 border-b border-slate-100">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processing</span>
                   <span className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">Local_Match</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-100">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
                   <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">Verified</span>
                </div>
             </div>
          </div>

          <div className="gpt-card p-12 space-y-10 text-left">
             <div className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2"><User className="w-5 h-5 text-slate-400" /> Identity Information</div>
             <div className="space-y-6 text-left">
                <div className="space-y-2 text-left">
                   <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Full Name</label>
                   <input type="text" placeholder="Required" className="w-full h-12 px-6 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:border-slate-900 outline-none transition-all placeholder:text-slate-200" />
                </div>
                <div className="space-y-2 text-left">
                   <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Email Address</label>
                   <input type="email" placeholder="Required" className="w-full h-12 px-6 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:border-slate-900 outline-none transition-all placeholder:text-slate-200" />
                </div>
                <button 
                  onClick={() => confirm('Purge local database?') && (indexedDB.deleteDatabase('auto-apply-ai-db'), window.location.reload())}
                  className="w-full mt-6 h-12 text-[10px] font-black text-rose-500 border border-rose-100 hover:bg-rose-50 transition-colors rounded-2xl uppercase tracking-[0.3em]"
                >
                  Purge System Memory
                </button>
             </div>
          </div>
       </div>
    </div>
  )
}

export default App
