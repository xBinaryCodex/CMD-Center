import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { ChevronLeft, ChevronRight, Plus, X, Edit3, Trash2, Clock, CalendarDays, Lock, Repeat, Columns, AlignJustify, Map as MapIcon } from 'lucide-react'
import { isPlanPro, FREE_EVENT_LIMIT } from '../lib/plans'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  addDays, parseISO, getDay, getDate, differenceInDays, isSameWeek,
} from 'date-fns'

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexRgb(hex) {
  const h = (hex || '#6b7280').replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERSONAL = { id: 'personal', title: 'Personal', accentColor: '#6b7280' }

const CATEGORIES = [
  { id: 'workout',   label: 'Workout',   icon: '🏋️', color: '#ef4444' },
  { id: 'study',     label: 'Study',     icon: '📚', color: '#a78bfa' },
  { id: 'work',      label: 'Work',      icon: '💼', color: '#38bdf8' },
  { id: 'recovery',  label: 'Recovery',  icon: '🧘', color: '#00ff88' },
  { id: 'nutrition', label: 'Nutrition', icon: '🥗', color: '#f59e0b' },
  { id: 'project',   label: 'Project',   icon: '⚡', color: '#a3e635' },
  { id: 'habit',     label: 'Habit',     icon: '🔁', color: '#22d3ee' },
  { id: 'social',    label: 'Social',    icon: '🤝', color: '#f472b6' },
  { id: 'custom',    label: 'Custom',    icon: '📌', color: '#6b7280' },
]

const PRIORITIES = [
  { id: 'low',      label: 'Low',      color: '#22d3ee' },
  { id: 'normal',   label: 'Normal',   color: '#6b7280' },
  { id: 'high',     label: 'High',     color: '#f59e0b' },
  { id: 'critical', label: 'Critical', color: '#ef4444' },
]

const WEEK_DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const ORDINALS    = ['1st','2nd','3rd','4th','5th']
const DEFAULT_REC = { type: 'weekly', interval: 1, days: [], monthDay: 1, weekNum: 1, weekDay: 0, endType: 'never', endDate: '' }

// ─── Event helpers ────────────────────────────────────────────────────────────

function normalizeEvent(ev) {
  return {
    ...ev,
    startDate:  ev.startDate  || ev.date || format(new Date(), 'yyyy-MM-dd'),
    endDate:    ev.endDate    || ev.startDate || ev.date || format(new Date(), 'yyyy-MM-dd'),
    startTime:  ev.startTime  || ev.time || '',
    endTime:    ev.endTime    || '',
    allDay:     ev.allDay     ?? false,
    priority:   ev.priority   || 'normal',
    notes:      ev.notes      || '',
    subject:    ev.subject    || 'personal',
    recurrence: ev.recurrence || null,
    exceptions: ev.exceptions || [],
  }
}

// js getDay: 0=Sun…6=Sat  →  our convention: 0=Mon…6=Sun
function jsDayToOur(jsDay) { return jsDay === 0 ? 6 : jsDay - 1 }

function eventOccursOnDay(ev, day) {
  const dayStr = format(day, 'yyyy-MM-dd')

  // Skip exceptions
  if (ev.exceptions && ev.exceptions.includes(dayStr)) return false

  // No recurrence — original span logic
  if (!ev.recurrence || ev.recurrence.type === 'none') {
    return dayStr >= ev.startDate && dayStr <= ev.endDate
  }

  // Must be on or after the event's start
  if (dayStr < ev.startDate) return false

  const rec = ev.recurrence

  // Recurrence end
  if (rec.endType === 'date' && rec.endDate && dayStr > rec.endDate) return false

  switch (rec.type) {
    case 'daily': {
      const diff     = differenceInDays(day, parseISO(ev.startDate))
      const interval = rec.interval || 1
      return diff >= 0 && diff % interval === 0
    }
    case 'weekly': {
      if (!rec.days || rec.days.length === 0) return false
      const ourDay = jsDayToOur(getDay(day))
      if (!rec.days.includes(ourDay)) return false
      const interval = rec.interval || 1
      if (interval > 1) {
        const diffDays  = differenceInDays(day, parseISO(ev.startDate))
        const diffWeeks = Math.floor(diffDays / 7)
        return diffWeeks % interval === 0
      }
      return true
    }
    case 'monthly-date': {
      return getDate(day) === (rec.monthDay || 1)
    }
    case 'monthly-weekday': {
      const ourDay = jsDayToOur(getDay(day))
      if (ourDay !== rec.weekDay) return false
      const occurrence = Math.ceil(getDate(day) / 7)
      return occurrence === rec.weekNum
    }
    default:
      return false
  }
}

function isMultiDay(ev) { return ev.startDate !== ev.endDate }

function blankEvent(date) {
  const d = date || format(new Date(), 'yyyy-MM-dd')
  return {
    id: crypto.randomUUID(),
    title: '', startDate: d, endDate: d,
    startTime: '', endTime: '',
    allDay: false, subject: 'personal', priority: 'normal', notes: '',
    recurrence: null, exceptions: [],
  }
}

// Expand recurring + regular events into a flat list of instances for a date window
function getUpcomingInstances(events, fromDate, days = 90) {
  const result  = []
  const fromStr = format(fromDate, 'yyyy-MM-dd')
  const toDate  = addDays(fromDate, days)
  const toStr   = format(toDate, 'yyyy-MM-dd')

  for (const ev of events) {
    if (!ev.recurrence || ev.recurrence.type === 'none') {
      if (ev.endDate >= fromStr && ev.startDate <= toStr) {
        result.push({ ...ev, _date: ev.startDate })
      }
    } else {
      // Walk days window to find occurrences
      const startD = new Date(Math.max(parseISO(ev.startDate).getTime(), fromDate.getTime()))
      let d = startD
      while (d <= toDate) {
        if (eventOccursOnDay(ev, d)) {
          result.push({ ...ev, _date: format(d, 'yyyy-MM-dd') })
        }
        d = addDays(d, 1)
      }
    }
  }

  return result.sort((a, b) => {
    const dc = (a._date || a.startDate).localeCompare(b._date || b.startDate)
    return dc !== 0 ? dc : (a.startTime || '').localeCompare(b.startTime || '')
  })
}

function recurrenceLabel(rec) {
  if (!rec || rec.type === 'none') return null
  switch (rec.type) {
    case 'daily':
      return rec.interval > 1 ? `Every ${rec.interval} days` : 'Daily'
    case 'weekly': {
      const dayNames = (rec.days || []).map(d => WEEK_DAYS[d]).join(', ')
      const every    = rec.interval > 1 ? `Every ${rec.interval} weeks` : 'Weekly'
      return dayNames ? `${every} on ${dayNames}` : every
    }
    case 'monthly-date':
      return `Monthly on the ${rec.monthDay}${['st','nd','rd'][rec.monthDay-1] || 'th'}`
    case 'monthly-weekday':
      return `Monthly — ${ORDINALS[rec.weekNum-1]} ${WEEK_DAYS[rec.weekDay]}`
    default:
      return null
  }
}

// ─── EventModal ───────────────────────────────────────────────────────────────

function EventModal({ event, subjects, onSave, onClose }) {
  const [form, setForm]     = useState(() => normalizeEvent(event))
  const [recOpen, setRecOpen] = useState(() => !!(event.recurrence && event.recurrence.type !== 'none'))

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setRec = (k, v) => setForm(f => ({
    ...f,
    recurrence: { ...(f.recurrence || DEFAULT_REC), [k]: v }
  }))

  const toggleRepeat = (on) => {
    setRecOpen(on)
    setForm(f => ({ ...f, recurrence: on ? { ...DEFAULT_REC } : null }))
  }

  const handleAllDay = (checked) =>
    setForm(f => ({ ...f, allDay: checked, startTime: checked ? '' : f.startTime, endTime: checked ? '' : f.endTime }))

  const handleStartDate = (v) =>
    setForm(f => ({ ...f, startDate: v, endDate: f.endDate < v ? v : f.endDate }))

  const toggleWeekDay = (d) => {
    const days = form.recurrence?.days || []
    setRec('days', days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort())
  }

  const rec = form.recurrence || DEFAULT_REC

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bunker-900 border border-bunker-600 rounded-lg w-full max-w-lg p-5 space-y-4 max-h-[92vh] overflow-y-auto">

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-100">{event.title ? 'Edit Event' : 'New Event'}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-gray-200" /></button>
        </div>

        {/* Title */}
        <div>
          <label className="ops-label">Title *</label>
          <input className="ops-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Event title…" autoFocus />
        </div>

        {/* All Day */}
        <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
          <div className="relative">
            <input type="checkbox" className="sr-only peer" checked={form.allDay} onChange={e => handleAllDay(e.target.checked)} />
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
            <input type="date" className="ops-input" value={form.startDate} onChange={e => handleStartDate(e.target.value)} />
          </div>
          <div>
            <label className="ops-label">End Date</label>
            <input type="date" className="ops-input" value={form.endDate} min={form.startDate} onChange={e => set('endDate', e.target.value)} />
          </div>
        </div>

        {/* Times */}
        {!form.allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ops-label">Start Time</label>
              <input type="time" className="ops-input" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
            </div>
            <div>
              <label className="ops-label">End Time</label>
              <input type="time" className="ops-input" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
            </div>
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="ops-label">Domain / Subject</label>
          <div className="flex flex-wrap gap-1.5">
            {subjects.map(s => {
              const active = form.subject === s.id
              const [r,g,b] = hexRgb(s.accentColor)
              return (
                <button key={s.id} onClick={() => set('subject', s.id)}
                  className="text-[10px] px-2 py-0.5 rounded-full border transition-all"
                  style={active
                    ? { color: `rgb(${r},${g},${b})`, backgroundColor: `rgba(${r},${g},${b},0.15)`, borderColor: `rgba(${r},${g},${b},0.6)` }
                    : { borderColor: '#374151', color: '#6b7280' }}>
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
                <button key={p.id} onClick={() => set('priority', p.id)}
                  className="text-[10px] px-2.5 py-0.5 rounded border transition-all"
                  style={active
                    ? { color: `rgb(${pr},${pg},${pb})`, backgroundColor: `rgba(${pr},${pg},${pb},0.15)`, borderColor: `rgba(${pr},${pg},${pb},0.6)` }
                    : { borderColor: '#374151', color: '#6b7280' }}>
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="ops-label">Notes</label>
          <textarea className="ops-textarea min-h-[60px]" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Details, links, context…" />
        </div>

        {/* ── Repeat ── */}
        <div className="border-t border-bunker-700 pt-3 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
            <div className="relative">
              <input type="checkbox" className="sr-only peer" checked={recOpen} onChange={e => toggleRepeat(e.target.checked)} />
              <div className="w-9 h-5 bg-bunker-700 rounded-full peer peer-checked:bg-ops-blue/60
                after:content-[''] after:absolute after:top-0.5 after:left-[2px]
                after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                peer-checked:after:translate-x-full" />
            </div>
            <span className="text-xs text-gray-300 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-ops-blue" /> Repeat
            </span>
          </label>

          {recOpen && (
            <div className="bg-bunker-800 border border-bunker-600 rounded-lg p-3 space-y-3">

              {/* Type */}
              <div>
                <label className="ops-label">Repeat type</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'daily',           label: 'Daily'          },
                    { id: 'weekly',          label: 'Weekly'         },
                    { id: 'monthly-date',    label: 'Monthly (date)' },
                    { id: 'monthly-weekday', label: 'Monthly (day)'  },
                  ].map(t => (
                    <button key={t.id} onClick={() => setRec('type', t.id)}
                      className={`text-[10px] px-2.5 py-1 rounded border transition-all
                        ${rec.type === t.id
                          ? 'bg-ops-blue/20 border-ops-blue/60 text-ops-blue'
                          : 'border-bunker-600 text-gray-500 hover:border-gray-500'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily — interval */}
              {rec.type === 'daily' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Every</span>
                  <input type="number" min="1" max="365"
                    className="ops-input w-16 text-center text-sm"
                    value={rec.interval || 1}
                    onChange={e => setRec('interval', Math.max(1, parseInt(e.target.value) || 1))} />
                  <span className="text-xs text-gray-400">day(s)</span>
                </div>
              )}

              {/* Weekly — day picker + interval */}
              {rec.type === 'weekly' && (
                <div className="space-y-2">
                  <div>
                    <label className="ops-label">On these days</label>
                    <div className="flex gap-1">
                      {WEEK_DAYS.map((d, i) => (
                        <button key={i} onClick={() => toggleWeekDay(i)}
                          className={`flex-1 py-1.5 rounded text-[10px] font-semibold border transition-all
                            ${(rec.days || []).includes(i)
                              ? 'bg-ops-blue/20 border-ops-blue/60 text-ops-blue'
                              : 'border-bunker-600 text-gray-600 hover:border-gray-500'}`}>
                          {d[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Every</span>
                    <input type="number" min="1" max="52"
                      className="ops-input w-14 text-center text-sm"
                      value={rec.interval || 1}
                      onChange={e => setRec('interval', Math.max(1, parseInt(e.target.value) || 1))} />
                    <span className="text-xs text-gray-400">week(s)</span>
                  </div>
                </div>
              )}

              {/* Monthly by date */}
              {rec.type === 'monthly-date' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">On the</span>
                  <input type="number" min="1" max="31"
                    className="ops-input w-14 text-center text-sm"
                    value={rec.monthDay || 1}
                    onChange={e => setRec('monthDay', Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))} />
                  <span className="text-xs text-gray-400">of each month</span>
                </div>
              )}

              {/* Monthly by weekday */}
              {rec.type === 'monthly-weekday' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">On the</span>
                  <select
                    className="ops-input w-auto text-sm"
                    value={rec.weekNum || 1}
                    onChange={e => setRec('weekNum', parseInt(e.target.value))}>
                    {ORDINALS.map((o, i) => <option key={i} value={i+1}>{o}</option>)}
                  </select>
                  <select
                    className="ops-input w-auto text-sm"
                    value={rec.weekDay ?? 0}
                    onChange={e => setRec('weekDay', parseInt(e.target.value))}>
                    {WEEK_DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                  <span className="text-xs text-gray-400">of each month</span>
                </div>
              )}

              {/* End condition */}
              <div>
                <label className="ops-label">Ends</label>
                <div className="flex gap-1.5 items-center flex-wrap">
                  <button onClick={() => setRec('endType', 'never')}
                    className={`text-[10px] px-2.5 py-1 rounded border transition-all
                      ${rec.endType === 'never'
                        ? 'bg-ops-blue/20 border-ops-blue/60 text-ops-blue'
                        : 'border-bunker-600 text-gray-500 hover:border-gray-500'}`}>
                    Never
                  </button>
                  <button onClick={() => setRec('endType', 'date')}
                    className={`text-[10px] px-2.5 py-1 rounded border transition-all
                      ${rec.endType === 'date'
                        ? 'bg-ops-blue/20 border-ops-blue/60 text-ops-blue'
                        : 'border-bunker-600 text-gray-500 hover:border-gray-500'}`}>
                    On date
                  </button>
                  {rec.endType === 'date' && (
                    <input type="date" className="ops-input text-sm"
                      value={rec.endDate || ''}
                      min={form.startDate}
                      onChange={e => setRec('endDate', e.target.value)} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="ops-btn-ghost">Cancel</button>
          <button onClick={() => form.title.trim() && onSave(form)} className="ops-btn-primary">Save Event</button>
        </div>
      </div>
    </div>
  )
}

// ─── Full month grid (main) ───────────────────────────────────────────────────

function MainMonth({ monthDate, events, subjects, selected, onSelectDay, onEditEvent, onNav }) {
  const monthStart = startOfMonth(monthDate)
  const monthEnd   = endOfMonth(monthDate)
  const days       = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end:   endOfWeek(monthEnd,   { weekStartsOn: 1 }),
  })

  return (
    <div className="ops-card">
      {/* Nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onNav(-1)} className="ops-btn-ghost p-1"><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-100">{format(monthDate, 'MMMM yyyy')}</span>
          <button onClick={() => onNav(0)} className="text-[10px] ops-btn-ghost px-2 py-0.5">Today</button>
        </div>
        <button onClick={() => onNav(1)} className="ops-btn-ghost p-1"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {/* Headers */}
      <div className="grid grid-cols-7 mb-1">
        {[['Mon','M'],['Tue','T'],['Wed','W'],['Thu','T'],['Fri','F'],['Sat','S'],['Sun','S']].map(([full, short]) => (
          <div key={full} className="text-center text-[10px] text-gray-600 uppercase tracking-wider py-1">
            <span className="hidden sm:inline">{full}</span>
            <span className="sm:hidden">{short}</span>
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map(day => {
          const inMonth  = isSameMonth(day, monthDate)
          const isToday  = isSameDay(day, new Date())
          const isSel    = selected && isSameDay(day, selected)
          const dayEvts  = events.filter(ev => eventOccursOnDay(ev, day))
          const sorted   = [...dayEvts].sort((a, b) => {
            const aBar = a.allDay || isMultiDay(a)
            const bBar = b.allDay || isMultiDay(b)
            if (aBar && !bBar) return -1
            if (!aBar && bBar) return 1
            return (a.startTime || '').localeCompare(b.startTime || '')
          })
          const shown    = sorted.slice(0, 2)
          const overflow = sorted.length - 2

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDay(isSel ? null : day)}
              className={[
                'min-h-[52px] sm:min-h-[80px] p-0.5 sm:p-1 rounded cursor-pointer transition-all border',
                !inMonth ? 'opacity-30' : '',
                isToday && !isSel ? 'border-ops-green/40 bg-ops-green/5' : '',
                isSel   ? 'border-ops-blue/50 bg-ops-blue/5' : '',
                !isToday && !isSel ? 'border-transparent hover:border-bunker-600 hover:bg-bunker-800' : '',
              ].join(' ')}
            >
              <div className={`text-[11px] w-5 h-5 flex items-center justify-center rounded-full mb-0.5
                ${isToday ? 'bg-ops-green text-bunker-950 font-bold' : 'text-gray-400'}`}>
                {format(day, 'd')}
              </div>

              {/* Mobile: dots only */}
              <div className="sm:hidden flex flex-wrap gap-0.5 mt-0.5">
                {sorted.slice(0, 3).map(ev => {
                  const subj    = subjects.find(s => s.id === ev.subject) || PERSONAL
                  const [r,g,b] = hexRgb(subj.accentColor)
                  return <span key={ev.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `rgb(${r},${g},${b})` }} />
                })}
                {sorted.length > 3 && <span className="text-[8px] text-gray-600">+{sorted.length - 3}</span>}
              </div>

              {/* Desktop: pill labels */}
              <div className="hidden sm:block space-y-0.5">
                {shown.map(ev => {
                  const subj    = subjects.find(s => s.id === ev.subject) || PERSONAL
                  const [r,g,b] = hexRgb(subj.accentColor)
                  const isBar   = ev.allDay || isMultiDay(ev)
                  const isRec   = ev.recurrence && ev.recurrence.type !== 'none'
                  return (
                    <div
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); onEditEvent(ev) }}
                      className="text-[9px] px-1 py-0.5 rounded cursor-pointer truncate leading-tight"
                      style={isBar
                        ? { backgroundColor: `rgba(${r},${g},${b},0.22)`, color: `rgb(${r},${g},${b})` }
                        : { display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      {isBar ? (
                        <span className="flex items-center gap-1 truncate">
                          {isRec && <Repeat className="w-2 h-2 flex-shrink-0" />}
                          <span className="truncate">{ev.title}</span>
                        </span>
                      ) : (
                        <>
                          <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: `rgb(${r},${g},${b})` }} />
                          {isRec && <Repeat className="w-2 h-2 text-gray-600 flex-shrink-0" />}
                          <span className="truncate text-gray-300">{ev.title}</span>
                        </>
                      )}
                    </div>
                  )
                })}
                {overflow > 0 && <div className="text-[9px] text-gray-600 px-1">+{overflow} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Mini month ───────────────────────────────────────────────────────────────

function MiniMonth({ monthDate, events, subjects, selected, onSelectDay }) {
  const monthStart = startOfMonth(monthDate)
  const monthEnd   = endOfMonth(monthDate)
  const days       = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end:   endOfWeek(monthEnd,   { weekStartsOn: 1 }),
  })

  return (
    <div className="ops-card">
      <div className="text-center text-xs font-bold text-gray-300 mb-2 tracking-wide">
        {format(monthDate, 'MMMM yyyy')}
      </div>
      <div className="grid grid-cols-7 mb-0.5">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-center text-[9px] text-gray-700 uppercase py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {days.map(day => {
          const inMonth  = isSameMonth(day, monthDate)
          const isToday  = isSameDay(day, new Date())
          const isSel    = selected && isSameDay(day, selected)
          const dayEvts  = events.filter(ev => eventOccursOnDay(ev, day))
          const dotSubjs = [...new Map(dayEvts.map(ev => [ev.subject, ev])).values()].slice(0, 3)

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDay(isSel ? null : day)}
              className={[
                'flex flex-col items-center justify-start pt-0.5 pb-1 rounded cursor-pointer transition-all',
                !inMonth ? 'opacity-20' : '',
                isToday && !isSel ? 'bg-ops-green/10 ring-1 ring-inset ring-ops-green/30' : '',
                isSel   ? 'bg-ops-blue/10 ring-1 ring-inset ring-ops-blue/40' : (inMonth ? 'hover:bg-bunker-800' : ''),
              ].join(' ')}
            >
              <div className={`text-[10px] w-[18px] h-[18px] flex items-center justify-center rounded-full leading-none
                ${isToday ? 'bg-ops-green text-bunker-950 font-bold text-[9px]' : 'text-gray-400'}`}>
                {format(day, 'd')}
              </div>
              {dotSubjs.length > 0 && (
                <div className="flex gap-px mt-0.5">
                  {dotSubjs.map(ev => {
                    const subj    = subjects.find(s => s.id === ev.subject) || PERSONAL
                    const [r,g,b] = hexRgb(subj.accentColor)
                    return <div key={ev.subject} className="w-1 h-1 rounded-full" style={{ backgroundColor: `rgb(${r},${g},${b})` }} />
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Upcoming events panel ────────────────────────────────────────────────────

function UpcomingPanel({ events, subjects, onEdit }) {
  const instances = useMemo(
    () => getUpcomingInstances(events, new Date(), 90).slice(0, 12),
    [events]
  )

  return (
    <div className="ops-card">
      <div className="section-title"><CalendarDays className="w-3.5 h-3.5" />UPCOMING EVENTS</div>
      {instances.length === 0 ? (
        <p className="text-xs text-gray-600">No upcoming events scheduled.</p>
      ) : (
        <div className="space-y-1.5">
          {instances.map((ev, idx) => {
            const subj     = subjects.find(s => s.id === ev.subject) || PERSONAL
            const [r,g,b]  = hexRgb(subj.accentColor)
            const priority = PRIORITIES.find(p => p.id === ev.priority)
            const multi    = ev.startDate !== ev.endDate
            const displayDate = ev._date || ev.startDate
            const recLabel = recurrenceLabel(ev.recurrence)
            return (
              <div
                key={`${ev.id}-${displayDate}-${idx}`}
                onClick={() => onEdit(ev)}
                className="flex items-center gap-3 px-3 py-2 rounded cursor-pointer hover:bg-bunker-800 transition-colors group"
                style={{ borderLeft: `3px solid rgba(${r},${g},${b},0.6)` }}
              >
                {/* Date badge */}
                <div className="flex-shrink-0 text-center w-8">
                  <div className="text-[8px] text-gray-600 uppercase leading-none">{format(parseISO(displayDate), 'MMM')}</div>
                  <div className="text-base font-bold leading-tight" style={{ color: `rgb(${r},${g},${b})` }}>
                    {format(parseISO(displayDate), 'd')}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-gray-100 truncate">{ev.title}</span>
                    {priority && priority.id !== 'normal' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ color: priority.color, backgroundColor: `${priority.color}20` }}>
                        {priority.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border" style={{ color: `rgb(${r},${g},${b})`, borderColor: `rgba(${r},${g},${b},0.4)`, backgroundColor: `rgba(${r},${g},${b},0.08)` }}>
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
                    {multi && !recLabel && <span className="text-[9px] text-gray-600">→ {format(parseISO(ev.endDate), 'MMM d')}</span>}
                    {recLabel && (
                      <span className="text-[9px] text-ops-blue flex items-center gap-0.5">
                        <Repeat className="w-2.5 h-2.5" />{recLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Selected day / week detail ───────────────────────────────────────────────

function EventRow({ ev, subjects, onEdit, onDelete, onDeleteOccurrence, dayStr, showConfirm, setConfirmId }) {
  const subj     = subjects.find(s => s.id === ev.subject) || PERSONAL
  const [r,g,b]  = hexRgb(subj.accentColor)
  const priority = PRIORITIES.find(p => p.id === ev.priority)
  const isRec    = ev.recurrence && ev.recurrence.type !== 'none'
  const recLabel = recurrenceLabel(ev.recurrence)
  return (
    <div>
      <div className="flex items-start gap-3 p-3 rounded group"
        style={{ backgroundColor: `rgba(${r},${g},${b},0.05)`, borderLeft: `3px solid rgba(${r},${g},${b},0.5)` }}>
        <div className="flex-shrink-0 w-16 text-right pt-0.5">
          {ev.allDay
            ? <span className="text-[9px] text-gray-500 uppercase tracking-wider">All Day</span>
            : ev.startTime
              ? <><p className="text-xs font-semibold" style={{ color: `rgb(${r},${g},${b})` }}>{ev.startTime}</p>
                  {ev.endTime && <p className="text-[9px] text-gray-600">{ev.endTime}</p>}</>
              : <span className="text-[9px] text-gray-600">—</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-100 truncate">{ev.title}</span>
            {priority && priority.id !== 'normal' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                style={{ color: priority.color, backgroundColor: `${priority.color}20` }}>{priority.label}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full border"
              style={{ color: `rgb(${r},${g},${b})`, borderColor: `rgba(${r},${g},${b},0.4)`, backgroundColor: `rgba(${r},${g},${b},0.08)` }}>
              {subj.title}
            </span>
            {recLabel && <span className="text-[9px] text-ops-blue flex items-center gap-0.5"><Repeat className="w-2.5 h-2.5" />{recLabel}</span>}
            {ev.notes && <span className="text-[9px] text-gray-600 truncate max-w-[120px]">{ev.notes}</span>}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(ev)} className="p-1 text-gray-600 hover:text-ops-blue"><Edit3 className="w-3 h-3" /></button>
          <button onClick={() => setConfirmId(ev.id)} className="p-1 text-gray-600 hover:text-ops-red"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
      {showConfirm && (
        <div className="mt-1 p-2 rounded bg-ops-red/10 border border-ops-red/30 flex items-center gap-2">
          <span className="text-[10px] text-ops-red flex-1">
            {isRec ? 'Delete just this date or all occurrences?' : 'Delete this event?'}
          </span>
          {isRec && (
            <button onClick={() => { onDeleteOccurrence(ev.id, dayStr); setConfirmId(null) }}
              className="text-[10px] px-2 py-0.5 rounded border border-ops-amber/50 text-ops-amber hover:bg-ops-amber/10">
              This date
            </button>
          )}
          <button onClick={() => { onDelete(ev.id); setConfirmId(null) }}
            className="text-[10px] px-2 py-0.5 rounded border border-ops-red/50 text-ops-red hover:bg-ops-red/10">
            {isRec ? 'All' : 'Delete'}
          </button>
          <button onClick={() => setConfirmId(null)} className="text-[10px] text-gray-600 hover:text-gray-300">Cancel</button>
        </div>
      )}
    </div>
  )
}

function DayDetail({ day, events, subjects, onEdit, onDelete, onDeleteOccurrence, onAdd, canAdd, showBattlePlan, battlePlanBlocks }) {
  const [confirmId, setConfirmId] = useState(null)
  const [view, setView]           = useState('day') // 'day' | 'week'

  const weekDays = useMemo(() => {
    const start = startOfWeek(day, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [day])

  const dayStr    = format(day, 'yyyy-MM-dd')
  const dayEvents = events
    .filter(ev => eventOccursOnDay(ev, day))
    .sort((a, b) => {
      if (a.allDay && !b.allDay) return -1
      if (!a.allDay && b.allDay) return 1
      return (a.startTime || '').localeCompare(b.startTime || '')
    })

  const bpBlocks = showBattlePlan ? (battlePlanBlocks[dayStr] || []) : []

  return (
    <div className="ops-card">
      {/* Header with day/week toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-bold text-gray-100 truncate">
            {view === 'day' ? format(day, 'EEEE, MMMM d') : `Week of ${format(weekDays[0], 'MMM d')}`}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Day / Week toggle */}
          <div className="flex rounded border border-bunker-600 overflow-hidden text-[10px]">
            <button onClick={() => setView('day')}
              className={`px-2 py-1 flex items-center gap-1 transition-colors
                ${view === 'day' ? 'bg-ops-blue/20 text-ops-blue' : 'text-gray-500 hover:text-gray-300'}`}>
              <AlignJustify className="w-3 h-3" /> Day
            </button>
            <button onClick={() => setView('week')}
              className={`px-2 py-1 flex items-center gap-1 border-l border-bunker-600 transition-colors
                ${view === 'week' ? 'bg-ops-blue/20 text-ops-blue' : 'text-gray-500 hover:text-gray-300'}`}>
              <Columns className="w-3 h-3" /> Week
            </button>
          </div>
          {canAdd && (
            <button onClick={onAdd} className="ops-btn-primary flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add
            </button>
          )}
        </div>
      </div>

      {/* ── Day view ── */}
      {view === 'day' && (
        <>
          {/* Battle plan blocks for this day */}
          {bpBlocks.length > 0 && (
            <div className="mb-3 space-y-1.5">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
                <MapIcon className="w-3 h-3" /> Battle Plan
              </p>
              {bpBlocks.map((b, i) => {
                const c = CATEGORIES.find(x => x.id === b.category) || CATEGORIES[CATEGORIES.length - 1]
                const [r,g,b2] = hexRgb(c.color)
                return (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded"
                    style={{ backgroundColor: `rgba(${r},${g},${b2},0.08)`, borderLeft: `3px solid rgba(${r},${g},${b2},0.5)` }}>
                    <span className="text-[10px]">{c.icon}</span>
                    <span className="text-xs text-gray-300">{b.text}</span>
                    {b.startTime && <span className="text-[10px] text-gray-600 ml-auto">{b.startTime}{b.endTime ? `–${b.endTime}` : ''}</span>}
                    {b.done && <span className="text-[9px] text-ops-green ml-1">✓</span>}
                  </div>
                )
              })}
              <div className="border-t border-bunker-700 pt-2 mt-2" />
            </div>
          )}

          {dayEvents.length === 0 ? (
            <p className="text-xs text-gray-600">No events. Click Add to create one.</p>
          ) : (
            <div className="space-y-2">
              {dayEvents.map(ev => (
                <EventRow key={ev.id} ev={ev} subjects={subjects} onEdit={onEdit}
                  onDelete={onDelete} onDeleteOccurrence={onDeleteOccurrence}
                  dayStr={dayStr} showConfirm={confirmId === ev.id} setConfirmId={setConfirmId} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Week view ── */}
      {view === 'week' && (
        <div className="space-y-3">
          {weekDays.map(wd => {
            const wdStr    = format(wd, 'yyyy-MM-dd')
            const wdEvents = events.filter(ev => eventOccursOnDay(ev, wd))
              .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
            const wdBp     = showBattlePlan ? (battlePlanBlocks[wdStr] || []) : []
            const isToday  = wdStr === format(new Date(), 'yyyy-MM-dd')
            const isSel    = wdStr === dayStr

            return (
              <div key={wdStr} className={`rounded border p-2 ${isSel ? 'border-ops-blue/40 bg-ops-blue/5' : isToday ? 'border-ops-green/30 bg-ops-green/5' : 'border-bunker-700'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs font-semibold ${isToday ? 'text-ops-green' : isSel ? 'text-ops-blue' : 'text-gray-400'}`}>
                    {format(wd, 'EEE')}
                  </span>
                  <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-ops-green text-bunker-950 font-bold' : 'text-gray-500'}`}>
                    {format(wd, 'd')}
                  </span>
                  {wdEvents.length === 0 && wdBp.length === 0 && (
                    <span className="text-[10px] text-gray-700 italic">—</span>
                  )}
                </div>
                <div className="space-y-1">
                  {wdBp.map((b, i) => {
                    const cat2 = CATEGORIES.find(x => x.id === b.category) || CATEGORIES[CATEGORIES.length - 1]
                    const [r,g,b2] = hexRgb(cat2.color)
                    return (
                      <div key={`bp-${i}`} className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px]"
                        style={{ backgroundColor: `rgba(${r},${g},${b2},0.08)`, borderLeft: `2px solid rgba(${r},${g},${b2},0.5)` }}>
                        <span>{cat2.icon}</span>
                        <span className="text-gray-400 truncate">{b.text}</span>
                      </div>
                    )
                  })}
                  {wdEvents.map(ev => {
                    const subj    = subjects.find(s => s.id === ev.subject) || PERSONAL
                    const [r,g,b] = hexRgb(subj.accentColor)
                    return (
                      <div key={ev.id} onClick={() => onEdit(ev)}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: `rgba(${r},${g},${b},0.1)`, borderLeft: `2px solid rgba(${r},${g},${b},0.6)` }}>
                        {ev.startTime && <span className="text-gray-500 flex-shrink-0">{ev.startTime}</span>}
                        <span className="text-gray-200 truncate font-medium">{ev.title}</span>
                        {ev.priority === 'critical' && <span className="text-ops-red ml-auto flex-shrink-0">!</span>}
                      </div>
                    )
                  })}
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
  const events    = useMemo(() => rawEvents.map(normalizeEvent), [rawEvents])
  const isPro     = isPlanPro(state.profile.plan)
  const atEventLimit = !isPro && rawEvents.length >= FREE_EVENT_LIMIT

  const [current, setCurrent]       = useState(new Date())
  const [modal, setModal]           = useState(null)
  const [selected, setSelected]     = useState(null)
  const [showBattlePlan, setShowBattlePlan] = useState(() => localStorage.getItem('aligned_bp_cal') === 'on')
  const [searchParams, setSearchParams] = useSearchParams()

  // Flatten battle plan blocks into a map keyed by 'yyyy-MM-dd'
  const battlePlanBlocks = useMemo(() => {
    if (!showBattlePlan) return {}
    const weeks = state.battlePlan?.weeks || {}
    const map   = {}
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    Object.entries(weeks).forEach(([weekStart, weekData]) => {
      const days = weekData.days || {}
      Object.entries(days).forEach(([dayName, blocks]) => {
        // Find the actual date for this day name within the week
        const weekStartDate = parseISO(weekStart)
        for (let i = 0; i < 7; i++) {
          const d = addDays(weekStartDate, i)
          if (DAY_NAMES[d.getDay()] === dayName) {
            const key = format(d, 'yyyy-MM-dd')
            map[key] = (map[key] || []).concat(blocks)
            break
          }
        }
      })
    })
    return map
  }, [state.battlePlan?.weeks, showBattlePlan])

  const subjects = useMemo(() => {
    const cards = (state.sitrep?.cards || []).map(c => ({
      id: c.id, title: c.title, accentColor: c.accentColor || '#6b7280',
    }))
    if (!cards.find(c => c.id === 'personal')) cards.push(PERSONAL)
    return cards
  }, [state.sitrep?.cards])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      const ev = blankEvent()
      const subjectParam = searchParams.get('subject')
      if (subjectParam) ev.subject = subjectParam
      setModal(ev)
      setSearchParams({}, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNav = (dir) => {
    if (dir === 0) { setCurrent(new Date()); setSelected(new Date()) }
    else setCurrent(m => dir === 1 ? addMonths(m, 1) : subMonths(m, 1))
  }

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

  // Add a date to the event's exceptions list (skip just that occurrence)
  const deleteOccurrence = (id, dateStr) => {
    update(s => {
      const idx = (s.calendarEvents || []).findIndex(e => e.id === id)
      if (idx >= 0) {
        const exc = s.calendarEvents[idx].exceptions || []
        if (!exc.includes(dateStr)) s.calendarEvents[idx].exceptions = [...exc, dateStr]
      }
    })
  }

  const mini1 = addMonths(current, 1)
  const mini2 = addMonths(current, 2)

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {modal && (
        <EventModal event={modal} subjects={subjects} onSave={saveEvent} onClose={() => setModal(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-lg font-bold text-ops-blue tracking-widest">// CALENDAR</h1>
        <div className="flex items-center gap-2">
          {/* Battle Plan overlay toggle */}
          <button
            onClick={() => setShowBattlePlan(v => {
              const next = !v
              localStorage.setItem('aligned_bp_cal', next ? 'on' : 'off')
              return next
            })}
            title={showBattlePlan ? 'Hide Battle Plan blocks' : 'Show Battle Plan blocks'}
            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded border transition-colors
              ${showBattlePlan
                ? 'border-ops-amber/50 text-ops-amber bg-ops-amber/10'
                : 'border-bunker-600 text-gray-500 hover:border-gray-500 hover:text-gray-300'}`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Battle Plan</span>
          </button>

          {atEventLimit ? (
            <div className="flex items-center gap-1.5 text-[11px] text-ops-amber/70 border border-ops-amber/30 rounded px-3 py-1.5 bg-ops-amber/5">
              <Lock className="w-3 h-3" /> {FREE_EVENT_LIMIT}/{FREE_EVENT_LIMIT} — Upgrade
            </div>
          ) : (
            <button onClick={() => setModal(blankEvent())} className="ops-btn-primary flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Event
            </button>
          )}
        </div>
      </div>

      {/* Domain legend */}
      <div className="flex flex-wrap gap-1.5">
        {subjects.map(s => {
          const [r,g,b] = hexRgb(s.accentColor)
          return (
            <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{ color: `rgb(${r},${g},${b})`, borderColor: `rgba(${r},${g},${b},0.4)`, backgroundColor: `rgba(${r},${g},${b},0.08)` }}>
              {s.title}
            </span>
          )
        })}
      </div>

      {/* Upcoming */}
      <UpcomingPanel events={events} subjects={subjects} onEdit={ev => setModal({ ...ev })} />

      {/* Day detail */}
      {selected && (
        <DayDetail
          day={selected}
          events={events}
          subjects={subjects}
          onEdit={ev => setModal({ ...ev })}
          onDelete={deleteEvent}
          onDeleteOccurrence={deleteOccurrence}
          onAdd={() => setModal(blankEvent(format(selected, 'yyyy-MM-dd')))}
          canAdd={!atEventLimit}
          showBattlePlan={showBattlePlan}
          battlePlanBlocks={battlePlanBlocks}
        />
      )}

      {/* Main month grid */}
      <MainMonth
        monthDate={current}
        events={events}
        subjects={subjects}
        selected={selected}
        onSelectDay={setSelected}
        onEditEvent={ev => setModal({ ...ev })}
        onNav={handleNav}
      />

      {/* Two mini months */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MiniMonth monthDate={mini1} events={events} subjects={subjects} selected={selected} onSelectDay={setSelected} />
        <MiniMonth monthDate={mini2} events={events} subjects={subjects} selected={selected} onSelectDay={setSelected} />
      </div>
    </div>
  )
}
