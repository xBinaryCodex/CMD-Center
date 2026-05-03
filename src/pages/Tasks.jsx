import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Plus, Trash2, Check, AlertTriangle, ChevronDown, Filter, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const SUBJECTS = [
  { id: 'all',     label: 'All' },
  { id: 'boeing',  label: 'Boeing' },
  { id: 'wgu',     label: 'WGU' },
  { id: 'safedays',label: 'Safe Days' },
  { id: 'gamedev', label: 'Game Dev' },
  { id: 'godot',   label: 'Godot' },
  { id: 'arista',  label: 'Arista' },
  { id: 'personal',label: 'Personal' },
]

const SUBJECT_COLORS = {
  boeing:   'text-ops-blue',
  wgu:      'text-ops-purple',
  safedays: 'text-ops-green',
  gamedev:  'text-ops-amber',
  godot:    'text-ops-lime',
  arista:   'text-ops-cyan',
  personal: 'text-gray-400',
}

export default function Tasks() {
  const { state, update, addXp, ts } = useStore()
  const tasks = state.tasks || []

  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('personal')
  const [critical, setCritical] = useState(false)
  const [filterSubj, setFilterSubj] = useState('all')
  const [showDone, setShowDone] = useState(false)

  const add = () => {
    if (!title.trim()) return
    update(s => {
      s.tasks = [{
        id: crypto.randomUUID(), title: title.trim(), subject,
        critical, done: false, createdAt: ts(), doneAt: null
      }, ...(s.tasks || [])]
    })
    setTitle('')
    setCritical(false)
    addXp(5, `Task created: ${title}`)
  }

  const toggle = (id) => {
    const t = tasks.find(t => t.id === id)
    update(s => {
      s.tasks = s.tasks.map(t => t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? ts() : null } : t)
    })
    if (!t?.done) addXp(t?.critical ? 50 : 20, `Task done: ${t?.title}`)
  }

  const remove = (id) => update(s => { s.tasks = s.tasks.filter(t => t.id !== id) })
  const toggleCritical = (id) => update(s => { s.tasks = s.tasks.map(t => t.id === id ? { ...t, critical: !t.critical } : t) })

  const active = tasks.filter(t => !t.done && (filterSubj === 'all' || t.subject === filterSubj))
  const done   = tasks.filter(t =>  t.done && (filterSubj === 'all' || t.subject === filterSubj))

  const activeCritical = active.filter(t => t.critical)
  const activeNormal   = active.filter(t => !t.critical)

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ops-cyan tracking-widest">// TASKS</h1>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{activeCritical.length} critical</span>
          <span>·</span>
          <span>{active.length} active</span>
          <span>·</span>
          <span>{done.length} done</span>
        </div>
      </div>

      {/* Add task */}
      <div className="ops-card space-y-3">
        <div className="section-title"><Plus className="w-3.5 h-3.5" /> New Task</div>
        <div className="flex gap-2">
          <input
            className="ops-input flex-1"
            placeholder="Task title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
          />
          <button
            onClick={() => setCritical(c => !c)}
            title="Mark as critical"
            className={`ops-btn flex-shrink-0 border ${critical ? 'bg-ops-red/20 border-ops-red/60 text-ops-red' : 'border-bunker-600 text-gray-600 hover:border-gray-500'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-600">Domain:</span>
          {SUBJECTS.filter(s => s.id !== 'all').map(s => (
            <button
              key={s.id}
              onClick={() => setSubject(s.id)}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors
                ${subject === s.id ? 'border-ops-green/60 bg-ops-green/10 text-ops-green' : 'border-bunker-600 text-gray-600 hover:border-gray-500'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={add} className="ops-btn-primary w-full">Add Task</button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3 h-3 text-gray-600" />
        {SUBJECTS.map(s => (
          <button
            key={s.id}
            onClick={() => setFilterSubj(s.id)}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors
              ${filterSubj === s.id ? 'border-ops-cyan/60 bg-ops-cyan/10 text-ops-cyan' : 'border-bunker-700 text-gray-600 hover:border-gray-500'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Critical tasks */}
      {activeCritical.length > 0 && (
        <div className="space-y-2">
          <div className="section-title text-ops-red"><AlertTriangle className="w-3.5 h-3.5 text-ops-red" /> Critical</div>
          {activeCritical.map(task => (
            <TaskRow key={task.id} task={task} onToggle={toggle} onRemove={remove} onToggleCritical={toggleCritical} />
          ))}
        </div>
      )}

      {/* Active tasks */}
      <div className="space-y-2">
        <div className="section-title"><Check className="w-3.5 h-3.5" /> Active</div>
        {activeNormal.length === 0 && activeCritical.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-6 ops-card">No active tasks. Add one above.</p>
        )}
        {activeNormal.map(task => (
          <TaskRow key={task.id} task={task} onToggle={toggle} onRemove={remove} onToggleCritical={toggleCritical} />
        ))}
      </div>

      {/* Completed */}
      {done.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowDone(s => !s)}
            className="section-title cursor-pointer hover:text-gray-300 transition-colors w-full text-left"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDone ? 'rotate-180' : ''}`} />
            Completed ({done.length})
          </button>
          {showDone && done.slice(0, 50).map(task => (
            <TaskRow key={task.id} task={task} onToggle={toggle} onRemove={remove} onToggleCritical={toggleCritical} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle, onRemove, onToggleCritical }) {
  const subColor = SUBJECT_COLORS[task.subject] || 'text-gray-400'
  return (
    <div className={`flex items-start gap-3 p-3 rounded border group transition-all
      ${task.critical && !task.done ? 'border-ops-red/30 bg-ops-red/5 critical-pulse' : 'border-bunker-700 bg-bunker-900 hover:border-bunker-600'}
      ${task.done ? 'opacity-50' : ''}`}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`w-5 h-5 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
          ${task.done ? 'bg-ops-green/20 border-ops-green' : 'border-bunker-500 hover:border-ops-green'}`}
      >
        {task.done && <Check className="w-3 h-3 text-ops-green" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`text-sm ${task.done ? 'line-through text-gray-500' : 'text-gray-100'}`}>{task.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] ${subColor}`}>{task.subject}</span>
          {task.critical && !task.done && (
            <span className="text-[10px] text-ops-red flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> CRITICAL
            </span>
          )}
          <span className="text-[9px] text-gray-700">
            {format(parseISO(task.createdAt), 'MM/dd HH:mm')}
          </span>
          {task.doneAt && (
            <span className="text-[9px] text-ops-green">✓ {format(parseISO(task.doneAt), 'MM/dd HH:mm')}</span>
          )}
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onToggleCritical(task.id)}
          title="Toggle critical"
          className={`p-1 rounded transition-colors ${task.critical ? 'text-ops-red' : 'text-gray-600 hover:text-ops-red'}`}
        >
          <AlertTriangle className="w-3 h-3" />
        </button>
        <button onClick={() => onRemove(task.id)} className="p-1 rounded text-gray-600 hover:text-ops-red transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
