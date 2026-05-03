import { useState } from 'react'
import { useStore } from '../store/useStore'
import {
  ChevronLeft, ChevronRight, Plus, X, Edit3, Trash2, Check, Tag
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO
} from 'date-fns'

const SUBJECTS = [
  { id: 'boeing',  label: 'Boeing',      color: 'bg-ops-blue/20 text-ops-blue   border-ops-blue/40' },
  { id: 'wgu',     label: 'WGU',         color: 'bg-ops-purple/20 text-ops-purple border-ops-purple/40' },
  { id: 'safedays',label: 'Safe Days',   color: 'bg-ops-green/20 text-ops-green  border-ops-green/40' },
  { id: 'gamedev', label: 'Game Dev',    color: 'bg-ops-amber/20 text-ops-amber  border-ops-amber/40' },
  { id: 'godot',   label: 'Godot',       color: 'bg-ops-lime/20 text-ops-lime    border-ops-lime/40' },
  { id: 'arista',  label: 'Arista',      color: 'bg-ops-cyan/20 text-ops-cyan    border-ops-cyan/40' },
  { id: 'personal',label: 'Personal',   color: 'bg-gray-500/20 text-gray-400    border-gray-500/40' },
]

const DOT_COLORS = {
  boeing: 'bg-ops-blue',
  wgu: 'bg-ops-purple',
  safedays: 'bg-ops-green',
  gamedev: 'bg-ops-amber',
  godot: 'bg-ops-lime',
  arista: 'bg-ops-cyan',
  personal: 'bg-gray-500',
}

const blank = () => ({ id: crypto.randomUUID(), title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', subject: 'personal', notes: '' })

function EventModal({ event, onSave, onClose }) {
  const [form, setForm] = useState(event)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bunker-900 border border-bunker-600 rounded-lg w-full max-w-md p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-100">{event.id && event.title ? 'Edit Event' : 'New Event'}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-gray-200" /></button>
        </div>
        <div>
          <label className="ops-label">Title *</label>
          <input className="ops-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Event title…" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ops-label">Date *</label>
            <input type="date" className="ops-input" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label className="ops-label">Time</label>
            <input type="time" className="ops-input" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="ops-label">Subject / Domain</label>
          <div className="flex flex-wrap gap-1.5">
            {SUBJECTS.map(s => (
              <button
                key={s.id}
                onClick={() => set('subject', s.id)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${form.subject === s.id ? s.color : 'border-bunker-600 text-gray-600 hover:border-gray-500'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="ops-label">Notes</label>
          <textarea className="ops-textarea min-h-[60px]" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Details…" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="ops-btn-ghost">Cancel</button>
          <button onClick={() => form.title.trim() && onSave(form)} className="ops-btn-primary">Save Event</button>
        </div>
      </div>
    </div>
  )
}

function DayEvents({ events, date, onEdit, onDelete }) {
  const dayEvents = events.filter(e => e.date === format(date, 'yyyy-MM-dd'))
  if (!dayEvents.length) return null
  return (
    <div className="space-y-0.5 mt-1">
      {dayEvents.slice(0, 3).map(ev => (
        <div
          key={ev.id}
          className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] cursor-pointer hover:bg-bunker-700 group"
          onClick={e => { e.stopPropagation(); onEdit(ev) }}
        >
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_COLORS[ev.subject] || 'bg-gray-500'}`} />
          <span className="truncate text-gray-300">{ev.title}</span>
        </div>
      ))}
      {dayEvents.length > 3 && <div className="text-[9px] text-gray-600 px-1">+{dayEvents.length - 3} more</div>}
    </div>
  )
}

export default function Calendar() {
  const { state, update, addXp, ts } = useStore()
  const events = state.calendarEvents || []
  const [current, setCurrent] = useState(new Date())
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const saveEvent = (form) => {
    update(s => {
      const idx = (s.calendarEvents || []).findIndex(e => e.id === form.id)
      if (idx >= 0) s.calendarEvents[idx] = { ...form, updatedAt: ts() }
      else s.calendarEvents = [...(s.calendarEvents || []), { ...form, createdAt: ts() }]
    })
    addXp(10, `Calendar: ${form.title}`)
    setModal(null)
  }

  const deleteEvent = (id) => {
    update(s => { s.calendarEvents = (s.calendarEvents || []).filter(e => e.id !== id) })
    setSelected(null)
  }

  const selectedEvents = selected ? events.filter(e => e.date === format(selected, 'yyyy-MM-dd')) : []

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {modal && (
        <EventModal event={modal} onSave={saveEvent} onClose={() => setModal(null)} />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ops-blue tracking-widest">// CALENDAR</h1>
        <button onClick={() => setModal(blank())} className="ops-btn-primary flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Event
        </button>
      </div>

      {/* Subject legend */}
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map(s => (
          <span key={s.id} className={`text-[10px] px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>
        ))}
      </div>

      {/* Month nav */}
      <div className="ops-card">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrent(subMonths(current, 1))} className="ops-btn-ghost p-1">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-gray-100">{format(current, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrent(addMonths(current, 1))} className="ops-btn-ghost p-1">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="text-center text-[10px] text-gray-600 uppercase tracking-wider py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map(day => {
            const inMonth = isSameMonth(day, current)
            const isToday = isSameDay(day, new Date())
            const isSel = selected && isSameDay(day, selected)
            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelected(isSel ? null : day)}
                className={`min-h-[72px] p-1 rounded cursor-pointer transition-all border
                  ${!inMonth ? 'opacity-30' : ''}
                  ${isToday ? 'border-ops-green/40 bg-ops-green/5' : 'border-transparent hover:border-bunker-600 hover:bg-bunker-800'}
                  ${isSel ? 'border-ops-blue/50 bg-ops-blue/5' : ''}
                `}
              >
                <div className={`text-[11px] w-5 h-5 flex items-center justify-center rounded-full mb-0.5
                  ${isToday ? 'bg-ops-green text-bunker-950 font-bold' : 'text-gray-400'}`}>
                  {format(day, 'd')}
                </div>
                <DayEvents
                  events={events}
                  date={day}
                  onEdit={ev => setModal({ ...ev })}
                  onDelete={deleteEvent}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="ops-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-100">{format(selected, 'EEEE, MMMM d')}</h3>
            <button onClick={() => setModal({ ...blank(), date: format(selected, 'yyyy-MM-dd') })} className="ops-btn-primary flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          {selectedEvents.length === 0 && (
            <p className="text-xs text-gray-600">No events. Click Add to create one.</p>
          )}
          <div className="space-y-2">
            {selectedEvents.sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(ev => {
              const subj = SUBJECTS.find(s => s.id === ev.subject)
              return (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded bg-bunker-800 group">
                  {ev.time && <div className="text-xs text-gray-500 flex-shrink-0 w-10">{ev.time}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-100">{ev.title}</div>
                    {subj && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border mt-1 inline-block ${subj.color}`}>{subj.label}</span>
                    )}
                    {ev.notes && <p className="text-xs text-gray-500 mt-1">{ev.notes}</p>}
                    <div className="text-[9px] text-gray-700 mt-1">
                      {ev.createdAt ? `Created ${format(parseISO(ev.createdAt), 'MM/dd/yy HH:mm')}` : ''}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal({ ...ev })} className="ops-btn-ghost p-1"><Edit3 className="w-3 h-3" /></button>
                    <button onClick={() => deleteEvent(ev.id)} className="ops-btn-danger p-1"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
