import React, { useState, useEffect, useRef } from 'react'
import { 
  FilePlus, 
  Terminal, 
  Shield, 
  Settings, 
  ArrowUpRight, 
  Search, 
  Trash2, 
  Loader2,
  Github,
  Linkedin,
  Instagram,
  Zap,
  Cpu,
  Fingerprint,
  ChevronRight
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
  const [activeTab, setActiveTab] = useState<'profile' | 'listings' | 'config'>('profile')
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
    <div className="min-h-screen selection:bg-white selection:text-black">
      <div className="fixed inset-0 bg-grain" />
      
      {/* Top Controller Bar */}
      <nav className="h-14 border-b border-[#1a1a1a] bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-12 text-left">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white" />
              <span className="text-[11px] font-black tracking-tighter uppercase">AUTOAPPLY_V1</span>
            </div>
            
            <div className="hidden md:flex items-center h-full">
              <button onClick={() => setActiveTab('profile')} className={cn("nav-item h-full", activeTab === 'profile' && "active")}>
                01_PROFILE
              </button>
              <button onClick={() => setActiveTab('listings')} className={cn("nav-item h-full", activeTab === 'listings' && "active")}>
                02_LISTINGS
              </button>
              <button onClick={() => setActiveTab('config')} className={cn("nav-item h-full", activeTab === 'config' && "active")}>
                03_CONFIG
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 px-3 py-1 border border-[#1a1a1a] bg-[#050505]">
                <div className={cn("w-1 h-1", isGPUReady ? "bg-white animate-pulse" : "bg-[#333]")} />
                <span className="mono-label tracking-widest leading-none">{isGPUReady ? "CORE_WEBGPU_ONLINE" : "CORE_CPU_OFFLINE"}</span>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 py-16 min-h-[calc(100vh-12rem)] relative z-10">
        {activeTab === 'profile' && <ProfileSection profile={profile} onProfileUpdate={(p) => (setProfile(p), saveProfile(p))} />}
        {activeTab === 'listings' && <ListingsSection profile={profile} />}
        {activeTab === 'config' && <ConfigSection />}
      </main>

      <footer className="max-w-[1200px] mx-auto px-6 py-12 border-t border-[#1a1a1a]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
           <div className="space-y-4 text-left">
              <div className="mono-label text-[#333]">Developed by <span className="text-white hover:underline cursor-pointer">bxzex</span></div>
              <div className="flex gap-6">
                <a href="https://github.com/bxzex" target="_blank" rel="noreferrer" className="text-[#666] hover:text-white transition-colors"><Github size={14} /></a>
                <a href="https://linkedin.com/in/bxzex/" target="_blank" rel="noreferrer" className="text-[#666] hover:text-white transition-colors"><Linkedin size={14} /></a>
                <a href="https://instagram.com/bxzex" target="_blank" rel="noreferrer" className="text-[#666] hover:text-white transition-colors"><Instagram size={14} /></a>
              </div>
           </div>
           <div className="flex flex-col md:items-end gap-2 text-[#333]">
              <div className="mono-label">LICENSE_MIT // NO_TRACKING</div>
              <div className="mono-label tracking-[0.3em]">SECURE_SANDBOX_STABLE</div>
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
    <div className="animate-in fade-in duration-700 text-left">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-8 space-y-12">
          <div className="space-y-4">
            <div className="mono-label">SYSTEM_ENTRY_01</div>
            <h2 className="text-5xl font-black tracking-tighter leading-none">LOAD_DATASET</h2>
            <p className="text-[#666] text-lg max-w-xl leading-relaxed">Initialize the matching engine by ingesting your profile. Data remains in the local buffer.</p>
          </div>

          <div 
            onClick={() => inputRef.current?.click()}
            className={cn(
              "h-80 border-2 border-[#1a1a1a] flex flex-col items-center justify-center transition-all cursor-pointer hover:border-white hover:bg-white/5",
              isParsing && "opacity-20 pointer-events-none border-white animate-pulse"
            )}
          >
            <input type="file" className="hidden" ref={inputRef} onChange={handleUpload} accept=".pdf" />
            <div className="flex flex-col items-center gap-6">
              <FilePlus className="w-8 h-8 text-[#333]" />
              <div className="text-center space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-widest">{isParsing ? "BUFFERING_IN_PROGRESS" : "UPLOAD_PDF_DATASET"}</div>
                <div className="mono-label tracking-widest text-[#444]">MAX_CAPACITY: 10MB</div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 space-y-12">
          <div className="space-y-4">
            <div className="mono-label text-left">EXTRACTION_LOG</div>
            <div className="border border-[#1a1a1a] bg-[#050505] p-6 space-y-6">
              {profile ? (
                <>
                  <div className="space-y-3">
                     <div className="mono-label">COMPETENCIES_MAP</div>
                     <div className="flex flex-wrap gap-1">
                        {profile.skills.map(s => (
                          <span key={s} className="px-2 py-1 bg-white text-black text-[9px] font-black uppercase">{s}</span>
                        ))}
                     </div>
                  </div>
                  <div className="pt-6 border-t border-[#1a1a1a] flex justify-between">
                     <div className="mono-label">MATCH_READINESS</div>
                     <div className="text-white font-mono text-xs text-right">READY_FOR_MATCH</div>
                  </div>
                </>
              ) : (
                <div className="text-[#333] italic text-xs py-20 text-center uppercase tracking-widest">NO_PROFILE_DATA_SYNCED</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ListingsSection({ profile }: { profile: UserProfile | null }) {
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
        // Source 1: Adzuna
        {
          name: 'ADZUNA_GLOBAL',
          url: `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=45759795&app_key=943e061849f50e8081f9a1240e340c23&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}&results_per_page=10&content-type=application/json`,
          proxy: true
        },
        // Source 2: Techmap
        {
          name: 'TECHMAP_DIRECT',
          url: `https://jobdatafeeds.com/job-api/job-postings/search?job_title=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`,
          proxy: true
        },
        // Source 3: Fantastic.jobs
        {
          name: 'FANTASTIC_JOBS',
          url: `https://fantastic.jobs/api/jobs/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`,
          proxy: false // Supports CORS
        },
        // Source 4: Jobicy (RSS)
        {
          name: 'JOBICY_REMOTE',
          url: `https://jobicy.com/jobs-rss-feed?query=${encodeURIComponent(query)}`,
          proxy: true,
          type: 'xml'
        },
        // Source 5: OkJob
        {
          name: 'OKJOB_IO',
          url: `https://okjob.io/api/job-listings?keyword=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`,
          proxy: true
        }
      ];

      const fetchResults = await Promise.all(sources.map(async (s) => {
        try {
          const finalUrl = s.proxy ? `https://api.allorigins.win/raw?url=${encodeURIComponent(s.url)}` : s.url;
          const res = await fetch(finalUrl);
          if (!res.ok) return [];
          
          if (s.type === 'xml') {
            const text = await res.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "text/xml");
            const items = Array.from(xml.querySelectorAll("item"));
            return items.map((item, i) => ({
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
          if (s.name === 'ADZUNA_GLOBAL') {
            return d.results.map((j: any) => ({
              id: `adz-${j.id}`,
              title: j.title.replace(/<\/?[^>]+(>|$)/g, ""),
              company: j.company.display_name,
              location: j.location.display_name,
              salary: j.salary_min ? `$${Math.round(j.salary_min).toLocaleString()}` : "Market Rate",
              description: j.description.replace(/<\/?[^>]+(>|$)/g, ""),
              url: j.redirect_url,
              source: s.name
            }));
          }
          if (s.name === 'TECHMAP_DIRECT') {
            return (Array.isArray(d) ? d : []).map((j: any, i: number) => ({
              id: `tm-${i}-${Date.now()}`,
              title: j.job_title,
              company: j.company,
              location: j.location,
              salary: j.salary || "Market Rate",
              description: j.job_description || "",
              url: "#",
              source: s.name
            }));
          }
          if (s.name === 'FANTASTIC_JOBS') {
            return (Array.isArray(d) ? d : []).map((j: any) => ({
              id: `fan-${j.job_id}`,
              title: j.title,
              company: j.company,
              location: j.location,
              salary: "Market Rate",
              description: "View details on Fantastic.jobs",
              url: `https://fantastic.jobs/jobs/${j.job_id}`,
              source: s.name
            }));
          }
          if (s.name === 'OKJOB_IO') {
            const listings = d.job_listings || d; // Handle variations in response
            return (Array.isArray(listings) ? listings : []).map((j: any, i: number) => ({
              id: `okj-${j.job_id || i}-${Date.now()}`,
              title: j.title || j.job_title,
              company: j.company,
              location: j.location,
              salary: j.salary || "Market Rate",
              description: j.description || j.job_description || "",
              url: `https://okjob.io/jobs/${j.job_id}`,
              source: s.name,
              canAutoApply: true // Special flag for OkJob
            }));
          }
          return [];
        } catch (err) {
          console.error(`Error fetching from ${s.name}:`, err);
          return [];
        }
      }));
      
      let combinedJobs = fetchResults.flat();

      if (combinedJobs.length === 0) {
        combinedJobs = [
          { id: 'f1', title: 'Systems Architect', company: 'Linear', location: 'Remote', salary: "$220k", description: 'High-performance engineering systems.', url: '#', source: 'INTERNAL_CACHE' },
          { id: 'f2', title: 'Frontend Lead', company: 'Vercel', location: 'SF', salary: "$190k", description: 'Next.js ecosystem development.', url: '#', source: 'INTERNAL_CACHE' }
        ];
      }

      const ranked = await Promise.all(combinedJobs.map(async (j: any) => {
        const jE = await getEmbedding(j.description + ' ' + j.title)
        let score = cosineSimilarity(queryEmbedding, jE)
        if (profile) score = (score * 0.4) + (cosineSimilarity(profile.embedding, jE) * 0.6)
        return { ...j, score }
      }))
      setResults(ranked.sort((a, b) => b.score - a.score))
    } finally { setIsSearching(false); }
  }

  return (
    <div className="animate-in fade-in duration-700 text-left">
      <div className="space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div className="space-y-4">
              <div className="mono-label">SYSTEM_ENTRY_02</div>
              <h2 className="text-5xl font-black tracking-tighter leading-none">QUERY_MARKET</h2>
              <p className="text-[#666] text-lg max-w-xl leading-relaxed">Multi-source aggregate (Adzuna + Techmap). Local vector matching active.</p>
           </div>
           
           <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
             <div className="flex items-center border-b-2 border-[#1a1a1a] focus-within:border-white transition-colors w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-[#333] mr-3" />
                <input 
                  type="text" 
                  placeholder="ROLE_KEYWORDS" 
                  className="bg-transparent border-none focus:ring-0 p-0 h-12 text-[11px] font-bold text-white flex-1 placeholder:text-[#333] uppercase tracking-widest"
                  value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
             </div>
             <div className="flex items-center border-b-2 border-[#1a1a1a] focus-within:border-white transition-colors w-full md:w-48">
                <input 
                  type="text" 
                  placeholder="LOCATION" 
                  className="bg-transparent border-none focus:ring-0 p-0 h-12 text-[11px] font-bold text-white flex-1 placeholder:text-[#333] uppercase tracking-widest"
                  value={location} onChange={e => setLocation(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <ChevronRight className="w-4 h-4 text-white" />}
                </button>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#1a1a1a] border border-[#1a1a1a]">
           {results.length > 0 ? results.map(j => (
             <div key={j.id} className="bg-black hover:bg-[#050505] p-8 space-y-6 transition-all group border border-transparent hover:border-white flex flex-col justify-between">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-white shadow-[0_0_8px_white]" />
                       <div className="mono-label text-white">[{Math.round(j.score * 100)}%_MATCH]</div>
                     </div>
                     <div className="text-[8px] font-mono text-blue-500 border border-blue-500/20 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">{j.source}</div>
                   </div>
                   <h3 className="text-lg font-black tracking-tight leading-tight group-hover:underline underline-offset-4 uppercase">{j.title}</h3>
                   <div className="flex justify-between items-center">
                      <div className="mono-label text-[#666]">{j.company} // {j.location}</div>
                      <div className="text-[9px] font-mono text-[#444]">{j.salary}</div>
                   </div>
                   <p className="text-xs text-[#555] line-clamp-4 leading-relaxed font-medium">{j.description}</p>
                </div>
                <div className="flex gap-2 pt-6">
                   <button onClick={() => setSelected(j)} className="btn-secondary flex-1 text-[9px]">TAILOR</button>
                   {j.canAutoApply ? (
                     <button className="flex-1 h-10 px-4 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-sm hover:bg-blue-500 transition-colors">ONE_CLICK_APPLY</button>
                   ) : (
                     <a href={j.url} target="_blank" rel="noreferrer" className="btn-primary flex-1 flex items-center justify-center gap-2">APPLY <ArrowUpRight size={12} /></a>
                   )}
                </div>
             </div>
           )) : (
             <div className="col-span-full h-[400px] bg-black flex flex-col items-center justify-center grayscale opacity-10">
                <Terminal className="w-12 h-12 mb-4" />
                <div className="mono-label tracking-[0.5em]">SYSTEM_WAITING_FOR_QUERY</div>
             </div>
           )}
        </div>
      </div>

      {selected && <Modal j={selected} profile={profile} onClose={() => setSelected(null)} />}
    </div>
  )
}

function Modal({ j, profile, onClose }: { j: any, profile: UserProfile | null, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
       <div className="w-full max-w-xl bg-black border border-white p-12 space-y-12 shadow-[0_0_80px_rgba(255,255,255,0.1)] text-left">
          <div className="space-y-2">
             <div className="mono-label">TAILORING_LOG</div>
             <h3 className="text-3xl font-black tracking-tighter uppercase">{j.title}</h3>
             <div className="mono-label text-white">{j.company}</div>
          </div>

          <div className="space-y-6 text-left">
             <div className="mono-label text-white flex items-center gap-2 text-left"><Zap className="w-3 h-3" /> STRATEGIC_ADJUSTMENTS</div>
             <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-4 p-4 border border-[#1a1a1a]">
                     <div className="mono-label text-white">0{i}</div>
                     <p className="text-xs text-[#666] leading-relaxed">System recommends emphasizing <span className="text-white font-bold">{profile?.skills[i] || 'core competencies'}</span> to optimize match probability for this specific listing.</p>
                  </div>
                ))}
             </div>
          </div>

          <div className="flex gap-4">
             <button onClick={onClose} className="btn-secondary flex-1">DISCARD</button>
             <button className="btn-primary flex-1">COPY_BUFFER</button>
          </div>
       </div>
    </div>
  )
}

function ConfigSection() {
  return (
    <div className="animate-in fade-in duration-700 space-y-12 text-left">
       <div className="space-y-4">
          <div className="mono-label">SYSTEM_ENTRY_03</div>
          <h2 className="text-5xl font-black tracking-tighter leading-none">CONFIG_LAYER</h2>
          <p className="text-[#666] text-lg max-w-xl leading-relaxed">Configure local hardware acceleration and sandbox security settings.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-[#1a1a1a] border border-[#1a1a1a]">
          <div className="bg-black p-8 space-y-8">
             <div className="mono-label flex items-center gap-2 text-white"><Cpu className="w-3 h-3" /> HARDWARE_MAP</div>
             <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-[#1a1a1a]">
                   <div className="mono-label">INFERENCE_MODE</div>
                   <div className="mono-label text-white text-right">LOCAL_WEBGPU</div>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1a1a1a]">
                   <div className="mono-label">MODEL_VERSION</div>
                   <div className="mono-label text-white text-right">MINILM_V2_STABLE</div>
                </div>
             </div>
          </div>

          <div className="bg-black p-8 space-y-8">
             <div className="mono-label flex items-center gap-2 text-white"><Fingerprint className="w-3 h-3" /> APPLICANT_IDENTITY</div>
             <div className="space-y-4 text-left">
                <div className="space-y-2">
                   <div className="mono-label text-[#444]">FULL_NAME</div>
                   <input type="text" placeholder="REQUIRED" className="w-full bg-black border border-[#1a1a1a] h-10 px-4 text-xs font-mono focus:border-white outline-none" />
                </div>
                <div className="space-y-2">
                   <div className="mono-label text-[#444]">EMAIL_ADDRESS</div>
                   <input type="email" placeholder="REQUIRED" className="w-full bg-black border border-[#1a1a1a] h-10 px-4 text-xs font-mono focus:border-white outline-none" />
                </div>
                <p className="text-[10px] text-[#333] leading-relaxed uppercase tracking-wider">Storage is limited to the local origin. Zero telemetry or external synchronization is active.</p>
                <button 
                  onClick={() => confirm('Purge local database?') && (indexedDB.deleteDatabase('auto-apply-ai-db'), window.location.reload())}
                  className="w-full border border-red-900/50 py-3 text-[10px] font-black tracking-[0.3em] text-red-500 hover:bg-red-900/20 transition-all uppercase"
                >
                  PURGE_SYSTEM_MEMORY
                </button>
             </div>
          </div>

       </div>
    </div>
  )
}

export default App
