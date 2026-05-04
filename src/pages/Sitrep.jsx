import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, buildDefaultCards } from '../store/useStore'
import {
  Network, BookOpen, Shield, Gamepad2, Brain, Briefcase, Code,
  Database, Globe, Server, Zap, Target, Star, Cpu, Plus,
  ChevronDown, ChevronUp, Check, X, Edit3, Trash2,
  Clock, AlertTriangle, CalendarDays,
} from 'lucide-react'
import { format, parseISO, isAfter, startOfDay } from 'date-fns'

// ─── Dynamic hex color helpers ────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = (hex || '#00ff88').replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function ac(hex) {
  const [r, g, b] = hexToRgb(hex)
  const rgb = `${r},${g},${b}`
  return {
    color:    `rgb(${rgb})`,
    bg12:     `rgba(${rgb},0.12)`,
    bg06:     `rgba(${rgb},0.06)`,
    bd30:     `rgba(${rgb},0.30)`,
    bd60:     `rgba(${rgb},0.60)`,
    // Inline style objects
    text:     { color: `rgb(${rgb})` },
    pill:     { backgroundColor: `rgba(${rgb},0.12)`, color: `rgb(${rgb})`, borderColor: `rgba(${rgb},0.40)` },
    activeTab:{ backgroundColor: `rgba(${rgb},0.12)`, color: `rgb(${rgb})` },
    dot:      { backgroundColor: `rgb(${rgb})` },
    bar:      { backgroundColor: `rgb(${rgb})` },
    leftBorder: { borderLeftColor: `rgb(${rgb})` },
    cardBorder: { borderLeftColor: `rgb(${rgb})`, borderLeftWidth: '4px' },
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ICON_MAP = {
  Network, BookOpen, Shield, Gamepad2, Brain, Briefcase,
  Code, Database, Globe, Server, Zap, Target, Star, Cpu,
}
const ICON_OPTS = Object.keys(ICON_MAP)

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

function NoteHistory({ notes = [], onAdd, hex }) {
  const a = ac(hex)
  const [text, setText] = useState('')
  const [showAll, setShowAll] = useState(false)
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
          placeholder="Add a note… (Ctrl+Enter to submit)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submit() }}
        />
        <button onClick={submit} className="ops-btn flex-shrink-0 self-end px-3 py-2 border rounded transition-all"
          style={{ backgroundColor: a.bg12, color: a.color, borderColor: a.bd30 }}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {notes.length === 0 && (
        <p className="text-[11px] text-gray-700 italic">No notes yet.</p>
      )}

      <div className="space-y-1.5">
        {visible.map(n => (
          <div key={n.id} className="rounded p-2 bg-bunker-800 border-l-2" style={a.leftBorder}>
            <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">{n.text}</p>
            <p className="text-[9px] text-gray-600 mt-1">{format(parseISO(n.at), 'EEE MMM d yyyy · HH:mm')}</p>
          </div>
        ))}
      </div>

      {notes.length > 3 && (
        <button onClick={() => setShowAll(s => !s)}
          className="text-[10px] text-gray-600 hover:text-gray-300 flex items-center gap-1 transition-colors">
          {showAll
            ? <><ChevronUp className="w-3 h-3" /> Show less</>
            : <><ChevronDown className="w-3 h-3" /> Show {notes.length - 3} older notes</>}
        </button>
      )}
    </div>
  )
}

// ─── Objectives ───────────────────────────────────────────────────────────────

