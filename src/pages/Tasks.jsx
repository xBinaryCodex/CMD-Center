import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Plus, Trash2, Check, AlertTriangle, ChevronDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function Tasks() {
  const { state, update, addXp, ts } = useStore()
  const tasks = state.tasks || []

  const [title, setTitle]       = useState('')
  const [critical, setCritical] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const add = () => {
    if (!title.trim()) return
    update(s => {
      s.tasks = [{
        id: crypto.randomUUID(),
        title: title.trim(),
        critical,
        done: false,
        createdAt: ts(),
        doneAt: null,
      }, ...(s.tasks || [])]
    })
    setTitle('')
    setCritical(false)
    addXp(5, `Task created: ${title}`)
  }

  const toggle = (id) => {
    const t = tasks.find(t => t.id === id)
    update(s => {
      s.tasks = s.tasks.map(t =>
        t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? ts() : null } : t
      )
    })
    if (!t?.done) addXp(t?.critical ? 50 : 20, `Task done: ${t?.title}`)
  }

  const remove = (id) =>
    update(s => { s.tasks = s.tasks.filter(t => t.id !== id) })

  const toggleCritical = (id) =>
    update(s => { s.tasks = s.tasks.map(t => t.id === id ? { ...t, critical: !t.critical } : t) })

  const active   = tasks.filter(t => !t.done)
  const done     = tasks.filter(t =>  t.done)
  const critical_ = active.filter(t => t.critical)
  const normal   = active.filter(t => !t.critical)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ops-cyan tracking-widest">// TASKS</h1>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {critical_.length > 0 && <><span className="text-ops-red">{critical_.length} critical</span><span>·</span></>}
          <span>{active.length} active</span>
          <span>·</span>
          <span>{done.length} done</span>
        </div>
      </div>

      {/* Add task */}
      <div className="ops-card">
        <div className="flex gap-2">
          <input
            className="ops-input flex-1"
            placeholder="Add a task… (Enter to add)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            autoFocus
          />
          <button
            onClick={() => setCritical(c => !c)}
            title="Mark as critical"
            className={`ops-btn flex-shrink-0 border rounded transition-colors px-3
              ${critical ? 'bg-ops-red/20 border-ops-red/60 text-ops-red' : 'border-bunker-600 text-gray-600 hover:border-gray-500'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={add}
            className="ops-btn-primary flex items-center gap-1.5 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {critical && (
          <p className="text-[10px] text-ops-red mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Marked as critical — 50 XP on completion
          </p>
        )}
      </div>

      {/* Critical tasks */}
      {critical_.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] text-ops-red uppercase tracking-wider font-semibold px-1">
            <AlertTriangle className="w-3 h-3" /> Critical ({critical_.length})
          </div>
          {critical_.map(task => (
            <TaskRow key={task.id} task={task} onToggle={toggle} onRemove={remove} onToggleCritical={toggleCritical} />
          ))}
        </div>
      )}

      {/* Active tasks */}
      <div className="space-y-1.5">
        {normal.length === 0 && critical_.length === 0 && (
          <div className="text-center py-10 ops-card">
            <Check className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-600">All clear. Add something above.</p>
          </div>
        )}
        {normal.map(task => (
          <TaskRow key={task.id} task={task} onToggle={toggle} onRemove={remove} onToggleCritical={toggleCritical} />
        ))}
      </div>

      {/* Completed */}
      {done.length > 0 && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowDone(s => !s)}
            className="flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-gray-300 transition-colors uppercase tracking-wider w-full px-1"
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
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded border group transition-all
      ${task.critical && !task.done
        ? 'border-ops-red/30 bg-ops-red/5 critical-pulse'
        : 'border-bunker-700 bg-bunker-900 hover:border-bunker-600'}
      ${task.done ? 'opacity-40' : ''}`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all
          ${task.done
            ? 'bg-ops-green/20 border-ops-green'
            : 'border-bunker-500 hover:border-ops-green'}`}
      >
        {task.done && <Check className="w-3 h-3 text-ops-green" />}
      </button>

      {/* Title */}
      <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-500' : 'text-gray-100'}`}>
        {task.title}
      </span>

      {/* Critical badge */}
      {task.critical && !task.done && (
        <span className="text-[10px] text-ops-red flex items-center gap-0.5 flex-shrink-0">
          <AlertTriangle className="w-2.5 h-2.5" /> CRITICAL
        </span>
      )}

      {/* Timestamp */}
      <span className="text-[9px] text-gray-700 flex-shrink-0 hidden group-hover:block">
        {task.doneAt
          ? `✓ ${format(parseISO(task.doneAt), 'MM/dd')}`
          : format(parseISO(task.createdAt), 'MM/dd')}
      </span>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onToggleCritical(task.id)}
          title="Toggle critical"
          className={`p-1 rounded transition-colors ${task.critical ? 'text-ops-red' : 'text-gray-600 hover:text-ops-red'}`}
        >
          <AlertTriangle className="w-3 h-3" />
        </button>
        <button
          onClick={() => onRemove(task.id)}
          className="p-1 rounded text-gray-600 hover:text-ops-red transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
