import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import {
  Plus, X, Edit3, Trash2, Check, Save, RotateCcw, Target,
  Flame, ChevronDown, ChevronUp
} from 'lucide-react'
import { format, startOfWeek, addDays } from 'date-fns'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CATEGORIES = [
  { id: 'workout',   label: 'Workout',    icon: '🏋️', color: '#ef4444' },
  { id: 'study',     label: 'Study',      icon: '📚', color: '#a78bfa' },
  { id: 'work',      label: 'Work',       icon: '💼', color: '#38bdf8' },
  { id: 'recovery',  label: 'Recovery',   icon: '🧘', color: '#00ff88' },
  { id: 'nutrition', label: 'Nutrition',  icon: '🥗', color: '#f59e0b' },
  { id: 'project',   label: 'Project',    icon: '⚡', color: '#a3e635' },
  { id: 'habit',     label: 'Habit',      icon: '🔁', color: '#22d3ee' },
  { id: 'social',    label: 'Social',     icon: '🤝', color: '#f472b6' },
  { id: 'custom',    label: 'Custom',     icon: '📌', color: '#6b7280' },
]

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexRgb(hex) {
  const h = (hex || '#6b7280').replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}

function cat(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
}

// ─── Block normalizer (handles old format) ────────────────────────────────────

function nb(b) {
  return {
    ...b,
    category:  b.category  || 'custom',
    startTime: b.startTime || b.time || '',
    endTime:   b.endTime   || '',
    notes:     b.notes     || '',
    done:      b.done      || false,
  }
}

// ─── Add Block Modal ──────────────────────────────────────────────────────────