function CardObjectives({ objectives = [], onAdd, onToggle, onDelete, onToggleCritical, hex }) {
  const [text, setText] = useState('')
  const [critical, setCritical] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const a = ac(hex)
  const active = objectives.filter(o => !o.done)
  const done   = objectives.filter(o =>  o.done)

  const submit = () => {
    if (!text.trim()) return
    onAdd(text.trim(), critical)
    setText('')
    setCritical(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className="ops-input flex-1 text-sm" placeholder="Add objective…"
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
        <button onClick={() => setCritical(c => !c)} title="Mark critical"
          className={`ops-btn flex-shrink-0 border rounded transition-colors
            ${critical ? 'bg-ops-red/20 border-ops-red/60 text-ops-red' : 'border-bunker-600 text-gray-600 hover:border-gray-500'}`}>
          <AlertTriangle className="w-3 h-3" />
        </button>
        <button onClick={submit} className="ops-btn flex-shrink-0 border rounded transition-all px-3"
          style={{ backgroundColor: a.bg12, color: a.color, borderColor: a.bd30 }}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1">
        {active.length === 0 && <p className="text-[11px] text-gray-700 italic">No active objectives.</p>}
        {active.map(obj => (
          <div key={obj.id}
            className={`flex items-start gap-2 p-1.5 rounded group
              ${obj.critical ? 'bg-ops-red/5 border border-ops-red/20' : 'hover:bg-bunker-800'}`}>
            <button onClick={() => onToggle(obj.id)}
              className="w-4 h-4 rounded border border-bunker-500 hover:border-ops-green flex-shrink-0 mt-0.5 transition-colors" />
            <span className="text-xs text-gray-200 flex-1 leading-relaxed">{obj.text}</span>
            {obj.critical && <AlertTriangle className="w-3 h-3 text-ops-red flex-shrink-0 mt-0.5" />}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onToggleCritical(obj.id)} className="text-gray-600 hover:text-ops-red"><AlertTriangle className="w-3 h-3" /></button>
              <button onClick={() => onDelete(obj.id)} className="text-gray-600 hover:text-ops-red"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <div>
          <button onClick={() => setShowDone(s => !s)}
            className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-1 mb-1">
            <Check className="w-3 h-3" /> {done.length} completed
            {showDone ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showDone && done.map(obj => (
            <div key={obj.id} className="flex items-start gap-2 p-1.5 opacity-50 group">
              <button onClick={() => onToggle(obj.id)}
                className="w-4 h-4 rounded border border-ops-green bg-ops-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 text-ops-green" />
              </button>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-500 line-through block">{obj.text}</span>
                {obj.doneAt && (
                  <span className="text-[9px] text-ops-green/60">
                    ✓ {format(parseISO(obj.doneAt), 'MMM d yyyy · HH:mm')}
                  </span>
                )}
              </div>
              <button onClick={() => onDelete(obj.id)} className="opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5">
                <Trash2 className="w-3 h-3 text-gray-600 hover:text-ops-red" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Events tab content ───────────────────────────────────────────────────────

function normalizeEvent(ev) {
  return {
    ...ev,
    startDate: ev.startDate || ev.date || '',
    startTime: ev.startTime || ev.time || '',
  }
}

function CardEvents({ cardId, hex }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const a = ac(hex)
  const today = startOfDay(new Date())

  const events = useMemo(() => {
    const raw = (state.calendarEvents || []).map(normalizeEvent)
    return raw
      .filter(ev => ev.subject === cardId && ev.startDate)
      .filter(ev => {
        try { return !isAfter(today, startOfDay(parseISO(ev.startDate))) || ev.startDate >= format(today, 'yyyy-MM-dd') }
        catch { return true }
      })
      .sort((a, b) => {
        const da = a.startDate + (a.startTime || '')
        const db = b.startDate + (b.startTime || '')
        return da < db ? -1 : da > db ? 1 : 0
      })
      .slice(0, 20)
  }, [state.calendarEvents, cardId])

  const PRIORITY_COLORS = { critical: '#ef4444', high: '#f59e0b', normal: '#6b7280', low: '#374151' }

  return (
    <div className="space-y-2">
      {/* Add Event shortcut */}
      <button
        onClick={() => navigate(`/calendar?new=1&subject=${cardId}`)}
        className="flex items-center gap-1.5 text-[10px] w-full justify-center border rounded px-3 py-1.5 transition-all"
        style={{ backgroundColor: a.bg06, color: a.color, borderColor: a.bd30 }}
      >
        <CalendarDays className="w-3 h-3" /> Add Event to Calendar
      </button>

      {events.length === 0 && (
        <p className="text-[11px] text-gray-700 italic">No upcoming events for this domain.</p>
      )}

      {events.map(ev => {
        const pColor = PRIORITY_COLORS[ev.priority] || PRIORITY_COLORS.normal
        return (
          <div key={ev.id} className="rounded p-2 bg-bunker-800 border-l-2 flex items-start gap-2" style={a.leftBorder}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: pColor }} />
                <p className="text-xs text-gray-200 font-medium truncate">{ev.title || 'Untitled Event'}</p>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {ev.startDate}
                {ev.endDate && ev.endDate !== ev.startDate ? ` → ${ev.endDate}` : ''}
                {!ev.allDay && ev.startTime ? ` · ${ev.startTime}${ev.endTime ? `–${ev.endTime}` : ''}` : ev.allDay ? ' · All day' : ''}
              </p>
              {ev.description && (
                <p className="text-[10px] text-gray-600 mt-0.5 truncate">{ev.description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Project / Client / Course / Module Panel ─────────────────────────────────

function ProjectPanel({ card, onUpdateCard, addXp, ts }) {
  const [tab, setTab]           = useState('notes')
  const [newName, setNewName]   = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [renamingProj, setRenamingProj]   = useState(false)
  const [projNameDraft, setProjNameDraft] = useState('')
  const [editingLabel, setEditingLabel]   = useState(false)
  const [labelDraft, setLabelDraft]       = useState('')
  const { state } = useStore()
  const a = ac(card.accentColor)
  const label    = card.projectLabel || 'Project'
  const projects = card.projects || []
  const activeProj = projects.find(p => p.id === card.activeProjectId) || projects[0]
  const activeCount = (activeProj?.objectives || []).filter(o => !o.done).length

  // Count upcoming events for this card
  const eventCount = useMemo(() => {
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd')
    return (state.calendarEvents || [])
      .map(normalizeEvent)
      .filter(ev => ev.subject === card.id && ev.startDate >= today)
      .length
  }, [state.calendarEvents, card.id])

  const updateActiveProj = (fields) =>
    onUpdateCard({ projects: projects.map(p => p.id === activeProj?.id ? { ...p, ...fields } : p) })

  const addNote = (text) => {
    updateActiveProj({ notes: [{ id: crypto.randomUUID(), text, at: ts() }, ...(activeProj?.notes || [])] })
    addXp(5, `${label} note`)
  }

  const addObjective = (text, critical) => {
    updateActiveProj({
      objectives: [...(activeProj?.objectives || []),
        { id: crypto.randomUUID(), text, critical: !!critical, done: false, doneAt: null, at: ts() }]
    })
    addXp(5, `${label} objective`)
  }

  const toggleObj = (id) => {
    const obj = (activeProj?.objectives || []).find(o => o.id === id)
    updateActiveProj({
      objectives: (activeProj?.objectives || []).map(o =>
        o.id === id ? { ...o, done: !o.done, doneAt: !o.done ? ts() : null } : o)
    })
    if (!obj?.done) addXp(obj?.critical ? 50 : 25, `Done: ${obj?.text?.slice(0, 30)}`)
  }

  const deleteObj = (id) =>
    updateActiveProj({ objectives: (activeProj?.objectives || []).filter(o => o.id !== id) })

  const toggleCritical = (id) =>
    updateActiveProj({ objectives: (activeProj?.objectives || []).map(o => o.id === id ? { ...o, critical: !o.critical } : o) })

  const addEntry = () => {
    if (!newName.trim()) return
    const id = crypto.randomUUID()
    onUpdateCard({ projects: [...projects, { id, name: newName.trim(), notes: [], objectives: [] }], activeProjectId: id })
    setNewName(''); setShowAdd(false)
    addXp(10, `New ${label}: ${newName}`)
  }

  const removeEntry = (id) => {
    const rest = projects.filter(p => p.id !== id)
    onUpdateCard({ projects: rest, activeProjectId: rest[0]?.id || null })
  }

  return (
    <div className="space-y-3">
      {/* Label + selector row */}
      <div>
        {/* Editable label */}
        <div className="flex items-center gap-1 mb-1">
          {editingLabel ? (
            <div className="flex gap-1 flex-1">
              <input className="ops-input flex-1 text-xs py-0.5" value={labelDraft} autoFocus
                onChange={e => setLabelDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { onUpdateCard({ projectLabel: labelDraft }); setEditingLabel(false) }
                  if (e.key === 'Escape') setEditingLabel(false)
                }} />
              <button onClick={() => { onUpdateCard({ projectLabel: labelDraft }); setEditingLabel(false) }} className="ops-btn-primary py-0.5 px-2"><Check className="w-3 h-3" /></button>
              <button onClick={() => setEditingLabel(false)} className="ops-btn-ghost py-0.5 px-2"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button
              className="ops-label mb-0 flex items-center gap-1 group hover:text-gray-300 transition-colors"
              onClick={() => { setLabelDraft(label); setEditingLabel(true) }}
              title={`Rename "${label}"`}
            >
              Active {label}
              <Edit3 className="w-2.5 h-2.5 text-gray-700 group-hover:text-ops-green transition-colors" />
            </button>
          )}
        </div>

        {/* Project selector + actions */}
        <div className="flex gap-2">
          <select className="ops-input flex-1 text-sm"
            value={card.activeProjectId || ''}
            onChange={e => { onUpdateCard({ activeProjectId: e.target.value }); setTab('notes') }}>
            {projects.map(p => <option key={p.id} value={p.id} className="bg-bunker-800">{p.name}</option>)}
          </select>
          {/* Rename current entry */}
          {activeProj && (
            <button onClick={() => { setProjNameDraft(activeProj.name); setRenamingProj(true) }}
              title={`Rename this ${label}`}
              className="ops-btn border rounded px-2.5 py-2 transition-colors border-bunker-600 text-gray-600 hover:border-gray-500 hover:text-gray-300">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => setShowAdd(s => !s)} title={`Add ${label}`}
            className="ops-btn border rounded transition-all px-3 py-2"
            style={{ backgroundColor: a.bg12, color: a.color, borderColor: a.bd30 }}>
            <Plus className="w-3.5 h-3.5" />
          </button>
          {projects.length > 1 && activeProj && (
            <button onClick={() => removeEntry(activeProj.id)} title={`Remove ${label}`}
              className="ops-btn-danger rounded px-3 py-2">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Rename current project inline */}
        {renamingProj && (
          <div className="flex gap-2 mt-2">
            <input className="ops-input flex-1 text-sm" placeholder={`Rename ${label}…`}
              value={projNameDraft} onChange={e => setProjNameDraft(e.target.value)} autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') { updateActiveProj({ name: projNameDraft }); setRenamingProj(false) }
                if (e.key === 'Escape') setRenamingProj(false)
              }} />
            <button onClick={() => { updateActiveProj({ name: projNameDraft }); setRenamingProj(false) }} className="ops-btn-primary"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setRenamingProj(false)} className="ops-btn-ghost"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Add new entry */}
        {showAdd && (
          <div className="flex gap-2 mt-2">
            <input className="ops-input flex-1 text-sm" placeholder={`${label} name…`}
              value={newName} onChange={e => setNewName(e.target.value)} autoFocus
              onKeyDown={e => { if (e.key === 'Enter') addEntry(); if (e.key === 'Escape') setShowAdd(false) }} />
            <button onClick={addEntry} className="ops-btn-primary"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setShowAdd(false)} className="ops-btn-ghost"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      {/* Scoped tabs */}
      {activeProj && (
        <>
          <div className="flex border border-bunker-700 rounded overflow-hidden">
            {[
              { id: 'notes',      icon: Clock,        label: `Notes (${(activeProj.notes || []).length})` },
              { id: 'objectives', icon: Target,        label: `Objectives (${activeCount})` },
              { id: 'events',     icon: CalendarDays,  label: `Events (${eventCount})` },
            ].map(t => {
              const TIcon = t.icon
              const isActive = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex-1 py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1"
                  style={isActive ? a.activeTab : { color: '#6b7280' }}>
                  <TIcon className="w-3 h-3" />{t.label}
                </button>
              )
            })}
          </div>

          {tab === 'notes' && (
            <NoteHistory notes={activeProj.notes || []} onAdd={addNote} hex={card.accentColor} />
          )}
          {tab === 'objectives' && (
            <CardObjectives
              objectives={activeProj.objectives || []}
              onAdd={addObjective} onToggle={toggleObj} onDelete={deleteObj}
              onToggleCritical={toggleCritical} hex={card.accentColor}
            />
          )}
          {tab === 'events' && (
            <CardEvents cardId={card.id} hex={card.accentColor} />
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
      {label && <label className="ops-label">{label}</label>}
      {editing ? (
        <div className="flex gap-1">
          <input type={type} min={min} max={max} className="ops-input flex-1 text-sm"
            value={draft} autoFocus
            onChange={e => setDraft(type === 'number' ? Number(e.target.value) : e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }} />
          <button onClick={save} className="ops-btn-primary"><Check className="w-3 h-3" /></button>
          <button onClick={cancel} className="ops-btn-ghost"><X className="w-3 h-3" /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setDraft(value); setEditing(true) }}>
          <span className="text-sm text-gray-200">{value !== '' ? String(value) : <span className="text-gray-600 italic">—</span>}</span>
          <Edit3 className="w-3 h-3 text-gray-700 group-hover:text-ops-green transition-colors" />
        </div>
      )}
    </div>
  )
}

// ─── Status picker (click-toggle, not hover — avoids overflow-hidden clipping) ─

function StatusPicker({ status, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-[10px] px-2 py-0.5 rounded-full border select-none transition-colors
          ${STATUS_COLORS[status] || STATUS_COLORS['Active']}`}
      >
        {status}
      </button>
      {open && (
        <>
          {/* Backdrop to close */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-20 bg-bunker-800 border border-bunker-600 rounded-lg py-1 min-w-[130px] shadow-xl">
            {STATUS_OPTS.map(s => (
              <button key={s}
                onClick={() => { onChange(s); setOpen(false) }}
                className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-bunker-700 transition-colors
                  ${status === s ? 'text-ops-green' : 'text-gray-300'}`}>
                {status === s ? '✓ ' : '  '}{s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Add New Card Modal ───────────────────────────────────────────────────────

function AddCardModal({ onSave, onClose }) {
  const [title, setTitle]         = useState('')
  const [icon, setIcon]           = useState('Star')
  const [color, setColor]         = useState('#00ff88')
  const [status, setStatus]       = useState('Active')
  const [projLabel, setProjLabel] = useState('Project')
  const [initName, setInitName]   = useState('')

  const submit = () => {
    if (!title.trim()) return
    onSave({ title: title.trim(), icon, accentColor: color, status, projectLabel: projLabel, initEntryName: initName.trim() })
    onClose()
  }

  const a = ac(color)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bunker-900 border border-bunker-600 rounded-lg w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-100">New Domain</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-gray-200" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ops-label">Domain Title</label>
            <input className="ops-input" placeholder="e.g. Arista Study…"
              value={title} onChange={e => setTitle(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          <div>
            <label className="ops-label">Entry Label</label>
            <input className="ops-input" placeholder="Project / Client / Course…"
              value={projLabel} onChange={e => setProjLabel(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="ops-label">First {projLabel || 'Entry'} Name</label>
          <input className="ops-input" placeholder={`e.g. ${projLabel ? `My First ${projLabel}` : 'Getting Started'}…`}
            value={initName} onChange={e => setInitName(e.target.value)} />
        </div>

        <div>
          <label className="ops-label">Status</label>
          <select className="ops-input" value={status} onChange={e => setStatus(e.target.value)}>
            {STATUS_OPTS.map(s => <option key={s} className="bg-bunker-800">{s}</option>)}
          </select>
        </div>

        <div>
          <label className="ops-label">Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {ICON_OPTS.map(name => {
              const I = ICON_MAP[name]
              const active = icon === name
              return (
                <button key={name} onClick={() => setIcon(name)} title={name}
                  className="p-2 rounded border transition-all"
                  style={active ? { backgroundColor: a.bg12, color: a.color, borderColor: a.bd60 } : { borderColor: '#374151', color: '#6b7280' }}>
                  <I className="w-4 h-4" />
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="ops-label">Accent Color</label>
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-bunker-600 bg-transparent" />
            <div className="flex-1 h-8 rounded border border-bunker-600 transition-all"
              style={{ backgroundColor: a.bg12, borderColor: a.bd30 }} />
            <span className="text-xs text-gray-500 font-mono w-16">{color}</span>
          </div>
          {/* Quick presets */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {['#00ff88','#38bdf8','#a78bfa','#f59e0b','#22d3ee','#a3e635','#ef4444','#f97316','#ec4899','#6366f1','#14b8a6','#eab308'].map(h => (
              <button key={h} onClick={() => setColor(h)}
                className={`w-6 h-6 rounded-full border-2 transition-all`}
                style={{ backgroundColor: h, borderColor: color === h ? 'white' : 'transparent',
                  transform: color === h ? 'scale(1.2)' : 'scale(1)' }} />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="rounded border-l-4 p-3 bg-bunker-800" style={a.cardBorder}>
          <div className="flex items-center gap-2">
            {(() => { const I = ICON_MAP[icon] || Star; return <I className="w-4 h-4" style={a.text} /> })()}
            <span className="text-sm font-bold text-gray-100">{title || 'Card Preview'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full border ml-auto" style={a.pill}>{status}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="ops-btn-ghost flex-1">Cancel</button>
          <button onClick={submit} className="ops-btn flex-1 border rounded transition-all py-2 font-semibold text-xs"
            style={{ backgroundColor: a.bg12, color: a.color, borderColor: a.bd30 }}>
            Create Domain
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Individual SITREP Card ───────────────────────────────────────────────────

function SitrepCard({ card, onUpdate, onDelete, addXp, ts }) {
  const [collapsed, setCollapsed]   = useState(card.collapsed || false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft]     = useState('')
  const a = ac(card.accentColor)
  const Icon = ICON_MAP[card.icon] || Star

  const set = (fields) => onUpdate({ ...card, ...fields })

  // Active objective count — always from projects since all cards have hasProjects now
  const activeCount = (card.projects || [])
    .flatMap(p => p.objectives || [])
    .filter(o => !o.done).length

  return (
    <div className="bg-bunker-900 border border-bunker-700 rounded-lg" style={a.cardBorder}>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-bunker-800 rounded-t-lg bg-bunker-900">
        <Icon className="w-4 h-4 flex-shrink-0" style={a.text} />

        {/* Editable title */}
        {editingTitle ? (
          <div className="flex gap-1 flex-1 min-w-0">
            <input
              className="ops-input flex-1 text-sm py-0.5"
              value={titleDraft}
              autoFocus
              onChange={e => setTitleDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { set({ title: titleDraft }); setEditingTitle(false) }
                if (e.key === 'Escape') setEditingTitle(false)
              }}
            />
            <button onClick={() => { set({ title: titleDraft }); setEditingTitle(false) }}
              className="ops-btn-primary py-0.5 px-2 flex-shrink-0"><Check className="w-3 h-3" /></button>
            <button onClick={() => setEditingTitle(false)}
              className="ops-btn-ghost py-0.5 px-2 flex-shrink-0"><X className="w-3 h-3" /></button>
          </div>
        ) : (
          <button
            className="flex-1 text-left text-sm font-bold text-gray-100 truncate group/title flex items-center gap-1.5 min-w-0"
            onClick={() => { setTitleDraft(card.title); setEditingTitle(true) }}
            title="Click to rename"
          >
            <span className="truncate">{card.title}</span>
            <Edit3 className="w-3 h-3 text-gray-700 group-hover/title:text-ops-green transition-colors flex-shrink-0" />
          </button>
        )}

        {/* Status — click to change */}
        <StatusPicker status={card.status} onChange={s => set({ status: s })} />

        {activeCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded border ml-1" style={a.pill}>
            {activeCount} obj
          </span>
        )}

        {/* Accent color picker — right on the card header */}
        <div className="relative group/cp" title="Change color">
          <div className="w-4 h-4 rounded-full border border-bunker-600 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: card.accentColor }} />
          <input type="color" value={card.accentColor}
            onChange={e => set({ accentColor: e.target.value })}
            className="absolute inset-0 opacity-0 cursor-pointer w-4 h-4" />
        </div>

        <button onClick={() => { const c = !collapsed; setCollapsed(c); set({ collapsed: c }) }}
          className="text-gray-600 hover:text-gray-300 transition-colors">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <button onClick={() => onDelete(card.id)} className="text-gray-700 hover:text-ops-red transition-colors" title="Remove card">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">

          {/* Boeing static fields */}
          {card.id === 'boeing' && (
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-bunker-800">
              <div><label className="ops-label">Role</label><p className="text-sm text-gray-300">{card.role}</p></div>
              <div>
                <label className="ops-label">L3 Advocate</label>
                <p className="text-sm font-semibold" style={a.text}>{card.l3}</p>
              </div>
            </div>
          )}

          {/* WGU — program, CUs, term days (course is in ProjectPanel) */}
          {card.id === 'wgu' && (
            <div className="space-y-3 pb-3 border-b border-bunker-800">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="ops-label">Program</label><p className="text-sm text-gray-300">{card.program}</p></div>
                <div>
                  <label className="ops-label">Days Left in Term</label>
                  <InlineField value={card.daysLeftInTerm} type="number" min={0} max={365}
                    onSave={v => { set({ daysLeftInTerm: Number(v) }); addXp(3, 'WGU term days') }} />
                </div>
              </div>
              <div>
                <label className="ops-label">Credit Units — {card.completedCUs} / {card.totalCUs}</label>
                <div className="h-2 bg-bunker-700 rounded-full overflow-hidden my-1.5">
                  <div className="h-full rounded-full xp-bar-fill" style={{ ...a.bar, width: `${Math.min((card.completedCUs / card.totalCUs) * 100, 100)}%` }} />
                </div>
                <div className="flex items-center gap-2">
                  <InlineField value={card.completedCUs} type="number" min={0}
                    onSave={v => { set({ completedCUs: Number(v) }); addXp(10, 'WGU CUs updated') }} />
                  <span className="text-gray-600 text-sm">/</span>
                  <InlineField value={card.totalCUs} type="number" min={1}
                    onSave={v => set({ totalCUs: Number(v) })} />
                  <span className="text-xs text-gray-600">CUs</span>
                </div>
              </div>
            </div>
          )}

          {/* GameDev static fields */}
          {card.id === 'gamedev' && (
            <div className="pb-3 border-b border-bunker-800">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="ops-label">Engine</label><p className="text-sm text-gray-300">{card.engine}</p></div>
                <InlineField label="Current Milestone" value={card.currentMilestone || ''}
                  onSave={v => { set({ currentMilestone: v }); addXp(5, 'GameDev milestone') }} />
              </div>
            </div>
          )}

          {/* GDQuest — overall progress slider (module is in ProjectPanel) */}
          {card.id === 'gdquest' && (
            <div className="pb-3 border-b border-bunker-800">
              <label className="ops-label">Overall Course Progress — {card.progressPercent || 0}%</label>
              <div className="h-2 bg-bunker-700 rounded-full overflow-hidden my-1.5">
                <div className="h-full rounded-full xp-bar-fill" style={{ ...a.bar, width: `${card.progressPercent || 0}%` }} />
              </div>
              <input type="range" min="0" max="100" value={card.progressPercent || 0}
                onChange={e => set({ progressPercent: Number(e.target.value) })}
                className="w-full" style={{ accentColor: card.accentColor }} />
            </div>
          )}

          {/* Safe Days tagline */}
          {card.id === 'safedays' && (
            <div className="pb-3 border-b border-bunker-800">
              <label className="ops-label">Tagline</label>
              <p className="text-xs text-gray-400">{card.tagline}</p>
            </div>
          )}

          {/* Custom card subtitle */}
          {!['boeing','wgu','gdquest','safedays','gamedev'].includes(card.id) && card.subtitle !== undefined && (
            <div className="pb-3 border-b border-bunker-800">
              <InlineField label="Detail" value={card.subtitle || ''}
                onSave={v => set({ subtitle: v })} />
            </div>
          )}

          {/* Project / Client / Course / Module panel — all cards */}
          <ProjectPanel card={card} onUpdateCard={(fields) => set(fields)} addXp={addXp} ts={ts} />
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

  const updateCard = (updated) =>
    update(s => { s.sitrep.cards = s.sitrep.cards.map(c => c.id === updated.id ? updated : c) })

  const deleteCard = (id) => {
    if (!confirm('Remove this card?')) return
    update(s => { s.sitrep.cards = s.sitrep.cards.filter(c => c.id !== id) })
  }

  const addCard = (fields) => {
    const id = crypto.randomUUID()
    const { initEntryName, ...cardFields } = fields
    const firstEntryName = initEntryName || `${cardFields.projectLabel || 'Project'} 1`
    update(s => {
      s.sitrep.cards = [...s.sitrep.cards, {
        id,
        order: s.sitrep.cards.length,
        collapsed: false,
        hasProjects: true,
        activeProjectId: `${id}-p1`,
        projects: [{ id: `${id}-p1`, name: firstEntryName, notes: [], objectives: [] }],
        notes: [],
        objectives: [],
        resources: [],
        milestones: [],
        ...cardFields,
      }]
    })
    addXp(15, `New domain: ${cardFields.title}`)
  }

  // Flatten all active objectives across every card + all their projects
  const allActiveObj = cards.flatMap(c =>
    (c.projects || []).flatMap(p =>
      (p.objectives || []).filter(o => !o.done).map(o => ({
        ...o,
        cardTitle: c.title,
        projectName: p.name,
        cardHex: c.accentColor,
      }))
    ).concat(
      // Also include card-level objectives for any card that somehow has them
      (c.objectives || []).filter(o => !o.done).map(o => ({
        ...o, cardTitle: c.title, projectName: null, cardHex: c.accentColor,
      }))
    )
  )
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
          <Plus className="w-3.5 h-3.5" /> Add Domain
        </button>
      </div>

      {/* Critical strip */}
      {criticalObj.length > 0 && (
        <div className="p-3 bg-ops-red/5 border border-ops-red/30 rounded-lg space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-ops-red" />
            <span className="text-[10px] text-ops-red uppercase tracking-wider font-semibold">Critical Objectives</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {criticalObj.map(o => (
              <div key={o.id} className="text-[11px] px-2 py-0.5 rounded border border-ops-red/40 bg-ops-red/10 text-ops-red">
                <span className="opacity-60">[{o.cardTitle}{o.projectName ? ` / ${o.projectName}` : ''}]</span> {o.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cards.map(card => (
          <SitrepCard key={card.id} card={card} onUpdate={updateCard} onDelete={deleteCard} addXp={addXp} ts={ts} />
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-16 ops-card">
          <Target className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No domains yet. Click <strong className="text-ops-green">Add Domain</strong> to build your SITREP.</p>
        </div>
      )}

      {/* All active objectives summary */}
      {allActiveObj.length > 0 && (
        <div className="ops-card">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-3.5 h-3.5 text-ops-green" />
            <span className="text-xs text-gray-500 uppercase tracking-widest">All Active Objectives</span>
            <span className="ml-auto text-[10px] text-gray-600">{allActiveObj.length} total</span>
          </div>
          <div className="space-y-1">
            {allActiveObj.map(o => (
              <div key={o.id} className={`flex items-center gap-2 text-xs p-1.5 rounded ${o.critical ? 'bg-ops-red/5' : ''}`}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: o.cardHex }} />
                <span className="text-gray-500 flex-shrink-0">
                  [{o.cardTitle}{o.projectName ? ` / ${o.projectName}` : ''}]
                </span>
                <span className="text-gray-200 flex-1">{o.text}</span>
                {o.critical && <AlertTriangle className="w-3 h-3 text-ops-red flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
