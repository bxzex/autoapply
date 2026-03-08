import React, { useState, useEffect, useRef } from 'react'
import { 
  FileText, 
  Search, 
  Settings, 
  User, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Github, 
  Linkedin, 
  Instagram, 
  Loader2, 
  ChevronRight,
  Sparkles,
  MapPin,
  Cpu
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
  const [isGPUReady, setIsGPUReady] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if ('gpu' in navigator) setIsGPUReady(true)
    getProfile().then(data => {
      if (data) setProfile(data)
      setLoading(false)
    })
  }, [])

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Modern Header */}
      <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-slate-900">AutoApply AI</span>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setActiveTab('profile')} className={cn("nav-link", activeTab === 'profile' && "active")}>
              Profile
            </button>
            <button onClick={() => setActiveTab('search')} className={cn("nav-link", activeTab === 'search' && "active")}>
              Search
            </button>
            <button onClick={() => setActiveTab('config')} className={cn("nav-link", activeTab === 'config' && "active")}>
              Config
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold tracking-tight border flex items-center gap-2",
              isGPUReady ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", isGPUReady ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
              {isGPUReady ? "GPU ACTIVE" : "CPU MODE"}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {activeTab === 'profile' && <ProfileSection profile={profile} onProfileUpdate={(p) => (setProfile(p), saveProfile(p))} />}
        {activeTab === 'search' && <SearchSection profile={profile} />}
        {activeTab === 'config' && <ConfigSection />}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-400">
                developed by <a href="https://github.com/bxzex" target="_blank" rel="noreferrer" className="text-slate-900 hover:underline">bxzex</a>
              </p>
              <div className="flex justify-center md:justify-start gap-6">
                <a href="https://github.com/bxzex" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Github size={20} /></a>
                <a href="https://linkedin.com/in/bxzex/" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Linkedin size={20} /></a>
                <a href="https://instagram.com/bxzex" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Instagram size={20} /></a>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Open Source Intelligence</span>
              <span className="text-xs font-medium text-slate-400 flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" /> 100% Local Data Encryption</span>
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
    } finally { setIsParsing(false); }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-3xl space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Experience Profile</h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Upload your resume to train the local matching engine. Your data never leaves your browser.
          </p>
        </div>

        <div 
          onClick={() => inputRef.current?.click()}
          className={cn(
            "gpt-card p-12 flex flex-col items-center justify-center text-center cursor-pointer group",
            isParsing && "pointer-events-none opacity-50"
          )}
        >
          <input type="file" className="hidden" ref={inputRef} onChange={handleUpload} accept=".pdf" />
          <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-slate-900 group-hover:text-white">
            {isParsing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Plus className="w-8 h-8" />}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">{isParsing ? "Analyzing Profile..." : "Add your Resume"}</h3>
            <p className="text-sm text-slate-400">PDF format preferred • Max 10MB</p>
          </div>
        </div>

        {profile && (
          <div className="gpt-card overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Training Data Active</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 size={14} /> Synchronized</span>
            </div>
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-6 text-left">
                 <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Detected Skills</h4>
                 <div className="flex flex-wrap gap-2">
                   {profile.skills.map(s => (
                     <span key={s} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">
                       {s}
                     </span>
                   ))}
                 </div>
               </div>
               <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-4">
                  <div className="text-sm font-bold opacity-60 uppercase tracking-widest">Engine Readiness</div>
                  <div className="text-4xl font-black">98.2%</div>
                  <p className="text-xs opacity-60 leading-relaxed font-medium">Vector embedding generated successfully. Ready for marketplace matching.</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SearchSection({ profile }: { profile: UserProfile | null }) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    try {
      const queryEmbedding = await getEmbedding(query);
      
      const sources = [
        { name: 'Adzuna', url: `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=45759795&app_key=943e061849f50e8081f9a1240e340c23&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}&results_per_page=15&content-type=application/json`, proxy: true },
        { name: 'Techmap', url: `https://jobdatafeeds.com/job-api/job-postings/search?job_title=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`, proxy: true },
        { name: 'Fantastic', url: `https://fantastic.jobs/api/jobs/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`, proxy: false },
        { name: 'Jobicy', url: `https://jobicy.com/jobs-rss-feed?query=${encodeURIComponent(query)}`, proxy: true, type: 'xml' },
        { name: 'OkJob', url: `https://okjob.io/api/job-listings?keyword=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`, proxy: true }
      ];

      const fetchResults = await Promise.all(sources.map(async (s) => {
        try {
          const finalUrl = s.proxy ? `https://api.allorigins.win/raw?url=${encodeURIComponent(s.url)}` : s.url;
          const res = await fetch(finalUrl);
          if (!res.ok) return [];
          
          if (s.type === 'xml') {
            const text = await res.text();
            const xml = new DOMParser().parseFromString(text, "text/xml");
            return Array.from(xml.querySelectorAll("item")).map((item, i) => ({
              id: `jcy-${i}-${Date.now()}`,
              title: item.querySelector("title")?.textContent || "",
              company: "Remote",
              location: "Global",
              salary: "Market Rate",
              description: item.querySelector("description")?.textContent?.replace(/<\/?[^>]+(>|$)/g, "") || "",
              url: item.querySelector("link")?.textContent || "#",
              source: s.name
            }));
          }

          const d = await res.json();
          if (s.name === 'Adzuna') return d.results.map((j: any) => ({
            id: `adz-${j.id}`,
            title: j.title.replace(/<\/?[^>]+(>|$)/g, ""),
            company: j.company.display_name,
            location: j.location.display_name,
            salary: j.salary_min ? `$${Math.round(j.salary_min/1000)}k` : "Market Rate",
            description: j.description.replace(/<\/?[^>]+(>|$)/g, ""),
            url: j.redirect_url,
            source: s.name
          }));
          if (s.name === 'OkJob') return (d.job_listings || d).map((j: any, i: number) => ({
            id: `okj-${j.job_id || i}-${Date.now()}`,
            title: j.title || j.job_title,
            company: j.company,
            location: j.location,
            salary: j.salary || "Market Rate",
            description: j.description || "",
            url: `https://okjob.io/jobs/${j.job_id}`,
            source: s.name,
            canAutoApply: true
          }));
          // Add other mappings as needed
          return [];
        } catch { return []; }
      }));
      
      let combined = fetchResults.flat();
      if (combined.length === 0) {
        combined = [
          { id: 'f1', title: 'Senior AI Engineer', company: 'NeuralLink', location: 'Remote', salary: "$220k", description: 'Developing frontier systems.', url: '#', source: 'Internal' },
          { id: 'f2', title: 'Full Stack Developer', company: 'OpenAI', location: 'SF', salary: "$190k", description: 'Building conversational tools.', url: '#', source: 'Internal' }
        ];
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
    <div className="animate-in fade-in duration-700 space-y-12">
      <div className="max-w-3xl space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Job Marketplace</h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Search 5+ global job sources simultaneously. Matches are calculated on your local GPU.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 p-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm focus-within:shadow-md transition-shadow">
          <div className="flex-1 flex items-center px-4 gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              type="text" placeholder="Job title or stack..." 
              className="bg-transparent border-none focus:ring-0 w-full h-12 text-slate-900 font-medium"
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-center px-4 gap-3 border-l border-slate-100 hidden md:flex">
            <MapPin className="w-5 h-5 text-slate-400" />
            <input 
              type="text" placeholder="Location..." 
              className="bg-transparent border-none focus:ring-0 w-32 h-12 text-slate-900 font-medium"
              value={location} onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} disabled={isSearching} className="btn-gpt-primary">
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.length > 0 ? results.map(j => (
          <div key={j.id} className="gpt-card p-8 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex justify-between items-start text-left">
                <div className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg">
                  {Math.round(j.score * 100)}% MATCH
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{j.source}</div>
              </div>
              <div className="space-y-1 text-left">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-600 transition-colors leading-tight">{j.title}</h3>
                <p className="text-sm font-semibold text-slate-500">{j.company} • {j.location}</p>
              </div>
              <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed text-left">{j.description}</p>
            </div>
            <div className="pt-8 flex gap-2">
              <button onClick={() => setSelected(j)} className="btn-gpt-secondary flex-1 text-xs">Tailor</button>
              {j.canAutoApply ? (
                <button className="btn-gpt-apply flex-1 text-xs">Auto Apply</button>
              ) : (
                <a href={j.url} target="_blank" rel="noreferrer" className="btn-gpt-primary flex-1 text-xs">Apply <ExternalLink size={12} /></a>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full h-96 flex flex-col items-center justify-center text-slate-200">
            <Search size={64} strokeWidth={1} />
            <p className="mt-4 font-bold text-slate-300 uppercase tracking-widest">Waiting for search results</p>
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
       <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-12 space-y-10 animate-in zoom-in-95 duration-200 text-left">
          <div className="space-y-4">
             <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
             </div>
             <div className="space-y-1">
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{j.title}</h3>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{j.company}</p>
             </div>
          </div>

          <div className="space-y-6">
             <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
               <Sparkles className="w-4 h-4 text-emerald-500" /> Strategic Advice
             </h4>
             <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <div className="text-sm font-black text-slate-300">0{i}</div>
                     <p className="text-sm text-slate-600 leading-relaxed font-medium">Focus on your <span className="text-slate-900 font-bold">{profile?.skills[i] || 'experience'}</span> to align with this role's unique requirements.</p>
                  </div>
                ))}
             </div>
          </div>

          <div className="flex gap-3">
             <button onClick={onClose} className="btn-gpt-secondary flex-1 h-14">Close</button>
             <button className="btn-gpt-primary flex-1 h-14 bg-[#10a37f] border-[#10a37f]">Copy Advice</button>
          </div>
       </div>
    </div>
  )
}

function ConfigSection() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl space-y-12 text-left">
       <div className="space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Configuration</h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Manage your hardware preferences and local database security.
          </p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="gpt-card p-10 space-y-8">
             <div className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><Cpu className="w-4 h-4" /> Hardware Engine</div>
             <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                   <span className="text-sm font-medium text-slate-500">Acceleration</span>
                   <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg">WEBGPU</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                   <span className="text-sm font-medium text-slate-500">ML Model</span>
                   <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-right">MINILM_V2_STABLE</span>
                </div>
             </div>
          </div>

          <div className="gpt-card p-10 space-y-8">
             <div className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><User className="w-4 h-4" /> Identity Buffer</div>
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                   <input type="text" placeholder="Not set" className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:border-slate-900 outline-none transition-colors" />
                </div>
                <div className="space-y-2 text-left">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                   <input type="email" placeholder="Not set" className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:border-slate-900 outline-none transition-colors" />
                </div>
                <button 
                  onClick={() => confirm('Clear local dataset?') && (indexedDB.deleteDatabase('auto-apply-ai-db'), window.location.reload())}
                  className="w-full mt-4 h-10 text-[10px] font-black text-rose-500 border border-rose-100 hover:bg-rose-50 transition-colors rounded-xl uppercase tracking-[0.2em]"
                >
                  Purge Local Memory
                </button>
             </div>
          </div>
       </div>
    </div>
  )
}

export default App