function AddBlockModal({ defaultDay, onSave, onClose }) {
  const [form, setForm] = useState({
    text: '', category: 'workout', startTime: '', endTime: '', notes: '',
    selectedDays: defaultDay ? [defaultDay] : [],
  })
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleDay = (day) =>
    s('selectedDays', form.selectedDays.includes(day)
      ? form.selectedDays.filter(d => d !== day)
      : [...form.selectedDays, day])

  const c = cat(form.category)
  const [r,g,b] = hexRgb(c.color)
  const canSave = form.text.trim() && form.selectedDays.length > 0

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bunker-900 border border-bunker-600 rounded-lg w-full max-w-md p-5 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-100">Add Battle Block</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-gray-200" /></button>
        </div>

        {/* Activity */}
        <div>
          <label className="ops-label">Activity *</label>
          <input
            className="ops-input"
            value={form.text}
            onChange={e => s('text', e.target.value)}
            placeholder="e.g. Morning run, Arista study, Meal prep…"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && canSave && onSave(form)}
          />
        </div>

        {/* Category */}
        <div>
          <label className="ops-label">Category</label>
          <div className="grid grid-cols-3 gap-1.5">
            {CATEGORIES.map(c => {
              const active = form.category === c.id
              const [cr,cg,cb] = hexRgb(c.color)
              return (
                <button
                  key={c.id}
                  onClick={() => s('category', c.id)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded border text-xs transition-all"
                  style={active
                    ? { color: `rgb(${cr},${cg},${cb})`, backgroundColor: `rgba(${cr},${cg},${cb},0.15)`, borderColor: `rgba(${cr},${cg},${cb},0.6)` }
                    : { borderColor: '#374151', color: '#6b7280' }}
                >
                  <span>{c.icon}</span><span>{c.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ops-label">Start Time</label>
            <input type="time" className="ops-input" value={form.startTime} onChange={e => s('startTime', e.target.value)} />
          </div>
          <div>
            <label className="ops-label">End Time</label>
            <input type="time" className="ops-input" value={form.endTime} onChange={e => s('endTime', e.target.value)} />
          </div>
        </div>

        {/* Day picker */}
        <div>
          <label className="ops-label">Add to Days *</label>
          <div className="flex gap-1">
            {DAYS.map(day => {
              const active = form.selectedDays.includes(day)
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className="flex-1 py-1.5 rounded border text-[10px] font-bold transition-all"
                  style={active
                    ? { color: `rgb(${r},${g},${b})`, backgroundColor: `rgba(${r},${g},${b},0.15)`, borderColor: `rgba(${r},${g},${b},0.6)` }
                    : { borderColor: '#374151', color: '#4b5563' }}
                >
                  {day.slice(0,2)}
                </button>
              )
            })}
          </div>
          <div className="flex gap-3 mt-1.5">
            {[
              ['All', DAYS],
              ['Weekdays', ['Mon','Tue','Wed','Thu','Fri']],
              ['Weekend', ['Sat','Sun']],
              ['None', []],
            ].map(([label, val]) => (
              <button key={label} onClick={() => s('selectedDays', val)}
                className="text-[10px] text-gray-600 hover:text-gray-300 transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="ops-label">Notes</label>
          <textarea
            className="ops-textarea min-h-[50px]"
            value={form.notes}
            onChange={e => s('notes', e.target.value)}
            placeholder="Optional details, targets, links…"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="ops-btn-ghost">Cancel</button>
          <button
            onClick={() => canSave && onSave(form)}
            className={`ops-btn-primary ${!canSave ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            Add to {form.selectedDays.length || '—'} {form.selectedDays.length === 1 ? 'Day' : 'Days'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Block Modal ─────────────────────────────────────────────────────────

function EditBlockModal({ block, day, onSave, onClose }) {
  const [form, setForm] = useState(() => nb(block))
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bunker-900 border border-bunker-600 rounded-lg w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-100">Edit Block — {day}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div>
          <label className="ops-label">Activity</label>
          <input className="ops-input" value={form.text} onChange={e => s('text', e.target.value)} autoFocus />
        </div>

        <div>
          <label className="ops-label">Category</label>
          <div className="grid grid-cols-3 gap-1.5">
            {CATEGORIES.map(c => {
              const active = form.category === c.id
              const [cr,cg,cb] = hexRgb(c.color)
              return (
                <button key={c.id} onClick={() => s('category', c.id)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded border text-xs transition-all"
                  style={active
                    ? { color: `rgb(${cr},${cg},${cb})`, backgroundColor: `rgba(${cr},${cg},${cb},0.15)`, borderColor: `rgba(${cr},${cg},${cb},0.6)` }
                    : { borderColor: '#374151', color: '#6b7280' }}>
                  <span>{c.icon}</span><span>{c.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ops-label">Start Time</label>
            <input type="time" className="ops-input" value={form.startTime} onChange={e => s('startTime', e.target.value)} />
          </div>
          <div>
            <label className="ops-label">End Time</label>
            <input type="time" className="ops-input" value={form.endTime} onChange={e => s('endTime', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="ops-label">Notes</label>
          <textarea className="ops-textarea min-h-[50px]" value={form.notes} onChange={e => s('notes', e.target.value)} />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="ops-btn-ghost">Cancel</button>
          <button onClick={() => form.text.trim() && onSave(form)} className="ops-btn-primary">Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── Intention editor ─────────────────────────────────────────────────────────

function IntentionCard({ intention, updatedAt, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(intention || '')

  const save = () => { onSave(draft); setEditing(false) }

  return (
    <div className="ops-card border-l-4" style={{ borderLeftColor: '#f59e0b' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-ops-amber" />
          <span className="text-xs font-bold text-ops-amber uppercase tracking-wider">This Week's Intention</span>
        </div>
        {!editing && (
          <button onClick={() => { setDraft(intention || ''); setEditing(true) }} className="ops-btn-ghost flex items-center gap-1 text-[10px]">
            <Edit3 className="w-3 h-3" /> Set
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            className="ops-textarea min-h-[70px]"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="What's the focus this week? e.g. Lock in Arista study every evening. Hit the gym 4x. No junk food..."
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={save} className="ops-btn-primary flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
            <button onClick={() => setEditing(false)} className="ops-btn-ghost">Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          {intention
            ? <p className="text-sm text-gray-200 leading-relaxed italic">"{intention}"</p>
            : <p className="text-xs text-gray-600 italic">No intention set. Click Set to define this week's focus.</p>
          }
          {updatedAt && (
            <div className="text-[9px] text-gray-700 mt-1.5">
              Set {format(new Date(updatedAt), 'EEE MMM d, HH:mm')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Day detail panel ─────────────────────────────────────────────────────────

function DayDetail({ day, date, blocks, onCheck, onEdit, onDelete, onAdd, onClose }) {
  const sorted = [...blocks].sort((a, b) => (a.startTime || '99').localeCompare(b.startTime || '99'))
  const done   = sorted.filter(b => b.done).length

  return (
    <div className="ops-card border-t-2" style={{ borderTopColor: '#38bdf8' }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-100">{day} — {date}</h3>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {done}/{sorted.length} blocks done
            {sorted.length > 0 && (
              <span className="ml-2" style={{ color: done === sorted.length && sorted.length > 0 ? '#00ff88' : '#6b7280' }}>
                {done === sorted.length && sorted.length > 0 ? '✓ Day complete!' : `${sorted.length - done} remaining`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onAdd} className="ops-btn-primary flex items-center gap-1 text-xs">
            <Plus className="w-3 h-3" /> Add
          </button>
          <button onClick={onClose} className="ops-btn-ghost p-1"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-gray-600">Nothing planned yet. Click Add to build this day.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(block => {
            const c      = cat(block.category)
            const [r,g,b] = hexRgb(c.color)
            return (
              <div
                key={block.id}
                className="flex items-start gap-3 p-3 rounded group transition-all"
                style={{
                  backgroundColor: block.done ? 'rgba(255,255,255,0.02)' : `rgba(${r},${g},${b},0.06)`,
                  borderLeft: `3px solid rgba(${r},${g},${b},${block.done ? 0.2 : 0.6})`,
                  opacity: block.done ? 0.6 : 1,
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => onCheck(block.id)}
                  className="flex-shrink-0 w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-all"
                  style={block.done
                    ? { backgroundColor: `rgba(${r},${g},${b},0.3)`, borderColor: `rgb(${r},${g},${b})` }
                    : { borderColor: `rgba(${r},${g},${b},0.4)` }}
                >
                  {block.done && <Check className="w-3 h-3" style={{ color: `rgb(${r},${g},${b})` }} />}
                </button>

                {/* Icon + Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base leading-none">{c.icon}</span>
                    <span className={`text-sm font-semibold text-gray-100 ${block.done ? 'line-through opacity-50' : ''}`}>
                      {block.text}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: `rgb(${r},${g},${b})`, backgroundColor: `rgba(${r},${g},${b},0.1)` }}>
                      {c.label}
                    </span>
                  </div>
                  {(block.startTime || block.endTime) && (
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      🕐 {block.startTime}{block.endTime ? ` – ${block.endTime}` : ''}
                    </div>
                  )}
                  {block.notes && <p className="text-xs text-gray-500 mt-1">{block.notes}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => onEdit(block)} className="ops-btn-ghost p-1"><Edit3 className="w-3 h-3" /></button>
                  <button onClick={() => onDelete(block.id)} className="ops-btn-danger p-1"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Day column (compact summary) ─────────────────────────────────────────────

function DayColumn({ day, date, isToday, blocks, selected, onSelect, onAdd }) {
  const sorted    = [...blocks].sort((a, b) => (a.startTime || '99').localeCompare(b.startTime || '99'))
  const shown     = sorted.slice(0, 3)
  const overflow  = sorted.length - 3
  const doneCount = sorted.filter(b => b.done).length
  const pct       = sorted.length ? Math.round((doneCount / sorted.length) * 100) : 0

  return (
    <div
      className={`flex flex-col bg-bunker-900 border rounded-lg overflow-hidden cursor-pointer transition-all
        ${selected ? 'border-ops-blue/50 ring-1 ring-ops-blue/20' : isToday ? 'border-ops-amber/40' : 'border-bunker-700 hover:border-bunker-500'}`}
      onClick={() => onSelect(selected ? null : day)}
    >
      {/* Header */}
      <div className={`px-2 py-1.5 border-b flex items-center justify-between
        ${selected ? 'bg-ops-blue/10 border-ops-blue/20' : isToday ? 'bg-ops-amber/10 border-ops-amber/20' : 'bg-bunker-800 border-bunker-700'}`}>
        <div>
          <div className={`text-xs font-bold ${selected ? 'text-ops-blue' : isToday ? 'text-ops-amber' : 'text-gray-300'}`}>{day}</div>
          <div className="text-[9px] text-gray-600">{date}</div>
        </div>
        <div className="flex items-center gap-1">
          {sorted.length > 0 && (
            <div className="text-[9px] text-gray-600">{doneCount}/{sorted.length}</div>
          )}
          <button
            onClick={e => { e.stopPropagation(); onAdd(day) }}
            className="p-0.5 rounded hover:bg-bunker-600 text-gray-600 hover:text-ops-green transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {sorted.length > 0 && (
        <div className="h-0.5 bg-bunker-700">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#00ff88' : '#38bdf8' }}
          />
        </div>
      )}

      {/* Block chips */}
      <div className="flex-1 p-1.5 space-y-0.5 min-h-[110px]">
        {shown.length === 0 && (
          <div className="text-[9px] text-gray-700 text-center pt-5 italic">empty</div>
        )}
        {shown.map(block => {
          const c      = cat(block.category)
          const [r,g,b] = hexRgb(c.color)
          return (
            <div
              key={block.id}
              className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px]"
              style={{ backgroundColor: `rgba(${r},${g},${b},0.1)` }}
            >
              <span className="flex-shrink-0 text-[10px]">{c.icon}</span>
              {block.startTime && <span className="text-gray-600 flex-shrink-0">{block.startTime}</span>}
              <span className={`truncate flex-1 ${block.done ? 'line-through text-gray-600' : ''}`}
                style={{ color: block.done ? undefined : `rgb(${r},${g},${b})` }}>
                {block.text}
              </span>
            </div>
          )
        })}
        {overflow > 0 && (
          <div className="text-[9px] text-gray-600 px-1 flex items-center gap-0.5">
            <ChevronDown className="w-2.5 h-2.5" /> +{overflow} more
          </div>
        )}
      </div>

      {/* Expand hint */}
      <div className={`text-center py-0.5 text-[9px] transition-colors ${selected ? 'text-ops-blue' : 'text-gray-700'}`}>
        {selected ? <span className="flex items-center justify-center gap-0.5"><ChevronUp className="w-2.5 h-2.5" />collapse</span>
                  : <span className="flex items-center justify-center gap-0.5"><ChevronDown className="w-2.5 h-2.5" />expand</span>}
      </div>
    </div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ days }) {
  const allBlocks = DAYS.flatMap(d => (days[d] || []).map(nb))
  const total     = allBlocks.length
  const done      = allBlocks.filter(b => b.done).length

  // category breakdown
  const catCounts = CATEGORIES.map(c => ({
    ...c,
    count: allBlocks.filter(b => b.category === c.id).length,
  })).filter(c => c.count > 0)

  return (
    <div className="ops-card flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-ops-amber" />
        <div>
          <div className="text-lg font-bold text-gray-100 leading-none">{done}<span className="text-gray-600 text-sm">/{total}</span></div>
          <div className="text-[9px] text-gray-600 uppercase tracking-wider">blocks done</div>
        </div>
      </div>

      {total > 0 && (
        <div className="flex-1 min-w-[120px]">
          <div className="h-1.5 bg-bunker-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.round((done / total) * 100)}%`, backgroundColor: done === total ? '#00ff88' : '#f59e0b' }}
            />
          </div>
          <div className="text-[9px] text-gray-600 mt-0.5">{Math.round((done / total) * 100)}% weekly progress</div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {catCounts.map(c => {
          const [r,g,b] = hexRgb(c.color)
          return (
            <div key={c.id} className="flex items-center gap-1 text-[10px]" style={{ color: `rgb(${r},${g},${b})` }}>
              <span>{c.icon}</span>
              <span>{c.count}x {c.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main BattlePlan page ─────────────────────────────────────────────────────

export default function BattlePlan() {
  const { state, update, addXp, ts } = useStore()
  const bp   = state.battlePlan || {}
  const days = bp.days || {}

  const [addModal, setAddModal]   = useState(null)  // null or day string
  const [editModal, setEditModal] = useState(null)  // { block, day }
  const [selectedDay, setSelectedDay] = useState(null)

  // Week display
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }) // Sun
  const weekDates = DAYS.map((_, i) => format(addDays(weekStart, i), 'M/d'))
  const todayName = format(new Date(), 'EEE') // 'Sun', 'Mon' etc.

  // Normalized blocks per day
  const blocksByDay = useMemo(() =>
    Object.fromEntries(DAYS.map(d => [d, (days[d] || []).map(nb)])),
  [days])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const saveIntention = (text) => {
    update(s => { s.battlePlan.intention = text; s.battlePlan.intentionUpdatedAt = ts() })
    addXp(5, 'Set weekly intention')
  }

  const saveNewBlocks = (form) => {
    update(s => {
      form.selectedDays.forEach(day => {
        const block = {
          id: crypto.randomUUID(),
          text:      form.text.trim(),
          category:  form.category,
          startTime: form.startTime,
          endTime:   form.endTime,
          notes:     form.notes,
          done:      false,
          at:        ts(),
        }
        s.battlePlan.days[day] = [...(s.battlePlan.days[day] || []), block]
      })
    })
    addXp(form.selectedDays.length * 5, `Battle block: ${form.text}`)
    setAddModal(null)
  }

  const saveEditBlock = (day, form) => {
    update(s => {
      const arr = s.battlePlan.days[day] || []
      const idx = arr.findIndex(b => b.id === form.id)
      if (idx >= 0) arr[idx] = { ...arr[idx], ...form, updatedAt: ts() }
    })
    setEditModal(null)
  }

  const toggleDone = (day, id) => {
    update(s => {
      const block = (s.battlePlan.days[day] || []).find(b => b.id === id)
      if (!block) return
      block.done = !block.done
      if (block.done) s.battlePlan.days[day] = s.battlePlan.days[day].map(b => b.id === id ? block : b)
    })
    const block = blocksByDay[day]?.find(b => b.id === id)
    if (block && !block.done) addXp(10, `Completed: ${block.text}`)
  }

  const deleteBlock = (day, id) => {
    update(s => { s.battlePlan.days[day] = (s.battlePlan.days[day] || []).filter(b => b.id !== id) })
  }

  const resetDone = () => {
    update(s => {
      DAYS.forEach(day => {
        s.battlePlan.days[day] = (s.battlePlan.days[day] || []).map(b => ({ ...b, done: false }))
      })
    })
  }

  const selectedDayBlocks = selectedDay ? blocksByDay[selectedDay] || [] : []
  const selectedDayDate   = selectedDay ? weekDates[DAYS.indexOf(selectedDay)] : ''

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Add modal */}
      {addModal !== null && (
        <AddBlockModal
          defaultDay={addModal || null}
          onSave={saveNewBlocks}
          onClose={() => setAddModal(null)}
        />
      )}

      {/* Edit modal */}
      {editModal && (
        <EditBlockModal
          block={editModal.block}
          day={editModal.day}
          onSave={form => saveEditBlock(editModal.day, form)}
          onClose={() => setEditModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-ops-amber tracking-widest">// WEEKLY BATTLE PLAN</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Week of {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetDone}
            className="ops-btn-ghost flex items-center gap-1.5 text-xs"
          >
            <RotateCcw className="w-3 h-3" /> Reset Done
          </button>
          <button
            onClick={() => setAddModal('')}
            className="ops-btn-primary flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Block
          </button>
        </div>
      </div>

      {/* Weekly intention */}
      <IntentionCard
        intention={bp.intention || ''}
        updatedAt={bp.intentionUpdatedAt}
        onSave={saveIntention}
      />

      {/* Stats bar */}
      <StatsBar days={days} />

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, di) => (
          <DayColumn
            key={day}
            day={day}
            date={weekDates[di]}
            isToday={day === todayName}
            blocks={blocksByDay[day] || []}
            selected={selectedDay === day}
            onSelect={setSelectedDay}
            onAdd={d => setAddModal(d)}
          />
        ))}
      </div>

      {/* Expanded day detail */}
      {selectedDay && (
        <DayDetail
          day={selectedDay}
          date={selectedDayDate}
          blocks={selectedDayBlocks}
          onCheck={id => toggleDone(selectedDay, id)}
          onEdit={block => setEditModal({ block, day: selectedDay })}
          onDelete={id => deleteBlock(selectedDay, id)}
          onAdd={() => setAddModal(selectedDay)}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Category legend */}
      <div className="ops-card">
        <div className="section-title mb-2">Block Categories</div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => {
            const [r,g,b] = hexRgb(c.color)
            return (
              <div key={c.id} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border"
                style={{ color: `rgb(${r},${g},${b})`, borderColor: `rgba(${r},${g},${b},0.3)`, backgroundColor: `rgba(${r},${g},${b},0.07)` }}>
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
