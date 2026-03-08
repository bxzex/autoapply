import React, { useState, useEffect, useRef } from 'react'
import { Briefcase, FileText, Settings, Rocket, Upload, Search, CheckCircle2, Loader2, Target, ExternalLink } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { extractTextFromPDF } from './lib/pdf'
import { getEmbedding, extractSkills, cosineSimilarity } from './lib/ml'
import { saveProfile, getProfile, type UserProfile } from './lib/db'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Mock jobs for demonstration
const MOCK_JOBS = [
  { id: '1', title: 'Senior Frontend Engineer', company: 'TechFlow', location: 'Remote', description: 'Working with React, TypeScript, and Tailwind CSS. Focus on performance and UX.', url: '#' },
  { id: '2', title: 'Backend Developer', company: 'DataSystems', location: 'San Francisco, CA', description: 'Build scalable APIs using Node.js and PostgreSQL. Experience with Kubernetes and Docker required.', url: '#' },
  { id: '3', title: 'Full Stack Developer', company: 'Innovate AI', location: 'New York, NY', description: 'Python, React, and MongoDB. Building innovative AI solutions.', url: '#' },
  { id: '4', title: 'Product Designer', company: 'Designers.io', location: 'Remote', description: 'Create beautiful user interfaces and user experiences. Figma and UI/UX design skills.', url: '#' },
  { id: '5', title: 'ML Engineer', company: 'FutureTech', location: 'Austin, TX', description: 'Develop and deploy ML models. PyTorch, TensorFlow, and Python.', url: '#' },
]

function App() {
  const [activeTab, setActiveTab] = useState<'resume' | 'jobs' | 'settings'>('resume')
  const [isGPUReady, setIsGPUReady] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for WebGPU support
    if ('gpu' in navigator) {
      setIsGPUReady(true)
    }
    
    // Load profile from DB
    getProfile().then(data => {
      if (data) setProfile(data)
      setLoading(false)
    })
  }, [])

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile)
    saveProfile(updatedProfile)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold tracking-tight">Auto-Apply AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
              isGPUReady ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            )}>
              <div className={cn("w-2 h-2 rounded-full", isGPUReady ? "bg-green-500" : "bg-amber-500")} />
              {isGPUReady ? "WebGPU Enabled" : "CPU Fallback"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <nav className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('resume')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
              activeTab === 'resume' ? "bg-blue-600 text-white shadow-md" : "hover:bg-white dark:hover:bg-slate-900"
            )}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">My Profile & Resume</span>
          </button>
          <button 
            onClick={() => setActiveTab('jobs')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
              activeTab === 'jobs' ? "bg-blue-600 text-white shadow-md" : "hover:bg-white dark:hover:bg-slate-900"
            )}
          >
            <Briefcase className="w-5 h-5" />
            <span className="font-medium">Job Discovery</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
              activeTab === 'settings' ? "bg-blue-600 text-white shadow-md" : "hover:bg-white dark:hover:bg-slate-900"
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {activeTab === 'resume' && <ResumeSection profile={profile} onProfileUpdate={handleProfileUpdate} />}
          {activeTab === 'jobs' && <JobsSection profile={profile} />}
          {activeTab === 'settings' && <SettingsSection />}
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-slate-500">
        <p>Built with WebGPU & Transformers.js • 100% Local Processing</p>
      </footer>
    </div>
  )
}

