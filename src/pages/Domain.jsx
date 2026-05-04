import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  Network, BookOpen, Shield, Gamepad2, Brain, Briefcase, Code,
  Database, Globe, Server, Zap, Target, Star, Cpu,
  ChevronLeft, Plus, Check, X, Trash2, Edit3,
  Clock, AlertTriangle, Link2, CalendarDays, Timer,
  ChevronDown, ChevronUp, ExternalLink, Flag,
} from 'lucide-react'
import { format, parseISO, startOfDay, isAfter } from 'date-fns'

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = (hex || '#00ff88').replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}

function ac(hex) {
  const [r,g,b] = hexToRgb(hex)
  const rgb = `${r},${g},${b}`
  return {
    color:      `rgb(${rgb})`,
    bg12:       `rgba(${rgb},0.12)`,
    bg06:       `rgba(${rgb},0.06)`,
    bd30:       `rgba(${rgb},0.30)`,
    bd60:       `rgba(${rgb},0.60)`,
    text:       { color: `rgb(${rgb})` },
    pill:       { backgroundColor: `rgba(${rgb},0.12)`, color: `rgb(${rgb})`, borderColor: `rgba(${rgb},0.40)` },
    activeTab:  { backgroundColor: `rgba(${rgb},0.12)`, color: `rgb(${rgb})` },
    dot:        { backgroundColor: `rgb(${rgb})` },
    bar:        { backgroundColor: `rgb(${rgb})` },
    leftBorder: { borderLeftColor: `rgb(${rgb})` },
    cardBorder: { borderLeftColor: `rgb(${rgb})`, borderLeftWidth: '4px' },
    headerBg:   { background: `linear-gradient(135deg, rgba(${rgb},0.08) 0%, transparent 60%)` },
  }
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP = {
  Network, BookOpen, Shield, Gamepad2, Brain, Briefcase,
  Code, Database, Globe, Server, Zap, Target, Star, Cpu,
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

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({ icon: Icon, label, value, hex }) {
  const a = ac(hex)
  return (
    <div className="ops-card flex items-center gap-3 py-3">
      <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: a.bg12 }}>
        <Icon className="w-4 h-4" style={a.text} />
      </div>
      <div>
        <div className="text-lg font-bold text-gray-100 leading-none">{value}</div>
        <div className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">{label}</div>
      </div>
    </div>
  )
}

// ─── Inline editable field ────────────────────────────────────────────────────

function InlineEdit({ value, onSave, placeholder, multiline, className }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const save = () => { if (draft !== value) onSave(draft); setEditing(false) }
  const cancel = () => { setDraft(value); setEditing(false) }

  if (editing) {
    const shared = {
      className: 'ops-input w-full text-sm',
      value: draft,
      autoFocus: true,
      onChange: e => setDraft(e.target.value),
      onKeyDown: e => {
        if (e.key === 'Escape') cancel()
        if (e.key === 'Enter' && (!multiline || e.ctrlKey)) save()
      },
    }
    return (
      <div className="flex gap-1.5">
        {multiline
          ? <textarea {...shared} rows={2} className="ops-textarea flex-1 text-sm" />
          : <input {...shared} className="ops-input flex-1 text-sm" />
        }
        <button onClick={save} className="ops-btn-primary self-start mt-0.5"><Check className="w-3 h-3" /></button>
        <button onClick={cancel} className="ops-btn-ghost self-start mt-0.5"><X className="w-3 h-3" /></button>
      </div>
    )
  }

  return (
    <div
      className={`group flex items-start gap-1.5 cursor-pointer ${className || ''}`}
      onClick={() => { setDraft(value); setEditing(true) }}
    >
      <span className={value ? '' : 'text-gray-600 italic'}>{value || placeholder}</span>
      <Edit3 className="w-3 h-3 text-gray-700 group-hover:text-ops-green transition-colors flex-shrink-0 mt-0.5" />
    </div>
  )
}

// ─── Notes feed ───────────────────────────────────────────────────────────────

