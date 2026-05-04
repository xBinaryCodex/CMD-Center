import { useState } from 'react'
import { useStore } from '../store/useStore'
import { FlaskConical, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { format, parseISO, startOfDay, isToday, isYesterday, subDays, isAfter } from 'date-fns'

// Life areas — universal, not tied to any domain
const AREAS = ['Health','Mindset','Technical','Skill','Creative','Habits','Communication','Leadership','Personal']

const AREA_COLORS = {
  'Health':        'bg-ops-green/20 text-ops-green border-ops-green/30',
  'Mindset':       'bg-ops-cyan/20 text-ops-cyan border-ops-cyan/30',
  'Technical':     'bg-ops-blue/20 text-ops-blue border-ops-blue/30',
  'Skill':         'bg-ops-purple/20 text-ops-purple border-ops-purple/30',
  'Creative':      'bg-ops-amber/20 text-ops-amber border-ops-amber/30',
  'Habits':        'bg-ops-lime/20 text-ops-lime border-ops-lime/30',
  'Communication': 'bg-ops-cyan/20 text-ops-cyan border-ops-cyan/30',
  'Leadership':    'bg-red-500/20 text-red-400 border-red-500/30',
  'Personal':      'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

function JournalEntry({ entry, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="ops-card group">
      <div className="flex items-start gap-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs text-gray-500">
              {isToday(parseISO(entry.at)) ? 'Today' : isYesterday(parseISO(entry.at)) ? 'Yesterday' : format(parseISO(entry.at), 'EEE MMM d')}
              {' · '}{format(parseISO(entry.at), 'HH:mm')}
            </span>
            {entry.area && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${AREA_COLORS[entry.area] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                {entry.area}
              </span>
            )}
          </div>
          <p className={`text-sm text-gray-200 ${!open ? 'line-clamp-2' : ''}`}>{entry.what}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-600" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600" />}
          <button
            onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-600 hover:text-ops-red" />
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t border-bunker-700 pt-3">
          {entry.why && (
            <div>
              <div className="ops-label">Why it matters</div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{entry.why}</p>
            </div>
          )}
          {entry.improvement && (
            <div>
              <div className="ops-label">How to improve / action</div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{entry.improvement}</p>
            </div>
          )}
          {entry.lesson && (
            <div>
              <div className="ops-label">Lesson learned</div>
              <p className="text-sm text-ops-green whitespace-pre-wrap">{entry.lesson}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Kaizen() {
  const { state, update, addXp, ts } = useStore()
  const entries = state.kaizen || []

  const [what, setWhat]             = useState('')
  const [why, setWhy]               = useState('')
  const [improvement, setImprovement] = useState('')
  const [lesson, setLesson]         = useState('')
  const [area, setArea]             = useState('Personal')
  const [filter, setFilter]         = useState('all')

  const submit = () => {
    if (!what.trim()) return
    update(s => {
      s.kaizen = [{
        id: crypto.randomUUID(), what, why, improvement, lesson, area, at: ts()
      }, ...(s.kaizen || [])].slice(0, 500)
    })
    addXp(20, `Kaizen entry: ${what.slice(0, 40)}`)
    setWhat(''); setWhy(''); setImprovement(''); setLesson('')
  }

  const remove = (id) => update(s => { s.kaizen = s.kaizen.filter(e => e.id !== id) })

  const filtered = entries.filter(e => {
    if (filter === 'today') return isToday(parseISO(e.at))
    if (filter === '7d')    return isAfter(parseISO(e.at), subDays(new Date(), 7))
    if (filter !== 'all')   return e.area === filter
    return true
  })

  const streakDays = (() => {
    if (!entries.length) return 0
    let streak = 0
    let check = startOfDay(new Date())
    const daySet = new Set(entries.map(e => format(startOfDay(parseISO(e.at)), 'yyyy-MM-dd')))
    while (daySet.has(format(check, 'yyyy-MM-dd'))) {
      streak++
      check = subDays(check, 1)
    }
    return streak
  })()

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ops-cyan tracking-widest">// KAIZEN JOURNAL</h1>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{entries.length} entries</span>
          <span className="text-ops-amber">🔥 {streakDays}d streak</span>
        </div>
      </div>

      {/* New entry form */}
      <div className="ops-card-glow space-y-3">
        <div className="section-title"><Plus className="w-3.5 h-3.5 text-ops-cyan" /> New Entry</div>
        <div>
          <label className="ops-label">What happened / what did you observe? *</label>
          <textarea className="ops-textarea min-h-[70px]" value={what} onChange={e => setWhat(e.target.value)}
            placeholder="Describe the situation, what you noticed, what went well or not…" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="ops-label">Why does it matter?</label>
            <textarea className="ops-textarea min-h-[56px]" value={why} onChange={e => setWhy(e.target.value)}
              placeholder="Root cause, significance…" />
          </div>
          <div>
            <label className="ops-label">Improvement / Action</label>
            <textarea className="ops-textarea min-h-[56px]" value={improvement} onChange={e => setImprovement(e.target.value)}
              placeholder="What will you do differently?" />
          </div>
        </div>
        <div>
          <label className="ops-label">Lesson Learned (1 sentence)</label>
          <input className="ops-input" value={lesson} onChange={e => setLesson(e.target.value)}
            placeholder="The key takeaway…" onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <div>
          <label className="ops-label">Life Area</label>
          <div className="flex flex-wrap gap-1.5">
            {AREAS.map(a => (
              <button key={a} onClick={() => setArea(a)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all
                  ${area === a ? AREA_COLORS[a] : 'border-bunker-600 text-gray-600 hover:border-gray-500'}`}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <button onClick={submit} className="ops-btn-primary w-full">Log Entry (+20 XP)</button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all',   label: 'All' },
          { id: 'today', label: 'Today' },
          { id: '7d',    label: 'Last 7d' },
          ...AREAS.map(a => ({ id: a, label: a }))
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors
              ${filter === f.id ? 'border-ops-cyan/60 bg-ops-cyan/10 text-ops-cyan' : 'border-bunker-700 text-gray-600 hover:border-gray-500'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="ops-card text-center py-8">
            <FlaskConical className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No entries yet. Continuous improvement starts with awareness.</p>
          </div>
        )}
        {filtered.map(entry => (
          <JournalEntry key={entry.id} entry={entry} onDelete={remove} />
        ))}
      </div>
    </div>
  )
}
