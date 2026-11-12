'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Calendar, MapPin, ExternalLink, Sparkles, AlertCircle, Loader2, ArrowUpDown, Search, GraduationCap } from 'lucide-react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null

function HackathonTableContent() {
  const [hackathons, setHackathons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtering & Sorting state
  const [searchQuery, setSearchQuery] = useState('')
  const [nonDevOnly, setNonDevOnly] = useState(false)
  const [hideStudentOnly, setHideStudentOnly] = useState(false) // <--- New filter state
  const [sortField, setSortField] = useState<'title' | 'dates' | 'is_non_dev_friendly'>('dates')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    async function fetchData() {
      if (!supabase) {
        setError('Supabase credentials missing')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('hackathons')
        .select('*')
        .order('id', { ascending: false })

      if (error) {
        console.error('Error fetching hackathons:', error)
        setError('Failed to load hackathons from database.')
      } else {
        setHackathons(data || [])
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  // Handle sorting toggles
  const handleSort = (field: 'title' | 'dates' | 'is_non_dev_friendly') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Filter and Sort logic
  const filteredHackathons = hackathons.filter(h => {
    const matchesSearch = h.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.location?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesNonDev = nonDevOnly ? h.is_non_dev_friendly : true
    const matchesStudentFilter = hideStudentOnly ? !h.is_student_only : true

    return matchesSearch && matchesNonDev && matchesStudentFilter
  }).sort((a, b) => {
    let aVal = a[sortField] || ''
    let bVal = b[sortField] || ''
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-slate-400 gap-3">
        <Loader2 className="animate-spin" size={24} />
        <span>Loading hackathon database...</span>
      </div>
    )
  }

  if (error || !supabase) {
    return (
      <div className="max-w-md bg-slate-900 border border-red-500/50 rounded-xl p-6 text-center space-y-4 mx-auto">
        <div className="flex justify-center text-red-400">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-xl font-bold">Configuration Error</h1>
        <p className="text-sm text-slate-400">{error || 'Please check your Supabase environment variables.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl backdrop-blur-sm">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Search by title or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 transition">
            <input 
              type="checkbox"
              checked={hideStudentOnly}
              onChange={(e) => setHideStudentOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <GraduationCap size={14} className="text-blue-400" />
            Hide Student-Only
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 transition">
            <input 
              type="checkbox"
              checked={nonDevOnly}
              onChange={(e) => setNonDevOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <Sparkles size={14} className="text-purple-400" />
            Non-Dev Friendly Only
          </label>
        </div>
      </div>

      {/* Sortable List View Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 cursor-pointer hover:text-white transition" onClick={() => handleSort('title')}>
                  <div className="flex items-center gap-1.5">
                    Hackathon <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer hover:text-white transition" onClick={() => handleSort('dates')}>
                  <div className="flex items-center gap-1.5">
                    Dates <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="py-4 px-6">Location</th>
                <th className="py-4 px-6 cursor-pointer hover:text-white transition text-center" onClick={() => handleSort('is_non_dev_friendly')}>
                  <div className="flex items-center justify-center gap-1.5">
                    Tier <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredHackathons.map((h) => (
                <tr key={h.id} className="hover:bg-slate-800/40 transition group">
                  <td className="py-4 px-6 font-medium text-white max-w-xs truncate">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{h.title}</span>
                      {h.is_student_only && (
                        <span className="inline-flex items-center gap-1 bg-blue-950/80 text-blue-300 text-[10px] px-2 py-0.5 rounded-full border border-blue-800/80 shrink-0">
                          Student Only
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-300 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-500 shrink-0" />
                      <span>{h.dates || 'TBD'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-500 shrink-0" />
                      <span>{h.location || 'Online'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    {h.is_non_dev_friendly ? (
                      <span className="inline-flex items-center gap-1 bg-purple-950/80 text-purple-300 text-xs px-2.5 py-1 rounded-full border border-purple-800/80">
                        <Sparkles size={12} /> Non-Dev Friendly
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Standard</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <a 
                      href={h.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-blue-600/90 hover:bg-blue-500 text-white font-medium py-1.5 px-3 rounded-lg transition text-xs shadow-sm"
                    >
                      Register <ExternalLink size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredHackathons.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            No hackathons match your filter criteria.
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-500">
        Showing {filteredHackathons.length} of {hackathons.length} synchronized hackathons
      </div>
    </div>
  )
}

export default function HackathonFinder() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Hackathon & Ideathon Finder
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Browse, search, and filter live hackathons tailored for developers, product managers, and open builders.
          </p>
        </header>

        <Suspense fallback={
          <div className="flex justify-center items-center py-24 text-slate-400 gap-3">
            <Loader2 className="animate-spin" size={24} />
            <span>Loading interface...</span>
          </div>
        }>
          <HackathonTableContent />
        </Suspense>
      </div>
    </main>
  )
}