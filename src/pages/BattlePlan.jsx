import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import {
  Plus, X, Edit3, Trash2, Check, Save, RotateCcw, Target,
  Flame, ChevronDown, ChevronUp, Layers, Copy, AlertTriangle
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexRgb(hex) {
  const h = (hex || '#6b7280').replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}

function cat(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
}

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

const blankBlockForm = () => ({
  text: '', category: 'workout', startTime: '', endTime: '', notes: '', selectedDays: [],
})

// Merge week days into template blocks (consolidates same activity across days)
function weekToTemplateBlocks(days) {
  const map = new Map()
  DAYS.forEach(day => {
    (days[day] || []).map(nb).forEach(block => {
      const key = `${block.text}|${block.category}|${block.startTime}|${block.endTime}|${block.notes}`
      if (map.has(key)) {
        map.get(key).selectedDays.push(day)
      } else {
        map.set(key, {
          id: crypto.randomUUID(),
          text:      block.text,
          category:  block.category,
          startTime: block.startTime,
          endTime:   block.endTime,
          notes:     block.notes,
          selectedDays: [day],
        })
      }
    })
  })
  return Array.from(map.values())
}

// ─── Shared day/category form fields (used in both Add & Template editor) ─────

function BlockFormFields({ form, onChange }) {
  const s = (k, v) => onChange({ ...form, [k]: v })
  const toggleDay = (day) => s('selectedDays', form.selectedDays.includes(day)
    ? form.selectedDays.filter(d => d !== day)
    : [...form.selectedDays, day])
  const c = cat(form.category)
  const [r,g,b] = hexRgb(c.color)

  return (
    <div className="space-y-3">
      {/* Activity */}
      <div>
        <label className="ops-label">Activity *</label>
        <input
          className="ops-input"
          value={form.text}
          onChange={e => s('text', e.target.value)}
          placeholder="e.g. Morning run, Arista study, Meal prep…"
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

      {/* Days */}
      <div>
        <label className="ops-label">Days *</label>
        <div className="flex gap-1">
          {DAYS.map(day => {
            const active = form.selectedDays.includes(day)
            return (
              <button key={day} onClick={() => toggleDay(day)}
                className="flex-1 py-1.5 rounded border text-[10px] font-bold transition-all"
                style={active
                  ? { color: `rgb(${r},${g},${b})`, backgroundColor: `rgba(${r},${g},${b},0.15)`, borderColor: `rgba(${r},${g},${b},0.6)` }
                  : { borderColor: '#374151', color: '#4b5563' }}>
                {day.slice(0,2)}
              </button>
            )
          })}
        </div>
        <div className="flex gap-3 mt-1.5">
          {[['All', DAYS], ['Weekdays', ['Mon','Tue','Wed','Thu','Fri']], ['Weekend', ['Sat','Sun']], ['None', []]].map(([label, val]) => (
            <button key={label} onClick={() => s('selectedDays', val)}
              className="text-[10px] text-gray-600 hover:text-gray-300 transition-colors">{label}</button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="ops-label">Notes</label>
        <textarea className="ops-textarea min-h-[44px]" value={form.notes}
          onChange={e => s('notes', e.target.value)} placeholder="Optional details, targets…" />
      </div>
    </div>
  )
}

// ─── Add Block Modal (for current week) ───────────────────────────────────────

function AddBlockModal({ defaultDay, onSave, onClose }) {
  const [form, setForm] = useState({ ...blankBlockForm(), selectedDays: defaultDay ? [defaultDay] : [] })
  const canSave = form.text.trim() && form.selectedDays.length > 0

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bunker-900 border border-bunker-600 rounded-lg w-full max-w-md p-5 space-y-1 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-100">Add Battle Block</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-gray-200" /></button>
        </div>
        <BlockFormFields form={form} onChange={setForm} />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="ops-btn-ghost">Cancel</button>
          <button onClick={() => canSave && onSave(form)}
            className={`ops-btn-primary ${!canSave ? 'opacity-40 cursor-not-allowed' : ''}`}>
            Add to {form.selectedDays.length || '—'} {form.selectedDays.length === 1 ? 'Day' : 'Days'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Block Modal (for current week) ──────────────────────────────────────

function EditBlockModal({ block, day, onSave, onClose }) {
  const [form, setForm] = useState(() => ({ ...nb(block), selectedDays: [day] }))
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bunker-900 border border-bunker-600 rounded-lg w-full max-w-md p-5 space-y-1 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-100">Edit Block — {day}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <BlockFormFields form={form} onChange={setForm} />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="ops-btn-ghost">Cancel</button>
          <button onClick={() => form.text.trim() && onSave(form)} className="ops-btn-primary">Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── Template Editor Modal ────────────────────────────────────────────────────

function TemplateEditorModal({ template, onSave, onClose }) {
  const isEdit = !!template?.id
  const [name, setName]             = useState(template?.name || '')
  const [blocks, setBlocks]         = useState(template?.blocks || [])
  const [blockForm, setBlockForm]   = useState(blankBlockForm())
  const [editingId, setEditingId]   = useState(null)  // id of block being edited in form

  const canSaveBlock    = blockForm.text.trim() && blockForm.selectedDays.length > 0
  const canSaveTemplate = name.trim() && blocks.length > 0

  const commitBlock = () => {
    if (!canSaveBlock) return
    if (editingId) {
      setBlocks(prev => prev.map(b => b.id === editingId ? { ...b, ...blockForm } : b))
      setEditingId(null)
    } else {
      setBlocks(prev => [...prev, { id: crypto.randomUUID(), ...blockForm }])
    }
    setBlockForm(blankBlockForm())
  }

  const startEditBlock = (block) => {
    setEditingId(block.id)
    setBlockForm({ text: block.text, category: block.category, startTime: block.startTime || '',
      endTime: block.endTime || '', notes: block.notes || '', selectedDays: block.selectedDays || [] })
  }

  const cancelEditBlock = () => { setEditingId(null); setBlockForm(blankBlockForm()) }

  const removeBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
    if (editingId === id) cancelEditBlock()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bunker-900 border border-bunker-600 rounded-lg w-full max-w-lg max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-bunker-700">
          <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-ops-amber" />
            {isEdit ? 'Edit Template' : 'New Template'}
          </h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-gray-200" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Template name */}
          <div>
            <label className="ops-label">Template Name *</label>
            <input className="ops-input" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Standard Week, Cut Phase, Exam Sprint…" autoFocus />
          </div>

          {/* Existing blocks */}
          {blocks.length > 0 && (
            <div>
              <label className="ops-label">Blocks in Template ({blocks.length})</label>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {blocks.map(block => {
                  const c       = cat(block.category)
                  const [r,g,b] = hexRgb(c.color)
                  const isEd    = editingId === block.id
                  return (
                    <div key={block.id}
                      className="flex items-center gap-2 px-2.5 py-2 rounded border text-xs transition-all"
                      style={{ borderColor: isEd ? `rgba(${r},${g},${b},0.6)` : '#374151', backgroundColor: isEd ? `rgba(${r},${g},${b},0.08)` : 'transparent' }}>
                      <span className="text-base leading-none flex-shrink-0">{c.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate" style={{ color: `rgb(${r},${g},${b})` }}>{block.text}</div>
                        <div className="text-gray-600 text-[9px] mt-0.5">
                          {block.selectedDays.map(d => d.slice(0,2)).join(' · ')}
                          {block.startTime && ` · ${block.startTime}${block.endTime ? `–${block.endTime}` : ''}`}
                        </div>
                      </div>
                      <button onClick={() => isEd ? cancelEditBlock() : startEditBlock(block)}
                        className="ops-btn-ghost p-1 flex-shrink-0">
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeBlock(block.id)} className="ops-btn-danger p-1 flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Block form (add or edit) */}
          <div className="border border-bunker-600 rounded-lg p-3 space-y-3 bg-bunker-800/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">
                {editingId ? '✏️ Editing Block' : '+ Add Block to Template'}
              </span>
              {editingId && (
                <button onClick={cancelEditBlock} className="text-[10px] text-gray-600 hover:text-gray-400">Cancel edit</button>
              )}
            </div>
            <BlockFormFields form={blockForm} onChange={setBlockForm} />
            <button
              onClick={commitBlock}
              className={`ops-btn-primary w-full text-center ${!canSaveBlock ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {editingId ? 'Update Block' : `Add Block to Template`}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-5 border-t border-bunker-700">
          <span className="text-[10px] text-gray-600">
            {blocks.length === 0 ? 'Add at least one block to save' : `${blocks.length} block${blocks.length !== 1 ? 's' : ''} ready`}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="ops-btn-ghost">Cancel</button>
            <button
              onClick={() => canSaveTemplate && onSave({ name: name.trim(), blocks })}
              className={`ops-btn-primary flex items-center gap-1.5 ${!canSaveTemplate ? 'opacity-40 cursor-not-allowed' : ''}`}>
              <Save className="w-3.5 h-3.5" />
              {isEdit ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Save-as-template name modal ──────────────────────────────────────────────

function SaveAsModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bunker-900 border border-bunker-600 rounded-lg w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
            <Copy className="w-4 h-4 text-ops-amber" /> Save Week as Template
          </h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <p className="text-xs text-gray-500">
          Current week blocks will be consolidated and saved as a reusable template.
        </p>
        <div>
          <label className="ops-label">Template Name *</label>
          <input className="ops-input" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. My Standard Week…" autoFocus
            onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim())} />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="ops-btn-ghost">Cancel</button>
          <button onClick={() => name.trim() && onSave(name.trim())}
            className={`ops-btn-primary ${!name.trim() ? 'opacity-40' : ''}`}>Save Template</button>
        </div>
      </div>
    </div>
  )
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({ template, onApply, onEdit, onDelete }) {
  const [applyMode, setApplyMode] = useState(false)

  // Build day→blocks map for preview
  const dayMap = useMemo(() => {
    const m = {}
    DAYS.forEach(d => { m[d] = [] })
    template.blocks.forEach(b => {
      b.selectedDays.forEach(d => { if (m[d]) m[d].push(b) })
    })
    return m
  }, [template.blocks])

  const totalSlots = template.blocks.reduce((acc, b) => acc + b.selectedDays.length, 0)
  const uniqueCats = [...new Set(template.blocks.map(b => b.category))]

  return (
    <div className="bg-bunker-800 border border-bunker-600 rounded-lg p-3 space-y-2.5 hover:border-bunker-500 transition-colors">
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-gray-100 truncate">{template.name}</h4>
          <div className="text-[9px] text-gray-600 mt-0.5">
            {template.blocks.length} block{template.blocks.length !== 1 ? 's' : ''} · {totalSlots} slots/week
            {' · '}{uniqueCats.map(id => cat(id).icon).join(' ')}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onEdit(template)} className="ops-btn-ghost p-1"><Edit3 className="w-3 h-3" /></button>
          <button onClick={() => onDelete(template.id)} className="ops-btn-danger p-1"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>

      {/* Mini day preview grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS.map(day => {
          const dayBlocks = dayMap[day] || []
          return (
            <div key={day} className="flex flex-col items-center gap-0.5">
              <div className="text-[8px] text-gray-700 uppercase">{day.slice(0,2)}</div>
              <div className="flex flex-col gap-px items-center min-h-[20px]">
                {dayBlocks.slice(0,4).map(b => {
                  const [r,g,bb] = hexRgb(cat(b.category).color)
                  return (
                    <div key={b.id} title={b.text}
                      className="w-2 h-2 rounded-sm"
                      style={{ backgroundColor: `rgb(${r},${g},${bb})` }} />
                  )
                })}
                {dayBlocks.length > 4 && <div className="text-[7px] text-gray-700">+{dayBlocks.length - 4}</div>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Apply button / confirmation */}
      {!applyMode ? (
        <button
          onClick={() => setApplyMode(true)}
          className="ops-btn-primary w-full flex items-center justify-center gap-1.5 text-xs">
          <Layers className="w-3.5 h-3.5" /> Apply This Week
        </button>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[10px] text-ops-amber">
            <AlertTriangle className="w-3 h-3" /> How should this apply?
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => { onApply(template, 'merge'); setApplyMode(false) }}
              className="ops-btn-ghost text-[10px] py-1.5 text-center">
              ➕ Merge with week
            </button>
            <button
              onClick={() => { onApply(template, 'replace'); setApplyMode(false) }}
              className="text-[10px] py-1.5 px-2 rounded border border-ops-amber/40 text-ops-amber hover:bg-ops-amber/10 transition-colors">
              🔄 Clear &amp; Replace
            </button>
          </div>
          <button onClick={() => setApplyMode(false)} className="text-[10px] text-gray-700 hover:text-gray-500 w-full text-center">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Templates Section ────────────────────────────────────────────────────────

function TemplatesSection({ templates, days, onApply, onNew, onSaveWeek, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const hasBlocks = DAYS.some(d => (days[d] || []).length > 0)

  return (
    <div className="ops-card">
      <button
        className="flex items-center justify-between w-full"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-ops-amber" />
          <span className="text-xs font-bold text-ops-amber uppercase tracking-wider">Templates</span>
          {templates.length > 0 && (
            <span className="text-[9px] text-gray-600 border border-bunker-600 rounded px-1">
              {templates.length} saved
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-600" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600" />}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={onNew} className="ops-btn-primary flex items-center gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> New Template
            </button>
            <button
              onClick={onSaveWeek}
              disabled={!hasBlocks}
              className={`ops-btn-ghost flex items-center gap-1.5 text-xs ${!hasBlocks ? 'opacity-40 cursor-not-allowed' : ''}`}>
              <Copy className="w-3.5 h-3.5" /> Save Current Week as Template
            </button>
          </div>

          {/* Template grid */}
          {templates.length === 0 ? (
            <div className="text-xs text-gray-600 italic py-2">
              No templates yet. Build your week and save it, or create one from scratch.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {templates.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onApply={onApply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Intention Card ───────────────────────────────────────────────────────────

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
          <textarea className="ops-textarea min-h-[70px]" value={draft} onChange={e => setDraft(e.target.value)}
            placeholder="What's the focus this week? e.g. Lock in Arista every evening. Hit the gym 4x. No junk food…"
            autoFocus />
          <div className="flex gap-2">
            <button onClick={save} className="ops-btn-primary flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
            <button onClick={() => setEditing(false)} className="ops-btn-ghost">Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          {intention
            ? <p className="text-sm text-gray-200 leading-relaxed italic">"{intention}"</p>
            : <p className="text-xs text-gray-600 italic">No intention set. Click Set to define this week's focus.</p>}
          {updatedAt && <div className="text-[9px] text-gray-700 mt-1.5">Set {format(new Date(updatedAt), 'EEE MMM d, HH:mm')}</div>}
        </div>
      )}
    </div>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ days }) {
  const allBlocks = DAYS.flatMap(d => (days[d] || []).map(nb))
  const total     = allBlocks.length
  const done      = allBlocks.filter(b => b.done).length
  const catCounts = CATEGORIES.map(c => ({ ...c, count: allBlocks.filter(b => b.category === c.id).length })).filter(c => c.count > 0)

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
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.round((done / total) * 100)}%`, backgroundColor: done === total ? '#00ff88' : '#f59e0b' }} />
          </div>
          <div className="text-[9px] text-gray-600 mt-0.5">{Math.round((done / total) * 100)}% weekly progress</div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {catCounts.map(c => {
          const [r,g,b] = hexRgb(c.color)
          return (
            <div key={c.id} className="flex items-center gap-1 text-[10px]" style={{ color: `rgb(${r},${g},${b})` }}>
              <span>{c.icon}</span><span>{c.count}x {c.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────

function DayDetail({ day, date, blocks, onCheck, onEdit, onDelete, onAdd, onClose }) {
  const sorted   = [...blocks].sort((a, b) => (a.startTime || '99').localeCompare(b.startTime || '99'))
  const doneCount = sorted.filter(b => b.done).length

  return (
    <div className="ops-card border-t-2" style={{ borderTopColor: '#38bdf8' }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-100">{day} — {date}</h3>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {doneCount}/{sorted.length} blocks done
            {sorted.length > 0 && (
              <span className="ml-2" style={{ color: doneCount === sorted.length && sorted.length > 0 ? '#00ff88' : '#6b7280' }}>
                {doneCount === sorted.length && sorted.length > 0 ? '✓ Day complete!' : `${sorted.length - doneCount} remaining`}
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
            const c       = cat(block.category)
            const [r,g,b] = hexRgb(c.color)
            return (
              <div key={block.id}
                className="flex items-start gap-3 p-3 rounded group transition-all"
                style={{
                  backgroundColor: block.done ? 'rgba(255,255,255,0.02)' : `rgba(${r},${g},${b},0.06)`,
                  borderLeft: `3px solid rgba(${r},${g},${b},${block.done ? 0.2 : 0.6})`,
                  opacity: block.done ? 0.6 : 1,
                }}>
                <button onClick={() => onCheck(block.id)}
                  className="flex-shrink-0 w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-all"
                  style={block.done
                    ? { backgroundColor: `rgba(${r},${g},${b},0.3)`, borderColor: `rgb(${r},${g},${b})` }
                    : { borderColor: `rgba(${r},${g},${b},0.4)` }}>
                  {block.done && <Check className="w-3 h-3" style={{ color: `rgb(${r},${g},${b})` }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base leading-none">{c.icon}</span>
                    <span className={`text-sm font-semibold text-gray-100 ${block.done ? 'line-through opacity-50' : ''}`}>{block.text}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ color: `rgb(${r},${g},${b})`, backgroundColor: `rgba(${r},${g},${b},0.1)` }}>
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

// ─── Day Column ───────────────────────────────────────────────────────────────

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
      <div className={`px-2 py-1.5 border-b flex items-center justify-between
        ${selected ? 'bg-ops-blue/10 border-ops-blue/20' : isToday ? 'bg-ops-amber/10 border-ops-amber/20' : 'bg-bunker-800 border-bunker-700'}`}>
        <div>
          <div className={`text-xs font-bold ${selected ? 'text-ops-blue' : isToday ? 'text-ops-amber' : 'text-gray-300'}`}>{day}</div>
          <div className="text-[9px] text-gray-600">{date}</div>
        </div>
        <div className="flex items-center gap-1">
          {sorted.length > 0 && <div className="text-[9px] text-gray-600">{doneCount}/{sorted.length}</div>}
          <button onClick={e => { e.stopPropagation(); onAdd(day) }}
            className="p-0.5 rounded hover:bg-bunker-600 text-gray-600 hover:text-ops-green transition-colors">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="h-0.5 bg-bunker-700">
          <div className="h-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#00ff88' : '#38bdf8' }} />
        </div>
      )}

      <div className="flex-1 p-1.5 space-y-0.5 min-h-[110px]">
        {shown.length === 0 && <div className="text-[9px] text-gray-700 text-center pt-5 italic">empty</div>}
        {shown.map(block => {
          const c       = cat(block.category)
          const [r,g,b] = hexRgb(c.color)
          return (
            <div key={block.id} className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px]"
              style={{ backgroundColor: `rgba(${r},${g},${b},0.1)` }}>
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

      <div className={`text-center py-0.5 text-[9px] ${selected ? 'text-ops-blue' : 'text-gray-700'}`}>
        {selected
          ? <span className="flex items-center justify-center gap-0.5"><ChevronUp className="w-2.5 h-2.5" />collapse</span>
          : <span className="flex items-center justify-center gap-0.5"><ChevronDown className="w-2.5 h-2.5" />expand</span>}
      </div>
    </div>
  )
}

// ─── Main BattlePlan ──────────────────────────────────────────────────────────

export default function BattlePlan() {
  const { state, update, addXp, ts } = useStore()
  const bp        = state.battlePlan || {}
  const days      = bp.days || {}
  const templates = bp.templates || []

  const [addModal, setAddModal]         = useState(null)   // null | day string
  const [editModal, setEditModal]       = useState(null)   // { block, day }
  const [selectedDay, setSelectedDay]   = useState(null)
  const [tmplEditor, setTmplEditor]     = useState(null)   // null | template obj (empty={} for new)
  const [saveAsModal, setSaveAsModal]   = useState(false)

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
  const weekDates = DAYS.map((_, i) => format(addDays(weekStart, i), 'M/d'))
  const todayName = format(new Date(), 'EEE')

  const blocksByDay = useMemo(() =>
    Object.fromEntries(DAYS.map(d => [d, (days[d] || []).map(nb)])),
  [days])

  // ── Week block handlers ────────────────────────────────────────────────────

  const saveNewBlocks = (form) => {
    update(s => {
      form.selectedDays.forEach(day => {
        const block = { id: crypto.randomUUID(), text: form.text.trim(), category: form.category,
          startTime: form.startTime, endTime: form.endTime, notes: form.notes, done: false, at: ts() }
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
    const block = blocksByDay[day]?.find(b => b.id === id)
    update(s => {
      const b = (s.battlePlan.days[day] || []).find(b => b.id === id)
      if (b) b.done = !b.done
    })
    if (block && !block.done) addXp(10, `Completed: ${block.text}`)
  }

  const deleteBlock = (day, id) => {
    update(s => { s.battlePlan.days[day] = (s.battlePlan.days[day] || []).filter(b => b.id !== id) })
  }

  const resetDone = () => {
    update(s => { DAYS.forEach(day => {
      s.battlePlan.days[day] = (s.battlePlan.days[day] || []).map(b => ({ ...b, done: false }))
    }) })
  }

  const saveIntention = (text) => {
    update(s => { s.battlePlan.intention = text; s.battlePlan.intentionUpdatedAt = ts() })
    addXp(5, 'Set weekly intention')
  }

  // ── Template handlers ──────────────────────────────────────────────────────

  const saveTemplate = (data) => {
    update(s => {
      const tmpl = s.battlePlan.templates || []
      if (tmplEditor?.id) {
        const idx = tmpl.findIndex(t => t.id === tmplEditor.id)
        if (idx >= 0) tmpl[idx] = { ...tmpl[idx], ...data, updatedAt: ts() }
      } else {
        tmpl.push({ id: crypto.randomUUID(), ...data, createdAt: ts() })
        s.battlePlan.templates = tmpl
      }
    })
    addXp(15, `Template saved: ${data.name}`)
    setTmplEditor(null)
  }

  const deleteTemplate = (id) => {
    update(s => { s.battlePlan.templates = (s.battlePlan.templates || []).filter(t => t.id !== id) })
  }

  const applyTemplate = (template, mode) => {
    update(s => {
      if (mode === 'replace') DAYS.forEach(day => { s.battlePlan.days[day] = [] })
      template.blocks.forEach(block => {
        block.selectedDays.forEach(day => {
          const newBlock = { id: crypto.randomUUID(), text: block.text, category: block.category,
            startTime: block.startTime, endTime: block.endTime, notes: block.notes,
            done: false, at: ts(), fromTemplate: template.id }
          s.battlePlan.days[day] = [...(s.battlePlan.days[day] || []), newBlock]
        })
      })
    })
    addXp(20, `Applied template: ${template.name}`)
  }

  const saveCurrentWeekAsTemplate = (name) => {
    const blocks = weekToTemplateBlocks(days)
    if (!blocks.length) return
    update(s => {
      const tmpl = s.battlePlan.templates || []
      tmpl.push({ id: crypto.randomUUID(), name, blocks, createdAt: ts() })
      s.battlePlan.templates = tmpl
    })
    addXp(15, `Template saved: ${name}`)
    setSaveAsModal(false)
  }

  const selectedDayBlocks = selectedDay ? blocksByDay[selectedDay] || [] : []
  const selectedDayDate   = selectedDay ? weekDates[DAYS.indexOf(selectedDay)] : ''

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Modals */}
      {addModal !== null && (
        <AddBlockModal defaultDay={addModal || null} onSave={saveNewBlocks} onClose={() => setAddModal(null)} />
      )}
      {editModal && (
        <EditBlockModal block={editModal.block} day={editModal.day}
          onSave={form => saveEditBlock(editModal.day, form)} onClose={() => setEditModal(null)} />
      )}
      {tmplEditor !== null && (
        <TemplateEditorModal template={tmplEditor?.id ? tmplEditor : null}
          onSave={saveTemplate} onClose={() => setTmplEditor(null)} />
      )}
      {saveAsModal && (
        <SaveAsModal onSave={saveCurrentWeekAsTemplate} onClose={() => setSaveAsModal(false)} />
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
          <button onClick={resetDone} className="ops-btn-ghost flex items-center gap-1.5 text-xs">
            <RotateCcw className="w-3 h-3" /> Reset Done
          </button>
          <button onClick={() => setAddModal('')} className="ops-btn-primary flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Block
          </button>
        </div>
      </div>

      {/* Intention */}
      <IntentionCard intention={bp.intention || ''} updatedAt={bp.intentionUpdatedAt} onSave={saveIntention} />

      {/* Stats */}
      <StatsBar days={days} />

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, di) => (
          <DayColumn key={day} day={day} date={weekDates[di]} isToday={day === todayName}
            blocks={blocksByDay[day] || []} selected={selectedDay === day}
            onSelect={setSelectedDay} onAdd={d => setAddModal(d)} />
        ))}
      </div>

      {/* Day detail */}
      {selectedDay && (
        <DayDetail day={selectedDay} date={selectedDayDate} blocks={selectedDayBlocks}
          onCheck={id => toggleDone(selectedDay, id)}
          onEdit={block => setEditModal({ block, day: selectedDay })}
          onDelete={id => deleteBlock(selectedDay, id)}
          onAdd={() => setAddModal(selectedDay)}
          onClose={() => setSelectedDay(null)} />
      )}

      {/* Templates */}
      <TemplatesSection
        templates={templates}
        days={days}
        onApply={applyTemplate}
        onNew={() => setTmplEditor({})}
        onSaveWeek={() => setSaveAsModal(true)}
        onEdit={t => setTmplEditor(t)}
        onDelete={deleteTemplate}
      />

      {/* Category legend */}
      <div className="ops-card">
        <div className="section-title mb-2">Block Categories</div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => {
            const [r,g,b] = hexRgb(c.color)
            return (
              <div key={c.id} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border"
                style={{ color: `rgb(${r},${g},${b})`, borderColor: `rgba(${r},${g},${b},0.3)`, backgroundColor: `rgba(${r},${g},${b},0.07)` }}>
                <span>{c.icon}</span><span>{c.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
