import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Plus, Trash2, Edit3, Check, X, RefreshCw, Save } from 'lucide-react'
import { format, startOfWeek, addDays } from 'date-fns'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

const BLOCK_COLORS = [
  'border-ops-blue/40 bg-ops-blue/10 text-ops-blue',
  'border-ops-purple/40 bg-ops-purple/10 text-ops-purple',
  'border-ops-green/40 bg-ops-green/10 text-ops-green',
  'border-ops-amber/40 bg-ops-amber/10 text-ops-amber',
  'border-ops-cyan/40 bg-ops-cyan/10 text-ops-cyan',
  'border-ops-lime/40 bg-ops-lime/10 text-ops-lime',
  'border-gray-500/40 bg-gray-500/10 text-gray-400',
]

function BlockItem({ item, onDelete, onEdit }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs group ${BLOCK_COLORS[item.colorIdx % BLOCK_COLORS.length]}`}>
      {item.time && <span className="text-[10px] opacity-60 flex-shrink-0">{item.time}</span>}
      <span className="flex-1 truncate">{item.text}</span>
      <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Edit3 className="w-2.5 h-2.5" />
      </button>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  )
}

function AddBlockPopover({ day, colorIdx, onAdd, onClose }) {
  const [text, setText] = useState('')
  const [time, setTime] = useState('')
  return (
    <div className="absolute z-20 bg-bunker-800 border border-bunker-600 rounded-lg p-3 shadow-xl w-56 top-6 left-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-300">{day}</span>
        <button onClick={onClose}><X className="w-3 h-3 text-gray-500" /></button>
      </div>
      <input type="time" className="ops-input text-xs mb-2" value={time} onChange={e => setTime(e.target.value)} placeholder="Time (optional)" />
      <input
        className="ops-input text-xs mb-2"
        placeholder="Activity…"
        value={text}
        onChange={e => setText(e.target.value)}
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter' && text.trim()) { onAdd({ text: text.trim(), time, colorIdx }); onClose() } if (e.key === 'Escape') onClose() }}
      />
      <button
        onClick={() => { if (text.trim()) { onAdd({ text: text.trim(), time, colorIdx }); onClose() } }}
        className="ops-btn-primary w-full text-center"
      >Add</button>
    </div>
  )
}

export default function BattlePlan() {
  const { state, update, addXp, ts } = useStore()
  const bp = state.battlePlan || {}
  const days = bp.days || {}
  const [editingRhythm, setEditingRhythm] = useState(false)
  const [rhythmDraft, setRhythmDraft] = useState(bp.rhythm || '')
  const [popover, setPopover] = useState(null)

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDates = DAYS.map((_, i) => addDays(weekStart, i))

  const colorIdx = Object.values(days).flat().length % BLOCK_COLORS.length

  const addBlock = (day, item) => {
    update(s => {
      const d = s.battlePlan.days
      d[day] = [...(d[day] || []), { id: crypto.randomUUID(), ...item, at: ts() }]
    })
    addXp(5, `Battle plan block: ${item.text}`)
  }

  const removeBlock = (day, id) => {
    update(s => { s.battlePlan.days[day] = (s.battlePlan.days[day] || []).filter(b => b.id !== id) })
  }

  const saveRhythm = () => {
    update(s => { s.battlePlan.rhythm = rhythmDraft; s.battlePlan.rhythmUpdatedAt = ts() })
    setEditingRhythm(false)
    addXp(10, 'Updated weekly rhythm')
  }

  const clearDay = (day) => {
    update(s => { s.battlePlan.days[day] = [] })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-ops-amber tracking-widest">// WEEKLY BATTLE PLAN</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Week of {format(weekStart, 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Weekly Rhythm */}
      <div className="ops-card">
        <div className="flex items-center justify-between mb-2">
          <span className="section-title mb-0"><RefreshCw className="w-3.5 h-3.5 text-ops-amber" /> Weekly Rhythm</span>
          {!editingRhythm && (
            <button onClick={() => { setRhythmDraft(bp.rhythm || ''); setEditingRhythm(true) }} className="ops-btn-ghost flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>
        {editingRhythm ? (
          <div className="space-y-2">
            <textarea
              className="ops-textarea min-h-[100px]"
              value={rhythmDraft}
              onChange={e => setRhythmDraft(e.target.value)}
              placeholder="Describe your recurring weekly rhythm…&#10;e.g. Mon-Fri: Boeing 8am-4pm, Tue/Thu: Arista study 5-6pm, Sat: WGU 2h, Sun: Godot..."
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={saveRhythm} className="ops-btn-primary flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
              <button onClick={() => setEditingRhythm(false)} className="ops-btn-ghost">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {bp.rhythm || <span className="text-gray-600 italic">No rhythm defined. Click Edit to set your recurring weekly schedule.</span>}
          </div>
        )}
        {bp.rhythmUpdatedAt && (
          <div className="text-[9px] text-gray-700 mt-2">Updated {format(new Date(bp.rhythmUpdatedAt), 'MM/dd/yy HH:mm')}</div>
        )}
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, di) => {
          const blocks = days[day] || []
          const dateLabel = format(weekDates[di], 'MM/dd')
          const isToday = format(new Date(), 'EEEE').slice(0,3) === day
          return (
            <div key={day} className={`flex flex-col bg-bunker-900 border rounded-lg overflow-hidden
              ${isToday ? 'border-ops-amber/40' : 'border-bunker-700'}`}>
              {/* Day header */}
              <div className={`px-2 py-1.5 flex items-center justify-between border-b
                ${isToday ? 'bg-ops-amber/10 border-ops-amber/20' : 'bg-bunker-800 border-bunker-700'}`}>
                <div>
                  <div className={`text-xs font-bold ${isToday ? 'text-ops-amber' : 'text-gray-300'}`}>{day}</div>
                  <div className="text-[9px] text-gray-600">{dateLabel}</div>
                </div>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => setPopover(popover === day ? null : day)}
                    className="p-0.5 rounded hover:bg-bunker-700 text-gray-500 hover:text-ops-green transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Blocks */}
              <div className="flex-1 p-1.5 space-y-1 min-h-[140px] relative">
                {popover === day && (
                  <AddBlockPopover
                    day={day}
                    colorIdx={colorIdx}
                    onAdd={(item) => addBlock(day, item)}
                    onClose={() => setPopover(null)}
                  />
                )}
                {blocks.length === 0 && (
                  <div className="text-[9px] text-gray-700 text-center pt-4">empty</div>
                )}
                {[...blocks].sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(block => (
                  <BlockItem
                    key={block.id}
                    item={block}
                    onDelete={() => removeBlock(day, block.id)}
                    onEdit={() => {
                      const text = prompt('Edit activity:', block.text)
                      if (text && text.trim()) {
                        update(s => {
                          const b = (s.battlePlan.days[day] || []).find(b => b.id === block.id)
                          if (b) b.text = text.trim()
                        })
                      }
                    }}
                  />
                ))}
              </div>

              {blocks.length > 0 && (
                <div className="px-1.5 pb-1.5">
                  <button onClick={() => clearDay(day)} className="text-[9px] text-gray-700 hover:text-ops-red w-full text-center transition-colors">
                    clear
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
