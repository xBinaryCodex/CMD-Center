import { useState } from 'react'
import { useStore } from '../store/useStore'
import {
  Network, BookOpen, Shield, Gamepad2, Brain,
  Edit3, Check, X, AlertTriangle, Target, Plus, Trash2, ChevronDown, ChevronUp
} from 'lucide-react'
import { format } from 'date-fns'

function EditableBlock({ label, value, onSave, multiline }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const save = () => { onSave(draft); setEditing(false) }
  const cancel = () => { setDraft(value); setEditing(false) }
  return (
    <div>
      <span className="ops-label">{label}</span>
      {editing ? (
        <div className="flex gap-1 items-start">
          {multiline
            ? <textarea className="ops-textarea text-sm flex-1 min-h-[60px]" value={draft} onChange={e => setDraft(e.target.value)} autoFocus />
            : <input className="ops-input text-sm flex-1" value={draft} onChange={e => setDraft(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }} />
          }
          <button onClick={save} className="ops-btn-primary mt-0.5"><Check className="w-3 h-3" /></button>
          <button onClick={cancel} className="ops-btn-ghost mt-0.5"><X className="w-3 h-3" /></button>
        </div>
      ) : (
        <div
          className="flex items-start justify-between gap-2 group cursor-pointer"
          onClick={() => { setDraft(value); setEditing(true) }}
        >
          <span className="text-sm text-gray-200 leading-relaxed">{value || <span className="text-gray-600 italic">Click to edit…</span>}</span>
          <Edit3 className="w-3 h-3 text-gray-600 group-hover:text-ops-green flex-shrink-0 mt-0.5 transition-colors" />
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    'In Progress': 'bg-ops-amber/20 text-ops-amber border-ops-amber/40',
    'Active': 'bg-ops-green/20 text-ops-green border-ops-green/40',
    'Planned': 'bg-ops-blue/20 text-ops-blue border-ops-blue/40',
    'Paused': 'bg-gray-500/20 text-gray-400 border-gray-500/40',
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${map[status] || map['Active']}`}>
      {status}
    </span>
  )
}

function SitrepCard({ icon: Icon, color, title, status, children, xpBadge }) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`ops-card border-l-2 ${color}`}>
      <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color.replace('border-', 'text-')}`} />
          <span className="text-sm font-semibold text-gray-100">{title}</span>
          {status && <StatusPill status={status} />}
        </div>
        <div className="flex items-center gap-2">
          {xpBadge && <span className="text-[10px] text-ops-amber">+{xpBadge} XP</span>}
          {open ? <ChevronUp className="w-3 h-3 text-gray-600" /> : <ChevronDown className="w-3 h-3 text-gray-600" />}
        </div>
      </div>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  )
}

function ObjectivesPanel() {
  const { state, update, addXp, ts } = useStore()
  const [newObj, setNewObj] = useState('')
  const objectives = state.objectives || []

  const add = () => {
    if (!newObj.trim()) return
    update(s => {
      s.objectives = [...(s.objectives || []), {
        id: crypto.randomUUID(), text: newObj.trim(), done: false, at: ts()
      }]
    })
    setNewObj('')
  }

  const toggle = (id) => {
    const obj = objectives.find(o => o.id === id)
    update(s => {
      s.objectives = s.objectives.map(o => o.id === id ? { ...o, done: !o.done, doneAt: !o.done ? ts() : null } : o)
    })
    if (!obj?.done) addXp(25, `Objective complete: ${obj?.text}`)
  }

  const remove = (id) => update(s => { s.objectives = s.objectives.filter(o => o.id !== id) })

  return (
    <div className="ops-card-glow">
      <div className="section-title">
        <Target className="w-3.5 h-3.5 text-ops-green" />
        Active Objectives
        <span className="ml-auto text-[10px] text-gray-600">{objectives.filter(o => !o.done).length} active</span>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          className="ops-input text-sm flex-1"
          placeholder="Add objective…"
          value={newObj}
          onChange={e => setNewObj(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button onClick={add} className="ops-btn-primary flex-shrink-0"><Plus className="w-3.5 h-3.5" /></button>
      </div>

      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {objectives.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-4">No objectives set — add them above.</p>
        )}
        {objectives.filter(o => !o.done).map(obj => (
          <div key={obj.id} className="flex items-start gap-2 p-2 rounded bg-bunker-800 hover:bg-bunker-700 group">
            <button
              onClick={() => toggle(obj.id)}
              className="w-4 h-4 rounded border border-bunker-600 hover:border-ops-green flex-shrink-0 mt-0.5 transition-colors"
            />
            <span className="text-sm text-gray-200 flex-1">{obj.text}</span>
            <span className="text-[9px] text-gray-600 flex-shrink-0">{format(new Date(obj.at), 'MM/dd HH:mm')}</span>
            <button onClick={() => remove(obj.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-3 h-3 text-gray-600 hover:text-ops-red" />
            </button>
          </div>
        ))}
        {objectives.filter(o => o.done).length > 0 && (
          <div className="pt-2">
            <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Completed</div>
            {objectives.filter(o => o.done).map(obj => (
              <div key={obj.id} className="flex items-center gap-2 p-2 rounded opacity-40 group">
                <Check className="w-3 h-3 text-ops-green flex-shrink-0" />
                <span className="text-xs text-gray-400 flex-1 line-through">{obj.text}</span>
                <button onClick={() => remove(obj.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3 h-3 text-gray-600 hover:text-ops-red" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Sitrep() {
  const { state, update, addXp, ts } = useStore()
  const s = state.sitrep
  const now = new Date()

  const saveBoeing = (key, val) => {
    update(d => { d.sitrep.boeing[key] = val; d.sitrep.boeing.lastUpdated = ts() })
    addXp(5, `Updated Boeing SITREP: ${key}`)
  }
  const saveWgu = (key, val) => {
    update(d => { d.sitrep.wgu[key] = val; d.sitrep.wgu.lastUpdated = ts() })
    addXp(5, `Updated WGU SITREP: ${key}`)
  }
  const saveSafeDays = (key, val) => {
    update(d => { d.sitrep.safeDays[key] = val; d.sitrep.safeDays.lastUpdated = ts() })
    addXp(5, `Updated Safe Days SITREP: ${key}`)
  }
  const saveGameDev = (key, val) => {
    update(d => { d.sitrep.gameDev[key] = val; d.sitrep.gameDev.lastUpdated = ts() })
    addXp(5, `Updated GameDev SITREP: ${key}`)
  }
  const saveGdquest = (key, val) => {
    update(d => { d.sitrep.gdquest[key] = val; d.sitrep.gdquest.lastUpdated = ts() })
    addXp(5, `Updated GDQuest SITREP: ${key}`)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-ops-green tracking-widest">// SITREP</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            {format(now, 'EEEE, MMMM d yyyy')} · {format(now, 'HH:mm')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-600">OPERATOR</div>
          <div className="text-sm font-bold text-gray-200">{state.profile.name}</div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Boeing */}
        <SitrepCard icon={Network} color="border-ops-blue" title="Boeing — Dell Contract" status={s.boeing.status}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="ops-label">Role</span>
              <div className="text-sm text-gray-200">{s.boeing.role}</div>
            </div>
            <div>
              <span className="ops-label">L3 Advocate</span>
              <div className="text-sm text-ops-green">{s.boeing.l3}</div>
            </div>
          </div>
          <EditableBlock label="Active Project" value={s.boeing.activeProject} onSave={v => saveBoeing('activeProject', v)} />
          <EditableBlock label="Notes / Latest Update" value={s.boeing.notes} onSave={v => saveBoeing('notes', v)} multiline />
          {s.boeing.lastUpdated && (
            <div className="text-[9px] text-gray-600">Updated {format(new Date(s.boeing.lastUpdated), 'MM/dd/yy HH:mm')}</div>
          )}
        </SitrepCard>

        {/* WGU */}
        <SitrepCard icon={BookOpen} color="border-ops-purple" title="WGU — Cloud & Network BS" status="In Progress">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="ops-label">Program</span>
              <div className="text-sm text-gray-200">{s.wgu.program}</div>
            </div>
            <div>
              <span className="ops-label">Days Left in Term</span>
              <div className={`text-sm font-bold ${s.wgu.daysLeftInTerm <= 7 ? 'text-ops-red' : s.wgu.daysLeftInTerm <= 14 ? 'text-ops-amber' : 'text-ops-green'}`}>
                {s.wgu.daysLeftInTerm}d
              </div>
            </div>
          </div>
          <EditableBlock label="Current Course" value={s.wgu.currentCourse} onSave={v => saveWgu('currentCourse', v)} />
          <div>
            <span className="ops-label">Progress</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-bunker-700 rounded-full overflow-hidden">
                <div className="h-full bg-ops-purple rounded-full xp-bar-fill" style={{ width: `${(s.wgu.completedCUs / s.wgu.totalCUs) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-400">{s.wgu.completedCUs}/{s.wgu.totalCUs} CUs</span>
            </div>
          </div>
          <EditableBlock label="Notes" value={s.wgu.notes} onSave={v => saveWgu('notes', v)} multiline />
          {s.wgu.lastUpdated && (
            <div className="text-[9px] text-gray-600">Updated {format(new Date(s.wgu.lastUpdated), 'MM/dd/yy HH:mm')}</div>
          )}
        </SitrepCard>

        {/* Safe Days */}
        <SitrepCard icon={Shield} color="border-ops-green" title="Safe Days Security" status={s.safeDays.status}>
          <div>
            <span className="ops-label">Business</span>
            <div className="text-sm text-ops-green font-semibold">{s.safeDays.businessName}</div>
            <div className="text-xs text-gray-500">{s.safeDays.tagline}</div>
          </div>
          <EditableBlock label="Latest Update" value={s.safeDays.latestUpdate} onSave={v => saveSafeDays('latestUpdate', v)} multiline />
          {s.safeDays.lastUpdated && (
            <div className="text-[9px] text-gray-600">Updated {format(new Date(s.safeDays.lastUpdated), 'MM/dd/yy HH:mm')}</div>
          )}
        </SitrepCard>

        {/* Game Dev */}
        <SitrepCard icon={Gamepad2} color="border-ops-amber" title="Game Dev" status="In Dev">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="ops-label">Engine</span>
              <div className="text-sm text-gray-200">{s.gameDev.engine}</div>
            </div>
            <div>
              <span className="ops-label">Project</span>
              <div className="text-sm text-gray-200">{s.gameDev.projectName}</div>
            </div>
          </div>
          <EditableBlock label="Current Milestone" value={s.gameDev.currentMilestone} onSave={v => saveGameDev('currentMilestone', v)} />
          <EditableBlock label="Notes" value={s.gameDev.notes} onSave={v => saveGameDev('notes', v)} multiline />
          {s.gameDev.lastUpdated && (
            <div className="text-[9px] text-gray-600">Updated {format(new Date(s.gameDev.lastUpdated), 'MM/dd/yy HH:mm')}</div>
          )}
        </SitrepCard>

        {/* GDQuest */}
        <SitrepCard icon={Brain} color="border-ops-lime" title="GDQuest Course" status="Active">
          <EditableBlock label="Current Lesson" value={s.gdquest.currentLesson} onSave={v => saveGdquest('currentLesson', v)} />
          <div>
            <span className="ops-label">Course Progress</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-bunker-700 rounded-full overflow-hidden">
                <div className="h-full bg-ops-lime rounded-full xp-bar-fill" style={{ width: `${s.gdquest.progressPercent}%` }} />
              </div>
              <span className="text-xs text-gray-400">{s.gdquest.progressPercent}%</span>
            </div>
            <input
              type="range" min="0" max="100"
              value={s.gdquest.progressPercent}
              onChange={e => saveGdquest('progressPercent', Number(e.target.value))}
              className="w-full mt-1 accent-ops-lime"
            />
          </div>
          <EditableBlock label="Notes" value={s.gdquest.notes} onSave={v => saveGdquest('notes', v)} multiline />
          {s.gdquest.lastUpdated && (
            <div className="text-[9px] text-gray-600">Updated {format(new Date(s.gdquest.lastUpdated), 'MM/dd/yy HH:mm')}</div>
          )}
        </SitrepCard>
      </div>

      {/* Objectives */}
      <ObjectivesPanel />
    </div>
  )
}
