import { useState } from 'react'
import { useStore } from '../store/useStore'
import { buildDefaultCards } from '../store/useStore'
import {
  Network, BookOpen, Shield, Gamepad2, Brain, Briefcase, Code,
  Database, Globe, Server, Zap, Target, Star, Cpu, Plus,
  ChevronDown, ChevronUp, Check, X, Edit3, Trash2, Save,
  Clock, AlertTriangle, RotateCcw
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

// ─── Config ──────────────────────────────────────────────────────────────────

const ACCENT_COLORS = {
  blue:   { border: 'border-l-ops-blue',   text: 'text-ops-blue',   pill: 'bg-ops-blue/15 text-ops-blue border-ops-blue/40',   dot: 'bg-ops-blue'   },
  green:  { border: 'border-l-ops-green',  text: 'text-ops-green',  pill: 'bg-ops-green/15 text-ops-green border-ops-green/40',  dot: 'bg-ops-green'  },
  purple: { border: 'border-l-ops-purple', text: 'text-ops-purple', pill: 'bg-ops-purple/15 text-ops-purple border-ops-purple/40', dot: 'bg-ops-purple' },
  amber:  { border: 'border-l-ops-amber',  text: 'text-ops-amber',  pill: 'bg-ops-amber/15 text-ops-amber border-ops-amber/40',  dot: 'bg-ops-amber'  },
  cyan:   { border: 'border-l-ops-cyan',   text: 'text-ops-cyan',   pill: 'bg-ops-cyan/15 text-ops-cyan border-ops-cyan/40',    dot: 'bg-ops-cyan'   },
  lime:   { border: 'border-l-ops-lime',   text: 'text-ops-lime',   pill: 'bg-ops-lime/15 text-ops-lime border-ops-lime/40',    dot: 'bg-ops-lime'   },
  red:    { border: 'border-l-ops-red',    text: 'text-ops-red',    pill: 'bg-ops-red/15 text-ops-red border-ops-red/40',       dot: 'bg-ops-red'    },
}

const ICON_MAP = {
  Network: Network, BookOpen: BookOpen, Shield: Shield, Gamepad2: Gamepad2,
  Brain: Brain, Briefcase: Briefcase, Code: Code, Database: Database,
  Globe: Globe, Server: Server, Zap: Zap, Target: Target, Star: Star, Cpu: Cpu,
}

const STATUS_OPTS = ['Active','In Progress','On Hold','Planned','Completed','In Dev','Paused']
const STATUS_COLORS = {
  'Active':      'bg-ops-green/15 text-ops-green border-ops-green/40',
  'In Progress': 'bg-ops-amber/15 text-ops-amber border-ops-amber/40',
  'In Dev':      'bg-ops-amber/15 text-ops-amber border-ops-amber/40',
  'On Hold':     'bg-gray-500/15 text-gray-400 border-gray-500/40',
  'Paused':      'bg-gray-500/15 text-gray-400 border-gray-500/40',
  'Planned':     'bg-ops-blue/15 text-ops-blue border-ops-blue/40',
  'Completed':   'bg-ops-green/15 text-ops-green border-ops-green/40',
}

// ─── Note History ─────────────────────────────────────────────────────────────

function NoteHistory({ notes = [], onAdd, accentColor = 'green', compact }) {
  const [text, setText] = useState('')
  const [showAll, setShowAll] = useState(false)
  const c = ACCENT_COLORS[accentColor] || ACCENT_COLORS.green
  const visible = showAll ? notes : notes.slice(0, 3)

  const submit = () => {
    if (!text.trim()) return
    onAdd(text.trim())
    setText('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <textarea
          className="ops-textarea flex-1 min-h-[52px] text-sm"
          placeholder="Add a note… (timestamps automatically)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submit() }}
        />
        <button onClick={submit} className="ops-btn-primary flex-shrink-0 self-end px-3 py-2">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {notes.length === 0 && (
        <p className="text-[11px] text-gray-700 italic">No notes yet — add above.</p>
      )}

      <div className="space-y-1.5">
        {visible.map((n, i) => (
          <div key={n.id} className={`rounded p-2 border-l-2 bg-bunker-800 ${c.border.replace('border-l-', 'border-l-')}`}>
            <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">{n.text}</p>
            <p className="text-[9px] text-gray-600 mt-1">{format(parseISO(n.at), 'EEE MMM d, yyyy · HH:mm')}</p>
          </div>
        ))}
      </div>

      {notes.length > 3 && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="text-[10px] text-gray-600 hover:text-gray-300 flex items-center gap-1 transition-colors"
        >
          {showAll
            ? <><ChevronUp className="w-3 h-3" /> Show less</>
            : <><ChevronDown className="w-3 h-3" /> Show {notes.length - 3} older notes</>
          }
        </button>
      )}
    </div>
  )
}

// ─── Per-card Objectives ──────────────────────────────────────────────────────

function CardObjectives({ objectives = [], onAdd, onToggle, onDelete, onToggleCritical, accentColor }) {
  const [text, setText] = useState('')
  const [critical, setCritical] = useState(false)
  const active = objectives.filter(o => !o.done)
  const done   = objectives.filter(o =>  o.done)
  const [showDone, setShowDone] = useState(false)

  const submit = () => {
    if (!text.trim()) return
    onAdd(text.trim(), critical)
    setText('')
    setCritical(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="ops-input flex-1 text-sm"
          placeholder="Add objective…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <button
          onClick={() => setCritical(c => !c)}
          title="Mark critical"
          className={`ops-btn flex-shrink-0 border ${critical ? 'bg-ops-red/20 border-ops-red/60 text-ops-red' : 'border-bunker-600 text-gray-600 hover:border-gray-500'}`}
        >
          <AlertTriangle className="w-3 h-3" />
        </button>
        <button onClick={submit} className="ops-btn-primary flex-shrink-0">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1">
        {active.map(obj => (
          <div key={obj.id} className={`flex items-start gap-2 p-1.5 rounded group ${obj.critical ? 'bg-ops-red/5 border border-ops-red/20' : 'hover:bg-bunker-800'}`}>
            <button
              onClick={() => onToggle(obj.id)}
              className="w-4 h-4 rounded border border-bunker-500 hover:border-ops-green flex-shrink-0 mt-0.5 transition-colors"
            />
            <span className="text-xs text-gray-200 flex-1 leading-relaxed">{obj.text}</span>
            {obj.critical && <AlertTriangle className="w-3 h-3 text-ops-red flex-shrink-0 mt-0.5" />}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onToggleCritical(obj.id)} className="text-gray-600 hover:text-ops-red transition-colors">
                <AlertTriangle className="w-3 h-3" />
              </button>
              <button onClick={() => onDelete(obj.id)} className="text-gray-600 hover:text-ops-red transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {active.length === 0 && <p className="text-[11px] text-gray-700 italic">No active objectives.</p>}
      </div>

      {done.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone(s => !s)}
            className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-1"
          >
            <Check className="w-3 h-3" /> {done.length} completed
            {showDone ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showDone && done.map(obj => (
            <div key={obj.id} className="flex items-center gap-2 p-1.5 opacity-40 group">
              <button onClick={() => onToggle(obj.id)} className="w-4 h-4 rounded border border-ops-green bg-ops-green/20 flex-shrink-0 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-ops-green" />
              </button>
              <span className="text-xs text-gray-500 flex-1 line-through">{obj.text}</span>
              <button onClick={() => onDelete(obj.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3 text-gray-600 hover:text-ops-red" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Project / Client / Course Panel ─────────────────────────────────────────
// Owns the selector + scoped Notes AND Objectives for the active entry only

function ProjectPanel({ card, onUpdateCard, addXp, ts }) {
  const [tab, setTab]       = useState('notes')
  const [newName, setNewName] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const label    = card.projectLabel || 'Project'
  const projects = card.projects || []
  const activeProj = projects.find(p => p.id === card.activeProjectId) || projects[0]
  const c = ACCENT_COLORS[card.accentColor] || ACCENT_COLORS.green

  // ── helpers that write only to the active project ──────────────────────

  const updateActiveProj = (fields) => {
    onUpdateCard({
      projects: projects.map(p =>
        p.id === activeProj?.id ? { ...p, ...fields } : p
      )
    })
  }

  const addNote = (text) => {
    updateActiveProj({ notes: [{ id: crypto.randomUUID(), text, at: ts() }, ...(activeProj?.notes || [])] })
    addXp(5, `${label} note: ${text.slice(0, 30)}`)
  }

  const addObjective = (text, critical) => {
    updateActiveProj({
      objectives: [...(activeProj?.objectives || []),
        { id: crypto.randomUUID(), text, critical: !!critical, done: false, doneAt: null, at: ts() }
      ]
    })
    addXp(5, `${label} objective added`)
  }

  const toggleObjective = (id) => {
    const obj = (activeProj?.objectives || []).find(o => o.id === id)
    updateActiveProj({
      objectives: (activeProj?.objectives || []).map(o =>
        o.id === id ? { ...o, done: !o.done, doneAt: !o.done ? ts() : null } : o
      )
    })
    if (!obj?.done) addXp(obj?.critical ? 50 : 25, `Done: ${obj?.text?.slice(0, 30)}`)
  }

  const deleteObjective = (id) =>
    updateActiveProj({ objectives: (activeProj?.objectives || []).filter(o => o.id !== id) })

  const toggleCritical = (id) =>
    updateActiveProj({
      objectives: (activeProj?.objectives || []).map(o =>
        o.id === id ? { ...o, critical: !o.critical } : o
      )
    })

  // ── add / remove entries ───────────────────────────────────────────────

  const addEntry = () => {
    if (!newName.trim()) return
    const id = crypto.randomUUID()
    onUpdateCard({
      projects: [...projects, { id, name: newName.trim(), notes: [], objectives: [] }],
      activeProjectId: id,
    })
    setNewName('')
    setShowAdd(false)
    addXp(10, `New ${label}: ${newName}`)
  }

  const removeEntry = (id) => {
    const remaining = projects.filter(p => p.id !== id)
    onUpdateCard({ projects: remaining, activeProjectId: remaining[0]?.id || null })
  }

  const activeCount = (activeProj?.objectives || []).filter(o => !o.done).length

  // ── render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Selector row */}
      <div>
        <label className="ops-label">Active {label}</label>
        <div className="flex gap-2">
          <select
            className="ops-input flex-1 text-sm"
            value={card.activeProjectId || ''}
            onChange={e => { onUpdateCard({ activeProjectId: e.target.value }); setTab('notes') }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id} className="bg-bunker-800">{p.name}</option>
            ))}
          </select>
          <button onClick={() => setShowAdd(s => !s)} className="ops-btn-primary flex-shrink-0" title={`Add ${label}`}>
            <Plus className="w-3.5 h-3.5" />
          </button>
          {projects.length > 1 && activeProj && (
            <button onClick={() => removeEntry(activeProj.id)} className="ops-btn-danger flex-shrink-0" title={`Remove ${label}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {showAdd && (
          <div className="flex gap-2 mt-2">
            <input
              className="ops-input flex-1 text-sm"
              placeholder={`${label} name…`}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') addEntry(); if (e.key === 'Escape') setShowAdd(false) }}
            />
            <button onClick={addEntry} className="ops-btn-primary flex-shrink-0"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setShowAdd(false)} className="ops-btn-ghost flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      {/* Scoped tabs — only for the active project/client/course */}
      {activeProj && (
        <>
          <div className="flex border border-bunker-700 rounded overflow-hidden">
            <button
              onClick={() => setTab('notes')}
              className={`flex-1 py-1.5 text-xs font-semibold transition-colors
                ${tab === 'notes' ? `${c.pill} border-0` : 'text-gray-600 hover:text-gray-400'}`}
            >
              <Clock className="w-3 h-3 inline mr-1" />
              Notes ({(activeProj.notes || []).length})
            </button>
            <button
              onClick={() => setTab('objectives')}
              className={`flex-1 py-1.5 text-xs font-semibold transition-colors
                ${tab === 'objectives' ? `${c.pill} border-0` : 'text-gray-600 hover:text-gray-400'}`}
            >
              <Target className="w-3 h-3 inline mr-1" />
              Objectives ({activeCount})
            </button>
          </div>

          {tab === 'notes' && (
            <NoteHistory
              notes={activeProj.notes || []}
              onAdd={addNote}
              accentColor={card.accentColor}
            />
          )}

          {tab === 'objectives' && (
            <CardObjectives
              objectives={activeProj.objectives || []}
              onAdd={addObjective}
              onToggle={toggleObjective}
              onDelete={deleteObjective}
              onToggleCritical={toggleCritical}
              accentColor={card.accentColor}
            />
          )}
        </>
      )}
    </div>
  )
}

// ─── Inline field editor ──────────────────────────────────────────────────────

function InlineField({ label, value, onSave, type = 'text', min, max }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const save = () => { onSave(draft); setEditing(false) }
  const cancel = () => { setDraft(value); setEditing(false) }

  return (
    <div>
      <label className="ops-label">{label}</label>
      {editing ? (
        <div className="flex gap-1">
          <input
            type={type} min={min} max={max}
            className="ops-input flex-1 text-sm"
            value={draft}
            onChange={e => setDraft(type === 'number' ? Number(e.target.value) : e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
          />
          <button onClick={save} className="ops-btn-primary"><Check className="w-3 h-3" /></button>
          <button onClick={cancel} className="ops-btn-ghost"><X className="w-3 h-3" /></button>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 group cursor-pointer"
          onClick={() => { setDraft(value); setEditing(true) }}
        >
          <span className="text-sm text-gray-200">{String(value) || <span className="text-gray-600 italic">—</span>}</span>
          <Edit3 className="w-3 h-3 text-gray-700 group-hover:text-ops-green transition-colors" />
        </div>
      )}
    </div>
  )
}

// ─── Add New Card Modal ───────────────────────────────────────────────────────

const ICON_OPTS = ['Network','BookOpen','Shield','Gamepad2','Brain','Briefcase','Code','Database','Globe','Server','Zap','Target','Star','Cpu']
const COLOR_OPTS = ['green','blue','purple','amber','cyan','lime','red']

function AddCardModal({ onSave, onClose }) {
  const [title, setTitle]   = useState('')
  const [icon, setIcon]     = useState('Star')
  const [color, setColor]   = useState('green')
  const [status, setStatus] = useState('Active')

  const submit = () => {
    if (!title.trim()) return
    onSave({ title: title.trim(), icon, accentColor: color, status, hasProjects: false })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bunker-900 border border-bunker-600 rounded-lg w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-100">New SITREP Card</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-gray-200" /></button>
        </div>

        <div>
          <label className="ops-label">Title</label>
          <input className="ops-input" placeholder="e.g. Arista Study, Side Project…" value={title} onChange={e => setTitle(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>

        <div>
          <label className="ops-label">Status</label>
          <select className="ops-input" value={status} onChange={e => setStatus(e.target.value)}>
            {STATUS_OPTS.map(s => <option key={s} className="bg-bunker-800">{s}</option>)}
          </select>
        </div>

        <div>
          <label className="ops-label">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTS.map(name => {
              const I = ICON_MAP[name]
              return (
                <button
                  key={name}
                  onClick={() => setIcon(name)}
                  className={`p-2 rounded border transition-all ${icon === name ? 'border-ops-green bg-ops-green/10 text-ops-green' : 'border-bunker-600 text-gray-500 hover:border-gray-500'}`}
                  title={name}
                >
                  <I className="w-4 h-4" />
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="ops-label">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${ACCENT_COLORS[c]?.dot || 'bg-gray-500'} ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="ops-btn-ghost flex-1">Cancel</button>
          <button onClick={submit} className="ops-btn-primary flex-1">Create Card</button>
        </div>
      </div>
    </div>
  )
}

// ─── Individual SITREP Card ───────────────────────────────────────────────────

function SitrepCard({ card, onUpdate, onDelete, addXp, ts }) {
  const [tab, setTab] = useState('notes') // 'notes' | 'objectives'
  const [collapsed, setCollapsed] = useState(card.collapsed || false)
  const c = ACCENT_COLORS[card.accentColor] || ACCENT_COLORS.green
  const Icon = ICON_MAP[card.icon] || Star

  const set = (fields) => onUpdate({ ...card, ...fields })

  const addNote = (text) => {
    set({ notes: [{ id: crypto.randomUUID(), text, at: ts() }, ...(card.notes || [])] })
    addXp(5, `Note on ${card.title}`)
  }

  const addObjective = (text, critical) => {
    set({ objectives: [...(card.objectives || []), { id: crypto.randomUUID(), text, critical: !!critical, done: false, doneAt: null, at: ts() }] })
    addXp(5, `Objective on ${card.title}`)
  }

  const toggleObjective = (id) => {
    const obj = (card.objectives || []).find(o => o.id === id)
    set({ objectives: (card.objectives || []).map(o => o.id === id ? { ...o, done: !o.done, doneAt: !o.done ? ts() : null } : o) })
    if (!obj?.done) addXp(obj?.critical ? 50 : 25, `Objective done: ${obj?.text?.slice(0, 30)}`)
  }

  const deleteObjective = (id) => set({ objectives: (card.objectives || []).filter(o => o.id !== id) })
  const toggleCritical  = (id) => set({ objectives: (card.objectives || []).map(o => o.id === id ? { ...o, critical: !o.critical } : o) })

  // For hasProjects cards the objective count spans ALL projects (badge on header)
  const activeCount = card.hasProjects
    ? (card.projects || []).flatMap(p => p.objectives || []).filter(o => !o.done).length
    : (card.objectives || []).filter(o => !o.done).length

  return (
    <div className={`bg-bunker-900 border border-bunker-700 border-l-4 ${c.border} rounded-lg overflow-hidden`}>
      {/* Card header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-bunker-800">
        <Icon className={`w-4 h-4 flex-shrink-0 ${c.text}`} />
        <span className="text-sm font-bold text-gray-100 flex-1 truncate">{card.title}</span>

        {/* Status badge — clickable to cycle */}
        <div className="relative group">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border cursor-pointer select-none ${STATUS_COLORS[card.status] || STATUS_COLORS['Active']}`}>
            {card.status}
          </span>
          <div className="absolute right-0 top-6 z-10 hidden group-hover:block bg-bunker-800 border border-bunker-600 rounded-lg py-1 min-w-[120px] shadow-xl">
            {STATUS_OPTS.map(s => (
              <button
                key={s}
                onClick={() => set({ status: s })}
                className="block w-full text-left px-3 py-1 text-xs text-gray-300 hover:bg-bunker-700 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {activeCount > 0 && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.pill} border ml-1`}>{activeCount} obj</span>
        )}

        <button onClick={() => { setCollapsed(col => !col); set({ collapsed: !collapsed }) }} className="text-gray-600 hover:text-gray-300 transition-colors ml-1">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        <button onClick={() => onDelete(card.id)} className="text-gray-700 hover:text-ops-red transition-colors" title="Remove card">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Boeing-specific fields */}
          {card.id === 'boeing' && (
            <div className="grid grid-cols-2 gap-3 pb-2 border-b border-bunker-800">
              <div><label className="ops-label">Role</label><p className="text-sm text-gray-200">{card.role}</p></div>
              <div><label className="ops-label">L3 Advocate</label><p className={`text-sm font-semibold ${c.text}`}>{card.l3}</p></div>
            </div>
          )}

          {/* WGU-specific fields — program, term days, CUs (course is handled by ProjectPanel as Course selector) */}
          {card.id === 'wgu' && (
            <div className="space-y-3 pb-2 border-b border-bunker-800">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="ops-label">Program</label><p className="text-sm text-gray-300">{card.program}</p></div>
                <div>
                  <label className="ops-label">Days Left in Term</label>
                  <InlineField label="" value={card.daysLeftInTerm} type="number" min={0} max={365}
                    onSave={v => { set({ daysLeftInTerm: Number(v) }); addXp(3, 'Updated WGU term days') }} />
                </div>
              </div>
              <div>
                <label className="ops-label">Credit Units — {card.completedCUs} / {card.totalCUs}</label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-2.5 bg-bunker-700 rounded-full overflow-hidden">
                    <div className={`h-full ${c.dot} rounded-full xp-bar-fill`} style={{ width: `${Math.min((card.completedCUs/card.totalCUs)*100, 100)}%` }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <InlineField label="" value={card.completedCUs} type="number" min={0} max={card.totalCUs}
                      onSave={v => { set({ completedCUs: Number(v) }); addXp(10, 'Updated WGU CUs completed') }} />
                    <span className="text-gray-600 text-sm">/</span>
                    <InlineField label="" value={card.totalCUs} type="number" min={1}
                      onSave={v => set({ totalCUs: Number(v) })} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GDQuest-specific */}
          {card.id === 'gdquest' && (
            <div className="space-y-2 pb-2 border-b border-bunker-800">
              <InlineField label="Current Lesson" value={card.currentLesson || ''}
                onSave={v => { set({ currentLesson: v }); addXp(3, 'Updated GDQuest lesson') }} />
              <div>
                <label className="ops-label">Progress — {card.progressPercent || 0}%</label>
                <div className="h-2.5 bg-bunker-700 rounded-full overflow-hidden mb-1">
                  <div className={`h-full ${c.dot} rounded-full xp-bar-fill`} style={{ width: `${card.progressPercent || 0}%` }} />
                </div>
                <input type="range" min="0" max="100"
                  value={card.progressPercent || 0}
                  onChange={e => set({ progressPercent: Number(e.target.value) })}
                  className="w-full accent-ops-lime" />
              </div>
            </div>
          )}

          {/* Safe Days-specific */}
          {card.id === 'safedays' && (
            <div className="pb-2 border-b border-bunker-800">
              <label className="ops-label">Tagline</label>
              <p className="text-xs text-gray-400">{card.tagline}</p>
            </div>
          )}

          {/* GameDev-specific */}
          {card.id === 'gamedev' && (
            <div className="pb-2 border-b border-bunker-800">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="ops-label">Engine</label><p className="text-sm text-gray-200">{card.engine}</p></div>
                <InlineField label="Current Milestone" value={card.currentMilestone || ''}
                  onSave={v => { set({ currentMilestone: v }); addXp(5, 'GameDev milestone updated') }} />
              </div>
            </div>
          )}

          {/* Custom card editable title */}
          {!['boeing','wgu','gdquest','safedays','gamedev'].includes(card.id) && (
            <InlineField label="Status Detail" value={card.subtitle || ''}
              onSave={v => set({ subtitle: v })} />
          )}

          {/* Project / Client / Course panel — owns Notes + Objectives when hasProjects */}
          {card.hasProjects ? (
            <ProjectPanel card={card} onUpdateCard={(fields) => set(fields)} addXp={addXp} ts={ts} />
          ) : (
            <>
              {/* Card-level Notes | Objectives — only for cards without projects */}
              <div className="flex border border-bunker-700 rounded overflow-hidden">
                <button
                  onClick={() => setTab('notes')}
                  className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${tab === 'notes' ? `${c.pill} border-0` : 'text-gray-600 hover:text-gray-400'}`}
                >
                  <Clock className="w-3 h-3 inline mr-1" />
                  Notes ({(card.notes || []).length})
                </button>
                <button
                  onClick={() => setTab('objectives')}
                  className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${tab === 'objectives' ? `${c.pill} border-0` : 'text-gray-600 hover:text-gray-400'}`}
                >
                  <Target className="w-3 h-3 inline mr-1" />
                  Objectives ({activeCount})
                </button>
              </div>

              {tab === 'notes' && (
                <NoteHistory notes={card.notes || []} onAdd={addNote} accentColor={card.accentColor} />
              )}
              {tab === 'objectives' && (
                <CardObjectives
                  objectives={card.objectives || []}
                  onAdd={addObjective}
                  onToggle={toggleObjective}
                  onDelete={deleteObjective}
                  onToggleCritical={toggleCritical}
                  accentColor={card.accentColor}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main SITREP page ─────────────────────────────────────────────────────────

export default function Sitrep() {
  const { state, update, addXp, ts } = useStore()
  const cards = state.sitrep?.cards || []
  const [showAddModal, setShowAddModal] = useState(false)
  const now = new Date()

  const updateCard = (updatedCard) => {
    update(s => {
      s.sitrep.cards = s.sitrep.cards.map(c => c.id === updatedCard.id ? updatedCard : c)
    })
  }

  const deleteCard = (id) => {
    if (!confirm('Remove this card from SITREP?')) return
    update(s => { s.sitrep.cards = s.sitrep.cards.filter(c => c.id !== id) })
  }

  const addCard = (fields) => {
    const newCard = {
      id: crypto.randomUUID(),
      order: cards.length,
      collapsed: false,
      notes: [],
      objectives: [],
      projects: fields.hasProjects ? [] : undefined,
      activeProjectId: null,
      ...fields,
    }
    update(s => { s.sitrep.cards = [...s.sitrep.cards, newCard] })
    addXp(15, `New SITREP card: ${fields.title}`)
  }

  // All active objectives — from project objectives for hasProjects cards, card-level for others
  const allActiveObj = cards.flatMap(c => {
    if (c.hasProjects) {
      return (c.projects || []).flatMap(p =>
        (p.objectives || []).filter(o => !o.done).map(o => ({
          ...o,
          cardTitle: c.title,
          projectName: p.name,
          cardColor: c.accentColor,
        }))
      )
    }
    return (c.objectives || []).filter(o => !o.done).map(o => ({
      ...o, cardTitle: c.title, cardColor: c.accentColor,
    }))
  })
  const criticalObj = allActiveObj.filter(o => o.critical)

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {showAddModal && <AddCardModal onSave={addCard} onClose={() => setShowAddModal(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-ops-green tracking-widest">// SITREP</h1>
          <p className="text-xs text-gray-600 mt-0.5">{format(now, 'EEEE, MMMM d yyyy')} · {format(now, 'HH:mm')}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="ops-btn-primary flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Card
        </button>
      </div>

      {/* Critical objectives strip */}
      {criticalObj.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-ops-red/5 border border-ops-red/30 rounded-lg">
          <div className="flex items-center gap-1.5 w-full mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-ops-red" />
            <span className="text-[10px] text-ops-red uppercase tracking-wider font-semibold">Critical Objectives</span>
          </div>
          {criticalObj.map(o => (
            <div key={o.id} className="text-[11px] px-2 py-0.5 rounded border border-ops-red/40 bg-ops-red/10 text-ops-red">
              <span className="text-gray-500">[{o.cardTitle}{o.projectName ? ` / ${o.projectName}` : ''}]</span> {o.text}
            </div>
          ))}
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cards.map(card => (
          <SitrepCard
            key={card.id}
            card={card}
            onUpdate={updateCard}
            onDelete={deleteCard}
            addXp={addXp}
            ts={ts}
          />
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-16 ops-card">
          <Target className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No cards yet. Click <strong className="text-ops-green">Add Card</strong> to build your SITREP.</p>
        </div>
      )}

      {/* Active objectives summary */}
      {allActiveObj.length > 0 && (
        <div className="ops-card">
          <div className="section-title mb-3">
            <Target className="w-3.5 h-3.5 text-ops-green" />
            All Active Objectives
            <span className="ml-auto text-[10px] text-gray-600">{allActiveObj.length} across {cards.filter(c => (c.objectives||[]).some(o=>!o.done)).length} cards</span>
          </div>
          <div className="space-y-1">
            {allActiveObj.map(o => {
              const c = ACCENT_COLORS[o.cardColor] || ACCENT_COLORS.green
              return (
                <div key={o.id} className={`flex items-center gap-2 text-xs p-1.5 rounded ${o.critical ? 'bg-ops-red/5' : ''}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                  <span className="text-gray-500 flex-shrink-0">[{o.cardTitle}{o.projectName ? ` / ${o.projectName}` : ''}]</span>
                  <span className="text-gray-200 flex-1">{o.text}</span>
                  {o.critical && <AlertTriangle className="w-3 h-3 text-ops-red flex-shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