function ResumeSection({ profile, onProfileUpdate }: { profile: UserProfile | null, onProfileUpdate: (p: UserProfile) => void }) {
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsParsing(true)
    try {
      const text = await extractTextFromPDF(file)
      const skills = await extractSkills(text)
      const embedding = await getEmbedding(text)
      
      const newProfile: UserProfile = {
        id: 'current',
        name: file.name.split('.')[0],
        resumeText: text,
        skills,
        embedding,
        updatedAt: Date.now()
      }
      
      onProfileUpdate(newProfile)
    } catch (err) {
      console.error('Error parsing resume:', err)
      alert('Failed to parse resume. Make sure it is a valid PDF.')
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-2xl font-semibold mb-2">My Profile</h2>
      <p className="text-slate-500 mb-6">Upload your resume and let AI extract your skills and experience.</p>
      
      <input 
        type="file" 
        accept=".pdf" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-950/50",
          isParsing ? "opacity-50 pointer-events-none" : "hover:border-blue-400"
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
            {isParsing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
          </div>
          <div>
            <p className="font-medium">{isParsing ? "Parsing your resume..." : "Drop your resume here"}</p>
            <p className="text-sm text-slate-500 mt-1">PDF format (Max 10MB)</p>
          </div>
          {!isParsing && (
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Browse Files
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          Parsed Information
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Status</p>
            <p className="font-medium">{profile ? `Last updated ${new Date(profile.updatedAt).toLocaleDateString()}` : "No resume uploaded"}</p>
          </div>
          <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Key Skills Detected</p>
            <div className="flex flex-wrap gap-2 mt-2">
               {profile && profile.skills.length > 0 ? (
                 profile.skills.map(skill => (
                   <span key={skill} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                     {skill}
                   </span>
                 ))
               ) : (
                 <span className="text-sm text-slate-400 italic">Skills will appear here after parsing</span>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function JobsSection({ profile }: { profile: UserProfile | null }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any | null>(null)
  
  const handleSearch = async () => {
    if (!query) return
    setIsSearching(true)
    
    try {
      // Simulate semantic search
      const queryEmbedding = await getEmbedding(query)
      
      const rankedJobs = await Promise.all(MOCK_JOBS.map(async job => {
        const jobEmbedding = await getEmbedding(job.description + ' ' + job.title)
        const score = cosineSimilarity(queryEmbedding, jobEmbedding)
        
        // Boost score if profile matches
        let matchScore = score;
        if (profile) {
           const profileMatch = cosineSimilarity(profile.embedding, jobEmbedding)
           matchScore = (score * 0.4) + (profileMatch * 0.6)
        }
        
        return { ...job, score: matchScore }
      }))
      
      setResults(rankedJobs.sort((a, b) => b.score - a.score))
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Job Discovery</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Type of job (e.g. Senior Frontend Developer)"
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
          </button>
        </div>
        {profile && (
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
            <Target className="w-3 h-3 text-blue-500" />
            Matching jobs based on your AI-parsed resume profile
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {results.length > 0 ? (
          results.map(job => (
            <div key={job.id} className="bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition-all hover:border-blue-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <h3 className="text-lg font-bold">{job.title}</h3>
                   <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                     {Math.round(job.score * 100)}% Match
                   </span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">{job.company} • {job.location}</p>
                <p className="text-sm text-slate-500 line-clamp-2 max-w-xl">{job.description}</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                 <button 
                   onClick={() => setSelectedJob(job)}
                   className="flex-1 md:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                 >
                    Tailor 
                 </button>
                 <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    Apply <ExternalLink className="w-3 h-3" />
                 </a>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border p-12 shadow-sm text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No searches yet</h3>
            <p className="text-slate-500">Enter a job title above to find opportunities matched by your local GPU.</p>
          </div>
        )}
      </div>

      {selectedJob && (
        <TailorModal job={selectedJob} profile={profile} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  )
}

function TailorModal({ job, profile, onClose }: { job: any, profile: UserProfile | null, onClose: () => void }) {
  const [isGenerating, setIsGenerating] = useState(true)
  const [advice, setAdvice] = useState<string[]>([])
  
  useEffect(() => {
    const generateAdvice = async () => {
      if (!profile) return
      
      // Simulate intelligent tailoring
      setTimeout(() => {
        const skillsInJob = job.description.match(/React|TypeScript|Node\.js|Python|AWS|Figma/gi) || []
        const missingSkills = skillsInJob.filter((s: string) => !profile.skills.some(ps => ps.toLowerCase() === s.toLowerCase()))
        
        const suggestions = [
          `Highlight your experience with ${profile.skills.slice(0, 3).join(', ')} in the first paragraph.`,
          `Emphasize projects that show performance optimization and UX focus.`,
          missingSkills.length > 0 ? `Consider mentioning any familiarity with ${missingSkills[0]} if applicable.` : `You have a strong skill match for this role.`
        ]
        
        setAdvice(suggestions)
        setIsGenerating(false)
      }, 1000)
    }
    
    generateAdvice()
  }, [job, profile])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b">
           <div className="flex justify-between items-center mb-1">
             <h2 className="text-xl font-bold">Tailor Application</h2>
             <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <Settings className="w-5 h-5 rotate-45" />
             </button>
           </div>
           <p className="text-sm text-slate-500">{job.title} at {job.company}</p>
        </div>
        
        <div className="p-6 space-y-4">
           {isGenerating ? (
             <div className="flex flex-col items-center gap-4 py-8">
               <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
               <p className="text-sm font-medium animate-pulse">AI is analyzing job description...</p>
             </div>
           ) : (
             <>
               <div className="space-y-3">
                 <h3 className="font-semibold flex items-center gap-2">
                   <Target className="w-4 h-4 text-blue-500" />
                   Strategic Recommendations
                 </h3>
                 <ul className="space-y-2">
                   {advice.map((item, i) => (
                     <li key={i} className="text-sm flex gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        {item}
                     </li>
                   ))}
                 </ul>
               </div>

               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">Pro Tip</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Auto-apply scripts work best when your profile is tailored. We recommend updating your headline to match the job title for higher relevance.
                  </p>
               </div>
             </>
           )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t flex gap-3">
           <button onClick={onClose} className="flex-1 py-2 font-medium rounded-lg border hover:bg-white dark:hover:bg-slate-900 transition-colors">
              Close
           </button>
           <button className="flex-1 py-2 font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Save as Draft
           </button>
        </div>
      </div>
    </div>
  )
}

function SettingsSection() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-2xl font-semibold mb-6">Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-3">Model Configuration</h3>
          <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Embedding Model</p>
                <p className="text-xs text-slate-500">Used for matching skills to job descriptions</p>
              </div>
              <code className="text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded border">Xenova/all-MiniLM-L6-v2</code>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Precision</p>
                <p className="text-xs text-slate-500">FP16 (WebGPU) if supported</p>
              </div>
              <span className="text-xs font-semibold text-blue-600">Optimized</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3">Job Search API (Optional)</h3>
          <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-4">
            <p className="text-xs text-slate-500">Enter your Adzuna API keys to search real jobs instead of mock data.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">App ID</label>
                <input type="text" className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-sm" placeholder="e.g. 5a1b2c3d" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">API Key</label>
                <input type="password" className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-sm" placeholder="••••••••" />
              </div>
            </div>
            <button className="text-xs text-blue-600 font-medium hover:underline">Where do I find these?</button>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3">Data Privacy</h3>
          <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
             <p className="text-sm text-slate-600 dark:text-slate-400">
               All processing happens on your local GPU. Your resume and personal data never leave your browser. This application runs entirely in your local storage.
             </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <button 
            className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
            onClick={() => {
              if (confirm('Clear all local data? This will remove your resume and settings.')) {
                indexedDB.deleteDatabase('auto-apply-ai-db')
                window.location.reload()
              }
            }}
          >
            Clear Local Storage
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