function NotesFeed({ notes, onAdd, onDelete, hex }) {
  const [text, setText]           = useState('')
  const [visibleCount, setVisibleCount] = useState(10)
  const a = ac(hex)
  const visible = notes.slice(0, visibleCount)
  const hasMore = notes.length > visibleCount

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
          placeholder="Add a note… (Ctrl+Enter)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submit() }}
        />
        <button onClick={submit}
          className="ops-btn border rounded self-end px-3 py-2 flex-shrink-0 transition-all"
          style={{ backgroundColor: a.bg12, color: a.color, borderColor: a.bd30 }}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {notes.length === 0 && <p className="text-[11px] text-gray-700 italic">No notes yet.</p>}

      <div className="space-y-1.5">
        {visible.map(n => (
          <div key={n.id} className="group rounded p-2.5 bg-bunker-800 border-l-2" style={a.leftBorder}>
            <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">{n.text}</p>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[9px] text-gray-600">{format(parseISO(n.at), 'EEE MMM d yyyy · HH:mm')}</p>
              {onDelete && (
                <button onClick={() => onDelete(n.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-ops-red">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex gap-3">
          <button onClick={() => setVisibleCount(c => c + 10)}
            className="text-[10px] text-gray-600 hover:text-gray-300 flex items-center gap-1 transition-colors">
            <ChevronDown className="w-3 h-3" /> Load 10 more
          </button>
          <button onClick={() => setVisibleCount(notes.length)}
            className="text-[10px] text-gray-600 hover:text-gray-300 transition-colors">
            Show all ({notes.length})
          </button>
        </div>
      )}
      {visibleCount > 10 && notes.length > 10 && (
        <button onClick={() => setVisibleCount(10)}
          className="text-[10px] text-gray-600 hover:text-gray-300 flex items-center gap-1 transition-colors">
          <ChevronUp className="w-3 h-3" /> Show less
        </button>
      )}
    </div>
  )
}

// ─── Objectives list ──────────────────────────────────────────────────────────

function ObjectivesList({ objectives, onAdd, onToggle, onDelete, onToggleCritical, hex }) {
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
        <button onClick={() => setCritical(c => !c)} title="Critical"
          className={`ops-btn border rounded flex-shrink-0 px-2 transition-colors
            ${critical ? 'bg-ops-red/20 border-ops-red/60 text-ops-red' : 'border-bunker-600 text-gray-600 hover:border-gray-500'}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
        </button>
        <button onClick={submit}
          className="ops-btn border rounded flex-shrink-0 px-3 transition-all"
          style={{ backgroundColor: a.bg12, color: a.color, borderColor: a.bd30 }}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {active.length === 0 && <p className="text-[11px] text-gray-700 italic">No active objectives.</p>}

      <div className="space-y-1">
        {active.map(obj => (
          <div key={obj.id}
            className={`flex items-start gap-2 p-1.5 rounded group
              ${obj.critical ? 'bg-ops-red/5 border border-ops-red/20' : 'hover:bg-bunker-800'}`}>
            <button onClick={() => onToggle(obj.id)}
              className="w-4 h-4 mt-0.5 rounded border border-bunker-500 hover:border-ops-green flex-shrink-0 transition-colors" />
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
            className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-1 mb-1 transition-colors">
            <Check className="w-3 h-3" /> {done.length} completed
            {showDone ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showDone && done.map(obj => (
            <div key={obj.id} className="flex items-start gap-2 p-1.5 opacity-50 group">
              <div className="w-4 h-4 rounded border border-ops-green bg-ops-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 text-ops-green" />
              </div>
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

// ─── Resources section ────────────────────────────────────────────────────────

function ResourcesSection({ resources, onAdd, onDelete, hex }) {
  const [label, setLabel] = useState('')
  const [url, setUrl]     = useState('')
  const [desc, setDesc]   = useState('')
  const [open, setOpen]   = useState(false)
  const a = ac(hex)

  const submit = () => {
    if (!label.trim() || !url.trim()) return
    const href = url.startsWith('http') ? url : `https://${url}`
    onAdd({ id: crypto.randomUUID(), label: label.trim(), url: href, description: desc.trim(), at: new Date().toISOString() })
    setLabel(''); setUrl(''); setDesc(''); setOpen(false)
  }

  return (
    <div className="space-y-2">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs transition-all border rounded px-3 py-1.5 w-full justify-center"
          style={{ backgroundColor: a.bg06, color: a.color, borderColor: a.bd30 }}>
          <Plus className="w-3 h-3" /> Add Resource
        </button>
      ) : (
        <div className="space-y-2 bg-bunker-800 rounded p-3 border border-bunker-700">
          <input className="ops-input text-sm" placeholder="Label (e.g. Course Docs)"
            value={label} onChange={e => setLabel(e.target.value)} autoFocus />
          <input className="ops-input text-sm" placeholder="URL"
            value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          <input className="ops-input text-sm" placeholder="Description (optional)"
            value={desc} onChange={e => setDesc(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={submit} className="ops-btn-primary flex-1 text-xs py-1.5">Save</button>
            <button onClick={() => setOpen(false)} className="ops-btn-ghost text-xs py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {resources.length === 0 && !open && (
        <p className="text-[11px] text-gray-700 italic">No resources saved yet.</p>
      )}

      <div className="space-y-1.5">
        {resources.map(r => (
          <div key={r.id}
            className="group flex items-start gap-2 p-2.5 rounded bg-bunker-800 border border-bunker-700 hover:border-bunker-600 transition-colors">
            <Link2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={a.text} />
            <div className="flex-1 min-w-0">
              <a href={r.url} target="_blank" rel="noreferrer"
                className="text-xs font-medium flex items-center gap-1 hover:underline" style={a.text}>
                {r.label}
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
              {r.description && <p className="text-[10px] text-gray-600 mt-0.5 truncate">{r.description}</p>}
              <p className="text-[9px] text-gray-700 mt-0.5 truncate">{r.url}</p>
            </div>
            <button onClick={() => onDelete(r.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-ops-red transition-all flex-shrink-0">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Milestones section ───────────────────────────────────────────────────────

function MilestonesSection({ milestones, onAdd, onToggle, onDelete, hex }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [open, setOpen] = useState(false)
  const a = ac(hex)

  const submit = () => {
    if (!text.trim()) return
    onAdd({ id: crypto.randomUUID(), text: text.trim(), date, done: false, doneAt: null, at: new Date().toISOString() })
    setText(''); setDate(''); setOpen(false)
  }

  const active = milestones.filter(m => !m.done).sort((a,b) => (a.date||'') < (b.date||'') ? -1 : 1)
  const done   = milestones.filter(m =>  m.done)
  const [showDone, setShowDone] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const isOverdue = (m) => m.date && m.date < today && !m.done

  return (
    <div className="space-y-2">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs transition-all border rounded px-3 py-1.5 w-full justify-center"
          style={{ backgroundColor: a.bg06, color: a.color, borderColor: a.bd30 }}>
          <Plus className="w-3 h-3" /> Add Milestone
        </button>
      ) : (
        <div className="space-y-2 bg-bunker-800 rounded p-3 border border-bunker-700">
          <input className="ops-input text-sm" placeholder="Milestone description…"
            value={text} onChange={e => setText(e.target.value)} autoFocus />
          <div className="flex gap-2 items-center">
            <label className="ops-label mb-0 flex-shrink-0">Target Date</label>
            <input type="date" className="ops-input flex-1 text-sm"
              value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="ops-btn-primary flex-1 text-xs py-1.5">Add</button>
            <button onClick={() => setOpen(false)} className="ops-btn-ghost text-xs py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {milestones.length === 0 && !open && (
        <p className="text-[11px] text-gray-700 italic">No milestones set yet.</p>
      )}

      <div className="space-y-1.5">
        {active.map(m => (
          <div key={m.id}
            className={`group flex items-start gap-2.5 p-2.5 rounded border transition-colors
              ${isOverdue(m) ? 'border-ops-red/30 bg-ops-red/5' : 'border-bunker-700 bg-bunker-900 hover:border-bunker-600'}`}>
            <button onClick={() => onToggle(m.id)}
              className="w-4 h-4 rounded-full border border-bunker-500 hover:border-ops-green flex-shrink-0 mt-0.5 transition-colors" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-200">{m.text}</p>
              {m.date && (
                <p className={`text-[10px] mt-0.5 flex items-center gap-1
                  ${isOverdue(m) ? 'text-ops-red' : 'text-gray-600'}`}>
                  <Flag className="w-2.5 h-2.5" />
                  {isOverdue(m) ? 'OVERDUE · ' : ''}
                  {m.date}
                </p>
              )}
            </div>
            <button onClick={() => onDelete(m.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-ops-red transition-all">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <div>
          <button onClick={() => setShowDone(s => !s)}
            className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-1 mt-1 transition-colors">
            <Check className="w-3 h-3" /> {done.length} completed
            {showDone ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showDone && done.map(m => (
            <div key={m.id} className="flex items-center gap-2.5 p-2 opacity-40 group">
              <div className="w-4 h-4 rounded-full border border-ops-green bg-ops-green/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 text-ops-green" />
              </div>
              <span className="text-xs text-gray-500 flex-1 line-through">{m.text}</span>
              <button onClick={() => onDelete(m.id)} className="opacity-0 group-hover:opacity-100">
                <Trash2 className="w-3 h-3 text-gray-600 hover:text-ops-red" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Events panel ─────────────────────────────────────────────────────────────

function EventsPanel({ cardId, hex }) {
  const { state } = useStore()
  const a = ac(hex)
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd')

  const events = useMemo(() => {
    return (state.calendarEvents || [])
      .map(ev => ({ ...ev, startDate: ev.startDate || ev.date || '' }))
      .filter(ev => ev.subject === cardId && ev.startDate >= today)
      .sort((a, b) => {
        const da = a.startDate + (a.startTime || '')
        const db = b.startDate + (b.startTime || '')
        return da < db ? -1 : da > db ? 1 : 0
      })
  }, [state.calendarEvents, cardId, today])

  const past = useMemo(() => {
    return (state.calendarEvents || [])
      .map(ev => ({ ...ev, startDate: ev.startDate || ev.date || '' }))
      .filter(ev => ev.subject === cardId && ev.startDate && ev.startDate < today)
      .sort((a, b) => b.startDate < a.startDate ? -1 : 1)
      .slice(0, 5)
  }, [state.calendarEvents, cardId, today])

  const [showPast, setShowPast] = useState(false)

  const PRIORITY_COLORS = { critical: '#ef4444', high: '#f59e0b', normal: '#6b7280', low: '#374151' }

  const EventRow = ({ ev }) => (
    <div className="rounded p-2.5 bg-bunker-800 border-l-2 flex items-start gap-2" style={a.leftBorder}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: PRIORITY_COLORS[ev.priority] || PRIORITY_COLORS.normal }} />
          <p className="text-xs text-gray-200 font-medium truncate">{ev.title || 'Untitled'}</p>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {ev.startDate}
          {ev.endDate && ev.endDate !== ev.startDate ? ` → ${ev.endDate}` : ''}
          {!ev.allDay && ev.startTime ? ` · ${ev.startTime}${ev.endTime ? `–${ev.endTime}` : ''}` : ev.allDay ? ' · All day' : ''}
        </p>
        {ev.description && <p className="text-[10px] text-gray-600 truncate mt-0.5">{ev.description}</p>}
      </div>
    </div>
  )

  return (
    <div className="space-y-1.5">
      {events.length === 0 && <p className="text-[11px] text-gray-700 italic">No upcoming events.</p>}
      {events.map(ev => <EventRow key={ev.id} ev={ev} />)}

      {past.length > 0 && (
        <div className="mt-2">
          <button onClick={() => setShowPast(s => !s)}
            className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors">
            {showPast ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {past.length} past event{past.length !== 1 ? 's' : ''}
          </button>
          {showPast && (
            <div className="space-y-1.5 mt-1.5 opacity-50">
              {past.map(ev => <EventRow key={ev.id} ev={ev} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Focus panel ──────────────────────────────────────────────────────────────

function FocusPanel({ card, hex }) {
  const { state } = useStore()
  const a = ac(hex)

  const sessions = useMemo(() => {
    const tid = card.id.toLowerCase()
    const ttitle = card.title.toLowerCase()
    return (state.focusSessions || []).filter(s => {
      const sub = (s.subject || '').toLowerCase()
      return sub === tid || sub === ttitle || sub.includes(tid) || tid.includes(sub)
    })
  }, [state.focusSessions, card.id, card.title])

  const totalMins  = sessions.reduce((acc, s) => acc + Math.round((s.duration || 0) / 60), 0)
  const totalHours = Math.floor(totalMins / 60)
  const remMins    = totalMins % 60
  const timeStr    = totalHours > 0 ? `${totalHours}h ${remMins}m` : `${totalMins}m`

  const recent = sessions.slice(0, 6)

  if (sessions.length === 0) {
    return <p className="text-[11px] text-gray-700 italic">No focus sessions logged for this domain yet.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-bunker-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full xp-bar-fill" style={a.bar} />
        </div>
        <span className="text-sm font-bold flex-shrink-0" style={a.text}>{timeStr}</span>
      </div>
      <p className="text-[10px] text-gray-600">{sessions.length} session{sessions.length !== 1 ? 's' : ''} total</p>
      <div className="space-y-1">
        {recent.map(s => (
          <div key={s.id} className="flex items-center gap-2 text-[10px] text-gray-500 py-1 border-b border-bunker-800">
            <span className="flex-1 text-gray-400 truncate">{s.focus || 'Focus session'}</span>
            <span>{Math.round((s.duration || 0) / 60)}m</span>
            {s.at && <span className="text-gray-700">{format(parseISO(s.at), 'MM/dd')}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Status picker (click-toggle, not CSS hover — avoids overflow clipping) ───

function DomainStatusPicker({ status, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-[10px] px-2.5 py-1 rounded-full border select-none transition-colors
          ${STATUS_COLORS[status] || STATUS_COLORS['Active']}`}
      >
        {status}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-8 z-20 bg-bunker-800 border border-bunker-600 rounded-lg py-1 min-w-[140px] shadow-xl">
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

// ─── Main Domain page ─────────────────────────────────────────────────────────

export default function Domain() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, update, addXp, ts } = useStore()
  const [projTab, setProjTab]             = useState('notes')
  const [newProjName, setNewProjName]     = useState('')
  const [showAddProj, setShowAddProj]     = useState(false)
  const [renamingProj, setRenamingProj]   = useState(false)
  const [projNameDraft, setProjNameDraft] = useState('')
  const [editingLabel, setEditingLabel]   = useState(false)
  const [labelDraft, setLabelDraft]       = useState('')

  const card = state.sitrep?.cards?.find(c => c.id === id)

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <Star className="w-12 h-12 text-gray-700" />
        <p className="text-gray-500 text-sm">Domain not found.</p>
        <button onClick={() => navigate('/')} className="ops-btn-primary flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to SITREP
        </button>
      </div>
    )
  }

  const a = ac(card.accentColor)
  const Icon = ICON_MAP[card.icon] || Star

  // Helpers to update the card
  const setCard = (fields) =>
    update(s => { s.sitrep.cards = s.sitrep.cards.map(c => c.id === card.id ? { ...c, ...fields } : c) })

  // Projects helpers
  const label    = card.projectLabel || 'Project'
  const projects = card.projects || []
  const activeProj = projects.find(p => p.id === card.activeProjectId) || projects[0]

  const updateActiveProj = (fields) =>
    setCard({ projects: projects.map(p => p.id === activeProj?.id ? { ...p, ...fields } : p) })

  // Notes
  const addNote = (text) => {
    updateActiveProj({ notes: [{ id: crypto.randomUUID(), text, at: ts() }, ...(activeProj?.notes || [])] })
    addXp(5, `Note: ${card.title}`)
  }
  const deleteNote = (nid) =>
    updateActiveProj({ notes: (activeProj?.notes || []).filter(n => n.id !== nid) })

  // Objectives
  const addObj = (text, critical) =>
    updateActiveProj({
      objectives: [...(activeProj?.objectives || []),
        { id: crypto.randomUUID(), text, critical: !!critical, done: false, doneAt: null, at: ts() }]
    })
  const toggleObj = (oid) => {
    const obj = (activeProj?.objectives || []).find(o => o.id === oid)
    updateActiveProj({ objectives: (activeProj?.objectives || []).map(o =>
      o.id === oid ? { ...o, done: !o.done, doneAt: !o.done ? ts() : null } : o) })
    if (!obj?.done) addXp(obj?.critical ? 50 : 25, `Done: ${obj?.text?.slice(0,30)}`)
  }
  const deleteObj = (oid) =>
    updateActiveProj({ objectives: (activeProj?.objectives || []).filter(o => o.id !== oid) })
  const toggleCriticalObj = (oid) =>
    updateActiveProj({ objectives: (activeProj?.objectives || []).map(o =>
      o.id === oid ? { ...o, critical: !o.critical } : o) })

  // Projects mgmt
  const addProject = () => {
    if (!newProjName.trim()) return
    const pid = crypto.randomUUID()
    setCard({ projects: [...projects, { id: pid, name: newProjName.trim(), notes: [], objectives: [] }], activeProjectId: pid })
    setNewProjName(''); setShowAddProj(false)
    addXp(10, `New ${label}: ${newProjName}`)
  }
  const removeProject = (pid) => {
    const rest = projects.filter(p => p.id !== pid)
    setCard({ projects: rest, activeProjectId: rest[0]?.id || null })
  }

  // Resources
  const resources = card.resources || []
  const addResource = (r) => { setCard({ resources: [...resources, r] }); addXp(5, 'Resource added') }
  const deleteResource = (rid) => setCard({ resources: resources.filter(r => r.id !== rid) })

  // Milestones
  const milestones = card.milestones || []
  const addMilestone = (m) => { setCard({ milestones: [...milestones, m] }); addXp(5, 'Milestone added') }
  const toggleMilestone = (mid) =>
    setCard({ milestones: milestones.map(m =>
      m.id === mid ? { ...m, done: !m.done, doneAt: !m.done ? ts() : null } : m) })
  const deleteMilestone = (mid) => setCard({ milestones: milestones.filter(m => m.id !== mid) })

  // Stats
  const allActiveObj = projects.flatMap(p => (p.objectives || []).filter(o => !o.done))
  const today = format(new Date(), 'yyyy-MM-dd')
  const upcomingEvents = (state.calendarEvents || [])
    .filter(ev => (ev.subject === card.id) && ((ev.startDate || ev.date || '') >= today))
  const activeMilestones = milestones.filter(m => !m.done)

  return (
    <div className="max-w-6xl mx-auto space-y-4">

      {/* ── Back + Header ── */}
      {/* Note: no overflow-hidden here so the status dropdown isn't clipped */}
      <div className="rounded-xl border border-bunker-700" style={a.headerBg}>
        <div className="p-5 rounded-t-xl">
          {/* Back link */}
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-300 transition-colors mb-4">
            <ChevronLeft className="w-3.5 h-3.5" /> SITREP
          </button>

          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: a.bg12, border: `1px solid ${a.bd30}` }}>
              <Icon className="w-6 h-6" style={a.text} />
            </div>

            {/* Title + tagline */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Editable title */}
                <InlineEdit
                  value={card.title}
                  onSave={v => setCard({ title: v.trim() || card.title })}
                  placeholder="Domain title…"
                  className="text-xl font-bold text-gray-100"
                />

                {/* Status — click-toggle (not hover, avoids clipping issues) */}
                <DomainStatusPicker status={card.status} onChange={s => setCard({ status: s })} />

                {/* Color picker */}
                <div className="relative" title="Change accent color">
                  <div className="w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition-transform border-2 border-bunker-600"
                    style={{ backgroundColor: card.accentColor }} />
                  <input type="color" value={card.accentColor}
                    onChange={e => setCard({ accentColor: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer w-5 h-5" />
                </div>
              </div>

              {/* Tagline */}
              <div className="mt-1.5 text-sm text-gray-400">
                <InlineEdit
                  value={card.tagline || card.subtitle || ''}
                  onSave={v => setCard({ tagline: v })}
                  placeholder="Add a tagline or description…"
                  multiline={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar — overflow-hidden + rounded-b-xl clips to card bottom corners */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-t border-bunker-700 divide-x divide-bunker-700 overflow-hidden rounded-b-xl">
          {[
            { icon: Target,      label: 'Active Objectives', value: allActiveObj.length },
            { icon: CalendarDays,label: 'Upcoming Events',   value: upcomingEvents.length },
            { icon: Flag,        label: 'Open Milestones',   value: activeMilestones.length },
            { icon: Link2,       label: 'Resources',         value: resources.length },
          ].map(s => {
            const SIcon = s.icon
            return (
              <div key={s.label} className="flex items-center gap-2.5 px-4 py-3">
                <SIcon className="w-4 h-4 flex-shrink-0" style={a.text} />
                <div>
                  <div className="text-base font-bold text-gray-100 leading-none">{s.value}</div>
                  <div className="text-[9px] text-gray-600 uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Main content — 2 col ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ── Left column (3/5) ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Projects + Notes/Objectives */}
          <div className="ops-card space-y-3">
            <div className="section-title" style={a.text}>
              <Target className="w-3.5 h-3.5" /> {label}s
            </div>

            {/* Editable label */}
            <div className="flex items-center gap-1 mb-1">
              {editingLabel ? (
                <div className="flex gap-1 flex-1">
                  <input className="ops-input flex-1 text-xs py-0.5" value={labelDraft} autoFocus
                    onChange={e => setLabelDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { setCard({ projectLabel: labelDraft }); setEditingLabel(false) }
                      if (e.key === 'Escape') setEditingLabel(false)
                    }} />
                  <button onClick={() => { setCard({ projectLabel: labelDraft }); setEditingLabel(false) }} className="ops-btn-primary py-0.5 px-2"><Check className="w-3 h-3" /></button>
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

            {/* Project selector */}
            <div className="flex gap-2">
              <select className="ops-input flex-1 text-sm"
                value={card.activeProjectId || ''}
                onChange={e => { setCard({ activeProjectId: e.target.value }); setProjTab('notes') }}>
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
              <button onClick={() => setShowAddProj(s => !s)} title={`Add ${label}`}
                className="ops-btn border rounded px-3 py-2 transition-all"
                style={{ backgroundColor: a.bg12, color: a.color, borderColor: a.bd30 }}>
                <Plus className="w-3.5 h-3.5" />
              </button>
              {projects.length > 1 && activeProj && (
                <button onClick={() => removeProject(activeProj.id)}
                  className="ops-btn-danger rounded px-3 py-2">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Rename current project */}
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

            {showAddProj && (
              <div className="flex gap-2 mt-2">
                <input className="ops-input flex-1 text-sm" placeholder={`${label} name…`}
                  value={newProjName} onChange={e => setNewProjName(e.target.value)} autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') addProject(); if (e.key === 'Escape') setShowAddProj(false) }} />
                <button onClick={addProject} className="ops-btn-primary"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setShowAddProj(false)} className="ops-btn-ghost"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Tabs */}
            {activeProj && (
              <>
                <div className="flex border border-bunker-700 rounded overflow-hidden">
                  {[
                    { id: 'notes',      icon: Clock,       label: `Notes (${(activeProj.notes||[]).length})` },
                    { id: 'objectives', icon: Target,      label: `Objectives (${allActiveObj.length})` },
                  ].map(t => {
                    const TIcon = t.icon
                    const isActive = projTab === t.id
                    return (
                      <button key={t.id} onClick={() => setProjTab(t.id)}
                        className="flex-1 py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1"
                        style={isActive ? a.activeTab : { color: '#6b7280' }}>
                        <TIcon className="w-3 h-3" />{t.label}
                      </button>
                    )
                  })}
                </div>

                {projTab === 'notes' && (
                  <NotesFeed
                    notes={activeProj.notes || []}
                    onAdd={addNote}
                    onDelete={deleteNote}
                    hex={card.accentColor}
                  />
                )}
                {projTab === 'objectives' && (
                  <ObjectivesList
                    objectives={activeProj.objectives || []}
                    onAdd={addObj}
                    onToggle={toggleObj}
                    onDelete={deleteObj}
                    onToggleCritical={toggleCriticalObj}
                    hex={card.accentColor}
                  />
                )}
              </>
            )}
          </div>

          {/* Milestones */}
          <div className="ops-card space-y-3">
            <div className="section-title" style={a.text}>
              <Flag className="w-3.5 h-3.5" /> Milestones
            </div>
            <MilestonesSection
              milestones={milestones}
              onAdd={addMilestone}
              onToggle={toggleMilestone}
              onDelete={deleteMilestone}
              hex={card.accentColor}
            />
          </div>
        </div>

        {/* ── Right column (2/5) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Resources */}
          <div className="ops-card space-y-3">
            <div className="section-title" style={a.text}>
              <Link2 className="w-3.5 h-3.5" /> Resources &amp; Links
            </div>
            <ResourcesSection
              resources={resources}
              onAdd={addResource}
              onDelete={deleteResource}
              hex={card.accentColor}
            />
          </div>

          {/* Events */}
          <div className="ops-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="section-title" style={a.text}>
                <CalendarDays className="w-3.5 h-3.5" /> Events
              </div>
              <button onClick={() => navigate(`/calendar?new=1&subject=${card.id}`)}
                className="text-[10px] text-gray-600 hover:text-gray-300 transition-colors flex items-center gap-1">
                + Add Event <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
            <EventsPanel cardId={card.id} hex={card.accentColor} />
          </div>

          {/* Focus Time */}
          <div className="ops-card space-y-3">
            <div className="section-title" style={a.text}>
              <Timer className="w-3.5 h-3.5" /> Focus Time
            </div>
            <FocusPanel card={card} hex={card.accentColor} />
          </div>
        </div>
      </div>
    </div>
  )
}
