import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { ChevronLeft, ChevronRight, Plus, X, Edit3, Trash2, Clock, CalendarDays } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO
} from 'date-fns'

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexRgb(hex) {
  const h = (hex || '#6b7280').replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERSONAL = { id: 'personal', title: 'Personal', accentColor: '#6b7280' }

const PRIORITIES = [
  { id: 'low',      label: 'Low',      color: '#22d3ee' },
  { id: 'normal',   label: 'Normal',   color: '#6b7280' },
  { id: 'high',     label: 'High',     color: '#f59e0b' },
  { id: 'critical', label: 'Critical', color: '#ef4444' },
]

// ─── Event helpers ────────────────────────────────────────────────────────────

function normalizeEvent(ev) {
  return {
    ...ev,
    startDate:  ev.startDate  || ev.date || format(new Date(), 'yyyy-MM-dd'),
    endDate:    ev.endDate    || ev.startDate || ev.date || format(new Date(), 'yyyy-MM-dd'),
    startTime:  ev.startTime  || ev.time  || '',
    endTime:    ev.endTime    || '',
    allDay:     ev.allDay     ?? false,
    priority:   ev.priority   || 'normal',
    notes:      ev.notes      || '',
    subject:    ev.subject    || 'personal',
  }
}

function eventCoversDay(ev, day) {
  const d = format(day, 'yyyy-MM-dd')
  return d >= ev.startDate && d <= ev.endDate
}

function isMultiDay(ev) {
  return ev.startDate !== ev.endDate
}

function blankEvent(date) {
  const d = date || format(new Date(), 'yyyy-MM-dd')
  return {
    id: crypto.randomUUID(),
    title:     '',
    startDate: d,
    endDate:   d,
    startTime: '',
    endTime:   '',
    allDay:    false,
    subject:   'personal',
    priority:  'normal',
    notes:     '',
  }
}

// ─── EventModal ───────────────────────────────────────────────────────────────

function EventModal({ event, subjects, onSave, onClose }) {
  const [form, setForm] = useState(() => normalizeEvent(event))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAllDay = (checked) => {
    setForm(f => ({ ...f, allDay: checked, startTime: checked ? '' : f.startTime, endTime: checked ? '' : f.endTime }))
  }
  const handleStartDate = (v) => {
    setForm(f => ({ ...f, startDate: v, endDate: f.endDate < v ? v : f.endDate }))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bunker-900 border border-bunker-600 rounded-lg w-full max-w-lg p-5 space-y-4 max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-100">{event.title ? 'Edit Event' : 'New Event'}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-gray-200" /></button>
        </div>

        {/* Title */}
        <div>
          <label className="ops-label">Title *</label>
          <input
            className="ops-input"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Event title…"
            autoFocus
          />
        </div>

        {/* All Day toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={form.allDay}
              onChange={e => handleAllDay(e.target.checked)}
            />
            <div className="w-9 h-5 bg-bunker-700 rounded-full peer peer-checked:bg-ops-green/60
              after:content-[''] after:absolute after:top-0.5 after:left-[2px]
              after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
              peer-checked:after:translate-x-full" />
          </div>
          <span className="text-xs text-gray-300">All Day Event</span>
        </label>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ops-label">Start Date *</label>
            <input
              type="date"
              className="ops-input"
              value={form.startDate}
              onChange={e => handleStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="ops-label">End Date</label>
            <input
              type="date"
              className="ops-input"
              value={form.endDate}
              min={form.startDate}
              onChange={e => set('endDate', e.target.value)}
            />
          </div>
        </div>

        {/* Times — hidden when all day */}
        {!form.allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ops-label">Start Time</label>
              <input
                type="time"
                className="ops-input"
                value={form.startTime}
                onChange={e => set('startTime', e.target.value)}
              />
            </div>
            <div>
              <label className="ops-label">End Time</label>
              <input
                type="time"
                className="ops-input"
                value={form.endTime}
                onChange={e => set('endTime', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Subject — dynamically from SITREP cards */}
        <div>
          <label className="ops-label">Domain / Subject</label>
          <div className="flex flex-wrap gap-1.5">
            {subjects.map(s => {
              const active = form.subject === s.id
              const [r,g,b] = hexRgb(s.accentColor)
              return (
                <button
                  key={s.id}
                  onClick={() => set('subject', s.id)}
                  className="text-[10px] px-2 py-0.5 rounded-full border transition-all"
                  style={active ? {
                    color: `rgb(${r},${g},${b})`,
                    backgroundColor: `rgba(${r},${g},${b},0.15)`,
                    borderColor: `rgba(${r},${g},${b},0.6)`,
                  } : { borderColor: '#374151', color: '#6b7280' }}
                >
                  {s.title}
                </button>
              )
            })}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="ops-label">Priority</label>
          <div className="flex gap-1.5 flex-wrap">
            {PRIORITIES.map(p => {
              const active = form.priority === p.id
              const [pr,pg,pb] = hexRgb(p.color)
              return (
                <button
                  key={p.id}
                  onClick={() => set('priority', p.id)}
                  className="text-[10px] px-2.5 py-0.5 rounded border transition-all"
                  style={active ? {
                    color: `rgb(${pr},${pg},${pb})`,
                    backgroundColor: `rgba(${pr},${pg},${pb},0.15)`,
                    borderColor: `rgba(${pr},${pg},${pb},0.6)`,
                  } : { borderColor: '#374151', color: '#6b7280' }}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="ops-label">Notes</label>
          <textarea
            className="ops-textarea min-h-[60px]"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Details, links, context…"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="ops-btn-ghost">Cancel</button>
          <button
            onClick={() => form.title.trim() && onSave(form)}
            className="ops-btn-primary"
          >
            Save Event
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Day cell mini-events ─────────────────────────────────────────────────────

function DayCell({ day, events, subjects, onEdit }) {
  const dayEvents = events.filter(ev => eventCoversDay(ev, day))
  const sorted = [...dayEvents].sort((a, b) => {
    const aBar = a.allDay || isMultiDay(a)
    const bBar = b.allDay || isMultiDay(b)
    if (aBar && !bBar) return -1
    if (!aBar && bBar) return 1
    return (a.startTime || '').localeCompare(b.startTime || '')
  })
  const shown = sorted.slice(0, 2)
  const overflow = sorted.length - 2

  return (
    <div className="space-y-0.5 mt-0.5">
      {shown.map(ev => {
        const subj = subjects.find(s => s.id === ev.subject) || PERSONAL
        const [r,g,b] = hexRgb(subj.accentColor)
        const isBar = ev.allDay || isMultiDay(ev)
        return (
          <div
            key={ev.id}
            onClick={e => { e.stopPropagation(); onEdit(ev) }}
            className="text-[9px] px-1 py-0.5 rounded cursor-pointer truncate leading-tight"
            style={isBar
              ? { backgroundColor: `rgba(${r},${g},${b},0.22)`, color: `rgb(${r},${g},${b})` }
              : { display: 'flex', alignItems: 'center', gap: '3px', color: '#d1d5db' }}
          >
            {isBar ? ev.title : (
              <>
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `rgb(${r},${g},${b})` }}
                />
                <span className="truncate">{ev.title}</span>
              </>
            )}
          </div>
        )
      })}
      {overflow > 0 && (
        <div className="text-[9px] text-gray-600 px-1">+{overflow} more</div>
      )}
    </div>
  )
}

// ─── Upcoming events panel ────────────────────────────────────────────────────

function UpcomingPanel({ events, subjects, onEdit }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const upcoming = [...events]
    .filter(ev => ev.endDate >= today)
    .sort((a, b) => {
      const dc = a.startDate.localeCompare(b.startDate)
      if (dc !== 0) return dc
      return (a.startTime || '').localeCompare(b.startTime || '')
    })
    .slice(0, 8)

  return (
    <div className="ops-card">
      <div className="section-title">
        <CalendarDays className="w-3.5 h-3.5" />
        UPCOMING EVENTS
      </div>
      {upcoming.length === 0 ? (
        <p className="text-xs text-gray-600">No upcoming events scheduled.</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map(ev => {
            const subj = subjects.find(s => s.id === ev.subject) || PERSONAL
            const [r,g,b] = hexRgb(subj.accentColor)
            const priority = PRIORITIES.find(p => p.id === ev.priority)
            const multi = ev.startDate !== ev.endDate
            return (
              <div
                key={ev.id}
                className="flex items-start gap-3 p-2.5 rounded cursor-pointer hover:bg-bunker-800 transition-colors group"
                style={{ borderLeft: `3px solid rgba(${r},${g},${b},0.5)`, paddingLeft: '10px' }}
                onClick={() => onEdit(ev)}
              >
                {/* Date badge */}
                <div className="flex-shrink-0 text-center w-9">
                  <div className="text-[9px] text-gray-500 uppercase leading-none">
                    {format(parseISO(ev.startDate), 'MMM')}
                  </div>
                  <div className="text-lg font-bold leading-tight" style={{ color: `rgb(${r},${g},${b})` }}>
                    {format(parseISO(ev.startDate), 'd')}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-gray-100 truncate">{ev.title}</span>
                    {priority && priority.id !== 'normal' && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ color: priority.color, backgroundColor: `${priority.color}20` }}
                      >
                        {priority.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full border"
                      style={{
                        color: `rgb(${r},${g},${b})`,
                        borderColor: `rgba(${r},${g},${b},0.4)`,
                        backgroundColor: `rgba(${r},${g},${b},0.08)`,
                      }}
                    >
                      {subj.title}
                    </span>
                    {ev.allDay ? (
                      <span className="text-[9px] text-gray-600">All Day</span>
                    ) : ev.startTime ? (
                      <span className="text-[9px] text-gray-500 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                      </span>
                    ) : null}
                    {multi && (
                      <span className="text-[9px] text-gray-600">
                        → {format(parseISO(ev.endDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                  {ev.notes && <p className="text-[10px] text-gray-600 mt-0.5 truncate">{ev.notes}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Calendar page ───────────────────────────────────────────────────────

export default function Calendar() {
  const { state, update, addXp, ts } = useStore()
  const rawEvents = state.calendarEvents || []
  const events = useMemo(() => rawEvents.map(normalizeEvent), [rawEvents])

  const [current, setCurrent]   = useState(new Date())
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)

  // Build subjects from live SITREP cards + personal fallback
  const subjects = useMemo(() => {
    const cards = (state.sitrep?.cards || []).map(c => ({
      id: c.id,
      title: c.title,
      accentColor: c.accentColor || '#6b7280',
    }))
    if (!cards.find(c => c.id === 'personal')) cards.push(PERSONAL)
    return cards
  }, [state.sitrep?.cards])

  // Calendar grid
  const monthStart = startOfMonth(current)
  const monthEnd   = endOfMonth(current)
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd     = endOfWeek(monthEnd,   { weekStartsOn: 1 })
  const days       = eachDayOfInterval({ start: calStart, end: calEnd })

  // Handlers
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

  const selectedEvents = selected
    ? events.filter(ev => eventCoversDay(ev, selected)).sort((a, b) => {
        if (a.allDay && !b.allDay) return -1
        if (!a.allDay && b.allDay) return 1
        return (a.startTime || '').localeCompare(b.startTime || '')
      })
    : []

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {modal && (
        <EventModal
          event={modal}
          subjects={subjects}
          onSave={saveEvent}
          onClose={() => setModal(null)}
        />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ops-blue tracking-widest">// CALENDAR</h1>
        <button
          onClick={() => setModal(blankEvent())}
          className="ops-btn-primary flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> New Event
        </button>
      </div>

      {/* Domain legend — live from SITREP cards */}
      <div className="flex flex-wrap gap-1.5">
        {subjects.map(s => {
          const [r,g,b] = hexRgb(s.accentColor)
          return (
            <span
              key={s.id}
              className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{
                color: `rgb(${r},${g},${b})`,
                borderColor: `rgba(${r},${g},${b},0.4)`,
                backgroundColor: `rgba(${r},${g},${b},0.08)`,
              }}
            >
              {s.title}
            </span>
          )
        })}
      </div>

      {/* Calendar grid */}
      <div className="ops-card">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrent(subMonths(current, 1))} className="ops-btn-ghost p-1">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-100">{format(current, 'MMMM yyyy')}</span>
            <button
              onClick={() => { setCurrent(new Date()); setSelected(new Date()) }}
              className="text-[10px] ops-btn-ghost px-2 py-0.5"
            >
              Today
            </button>
          </div>
          <button onClick={() => setCurrent(addMonths(current, 1))} className="ops-btn-ghost p-1">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="text-center text-[10px] text-gray-600 uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map(day => {
            const inMonth = isSameMonth(day, current)
            const isToday = isSameDay(day, new Date())
            const isSel   = selected && isSameDay(day, selected)
            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelected(isSel ? null : day)}
                className={[
                  'min-h-[80px] p-1 rounded cursor-pointer transition-all border',
                  !inMonth ? 'opacity-30' : '',
                  isToday && !isSel ? 'border-ops-green/40 bg-ops-green/5' : '',
                  isSel ? 'border-ops-blue/50 bg-ops-blue/5' : '',
                  !isToday && !isSel ? 'border-transparent hover:border-bunker-600 hover:bg-bunker-800' : '',
                ].join(' ')}
              >
                <div className={`text-[11px] w-5 h-5 flex items-center justify-center rounded-full mb-0.5
                  ${isToday ? 'bg-ops-green text-bunker-950 font-bold' : 'text-gray-400'}`}>
                  {format(day, 'd')}
                </div>
                <DayCell
                  day={day}
                  events={events}
                  subjects={subjects}
                  onEdit={ev => setModal({ ...ev })}
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
            <button
              onClick={() => setModal(blankEvent(format(selected, 'yyyy-MM-dd')))}
              className="ops-btn-primary flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {selectedEvents.length === 0 ? (
            <p className="text-xs text-gray-600">No events. Click Add to create one.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(ev => {
                const subj     = subjects.find(s => s.id === ev.subject) || PERSONAL
                const [r,g,b]  = hexRgb(subj.accentColor)
                const priority = PRIORITIES.find(p => p.id === ev.priority)
                const multi    = ev.startDate !== ev.endDate
                return (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 p-3 rounded group"
                    style={{
                      backgroundColor: `rgba(${r},${g},${b},0.05)`,
                      borderLeft: `3px solid rgba(${r},${g},${b},0.5)`,
                    }}
                  >
                    {/* Time column */}
                    <div className="flex-shrink-0 w-16 text-right pt-0.5">
                      {ev.allDay ? (
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider">All Day</span>
                      ) : ev.startTime ? (
                        <div>
                          <div className="text-xs text-gray-400">{ev.startTime}</div>
                          {ev.endTime && <div className="text-[10px] text-gray-600">{ev.endTime}</div>}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-700">—</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-100">{ev.title}</span>
                        {priority && priority.id !== 'normal' && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                            style={{ color: priority.color, backgroundColor: `${priority.color}20` }}
                          >
                            {priority.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full border"
                          style={{
                            color: `rgb(${r},${g},${b})`,
                            borderColor: `rgba(${r},${g},${b},0.4)`,
                            backgroundColor: `rgba(${r},${g},${b},0.08)`,
                          }}
                        >
                          {subj.title}
                        </span>
                        {multi && (
                          <span className="text-[9px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {format(parseISO(ev.startDate), 'MMM d')} → {format(parseISO(ev.endDate), 'MMM d')}
                          </span>
                        )}
                      </div>
                      {ev.notes && <p className="text-xs text-gray-500 mt-1">{ev.notes}</p>}
                      {ev.createdAt && (
                        <div className="text-[9px] text-gray-700 mt-1">
                          Created {format(parseISO(ev.createdAt), 'MM/dd/yy HH:mm')}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => setModal({ ...ev })} className="ops-btn-ghost p-1">
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button onClick={() => deleteEvent(ev.id)} className="ops-btn-danger p-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Upcoming events */}
      <UpcomingPanel events={events} subjects={subjects} onEdit={ev => setModal({ ...ev })} />
    </div>
  )
}
