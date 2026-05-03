import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Gamepad2, Plus, Edit3, Save, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const STATUS_OPTS = ['Planned','In Dev','On Hold','Completed']
const STATUS_COLORS = {
  'Planned':   'text-gray-400 border-gray-600',
  'In Dev':    'text-ops-amber border-ops-amber/50',
  'On Hold':   'text-ops-red border-ops-red/50',
  'Completed': 'text-ops-green border-ops-green/50',
}

function MilestoneRow({ ms, onToggle, onDelete }) {
  return (
    <div className="flex items-center gap-2 py-1 group">
      <button
        onClick={() => onToggle(ms.id)}
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all
          ${ms.done ? 'bg-ops-green/20 border-ops-green' : 'border-bunker-500 hover:border-ops-green'}`}
      >
        {ms.done && <Check className="w-2.5 h-2.5 text-ops-green" />}
      </button>
      <span className={`text-sm flex-1 ${ms.done ? 'line-through text-gray-600' : 'text-gray-200'}`}>{ms.text}</span>
      {ms.doneAt && <span className="text-[9px] text-ops-green">{format(parseISO(ms.doneAt), 'MM/dd')}</span>}
      <button onClick={() => onDelete(ms.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash2 className="w-3 h-3 text-gray-600 hover:text-ops-red" />
      </button>
    </div>
  )
}

function ProjectCard({ project, onUpdate, onDelete, addXp, ts }) {
  const [open, setOpen] = useState(true)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState(project.description)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(project.notes || '')
  const [newMs, setNewMs] = useState('')

  const addMilestone = () => {
    if (!newMs.trim()) return
    onUpdate({ ...project, milestones: [...(project.milestones || []), { id: crypto.randomUUID(), text: newMs.trim(), done: false, addedAt: ts() }] })
    setNewMs('')
  }

  const toggleMs = (id) => {
    const ms = project.milestones.find(m => m.id === id)
    onUpdate({ ...project, milestones: project.milestones.map(m => m.id === id ? { ...m, done: !m.done, doneAt: !m.done ? ts() : null } : m) })
    if (!ms?.done) addXp(30, `Milestone: ${ms?.text}`)
  }

  const deleteMs = (id) => onUpdate({ ...project, milestones: project.milestones.filter(m => m.id !== id) })

  const done = (project.milestones || []).filter(m => m.done).length
  const total = (project.milestones || []).length

  return (
    <div className="ops-card space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-gray-100">{project.name}</h3>
            <select
              value={project.status}
              onChange={e => onUpdate({ ...project, status: e.target.value })}
              className={`text-[10px] bg-bunker-700 border rounded px-1.5 py-0.5 ${STATUS_COLORS[project.status]}`}
            >
              {STATUS_OPTS.map(s => <option key={s} className="bg-bunker-800 text-gray-200">{s}</option>)}
            </select>
          </div>
          {editingDesc ? (
            <div className="flex gap-1">
              <input className="ops-input text-xs flex-1" value={descDraft} onChange={e => setDescDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { onUpdate({ ...project, description: descDraft }); setEditingDesc(false) } }} autoFocus />
              <button onClick={() => { onUpdate({ ...project, description: descDraft }); setEditingDesc(false) }} className="ops-btn-primary"><Check className="w-3 h-3" /></button>
              <button onClick={() => setEditingDesc(false)} className="ops-btn-ghost"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1 group cursor-pointer" onClick={() => setEditingDesc(true)}>
              <span className="text-xs text-gray-400">{project.description || 'No description'}</span>
              <Edit3 className="w-2.5 h-2.5 text-gray-700 group-hover:text-ops-green" />
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setOpen(o => !o)} className="ops-btn-ghost p-1">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onDelete(project.id)} className="ops-btn-danger p-1"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>

      {open && (
        <>
          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="ops-label">Milestones {total > 0 && `(${done}/${total})`}</span>
            </div>
            {total > 0 && (
              <div className="h-1.5 bg-bunker-700 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-ops-amber rounded-full xp-bar-fill" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
              </div>
            )}
            <div className="space-y-0.5">
              {(project.milestones || []).map(ms => (
                <MilestoneRow key={ms.id} ms={ms} onToggle={toggleMs} onDelete={deleteMs} />
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                className="ops-input text-xs flex-1"
                placeholder="Add milestone…"
                value={newMs}
                onChange={e => setNewMs(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMilestone()}
              />
              <button onClick={addMilestone} className="ops-btn-primary flex-shrink-0"><Plus className="w-3 h-3" /></button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="ops-label">Notes</span>
              {!editingNotes && <button onClick={() => { setNotesDraft(project.notes || ''); setEditingNotes(true) }} className="ops-btn-ghost text-[10px] flex items-center gap-1"><Edit3 className="w-2.5 h-2.5" /> Edit</button>}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea className="ops-textarea min-h-[80px] text-xs" value={notesDraft} onChange={e => setNotesDraft(e.target.value)} autoFocus />
                <div className="flex gap-2">
                  <button onClick={() => { onUpdate({ ...project, notes: notesDraft }); setEditingNotes(false) }} className="ops-btn-primary text-xs flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                  <button onClick={() => setEditingNotes(false)} className="ops-btn-ghost text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 whitespace-pre-wrap">{project.notes || <span className="text-gray-600 italic">No notes.</span>}</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function GameDev() {
  const { state, update, addXp, ts } = useStore()
  const projects = state.gameDev?.projects || []
  const [showNew, setShowNew] = useState(false)
  const [newProj, setNewProj] = useState({ name: '', description: '', status: 'Planned' })

  const addProject = () => {
    if (!newProj.name.trim()) return
    update(s => {
      s.gameDev.projects = [...(s.gameDev.projects || []), {
        id: crypto.randomUUID(), ...newProj, milestones: [], notes: '', createdAt: ts()
      }]
    })
    setNewProj({ name: '', description: '', status: 'Planned' })
    setShowNew(false)
    addXp(20, `New project: ${newProj.name}`)
  }

  const updateProject = (proj) => {
    update(s => { s.gameDev.projects = s.gameDev.projects.map(p => p.id === proj.id ? proj : p) })
  }

  const deleteProject = (id) => {
    if (confirm('Delete this project?')) update(s => { s.gameDev.projects = s.gameDev.projects.filter(p => p.id !== id) })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ops-amber tracking-widest">// GAME DEV PROJECT CENTER</h1>
        <button onClick={() => setShowNew(s => !s)} className="ops-btn-primary flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Project
        </button>
      </div>

      {showNew && (
        <div className="ops-card space-y-3">
          <div className="section-title mb-0"><Plus className="w-3.5 h-3.5" /> New Project</div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="ops-label">Name</label><input className="ops-input" value={newProj.name} onChange={e => setNewProj(n => ({ ...n, name: e.target.value }))} placeholder="Project name…" /></div>
            <div>
              <label className="ops-label">Status</label>
              <select className="ops-input" value={newProj.status} onChange={e => setNewProj(n => ({ ...n, status: e.target.value }))}>
                {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className="ops-label">Description</label><input className="ops-input" value={newProj.description} onChange={e => setNewProj(n => ({ ...n, description: e.target.value }))} placeholder="Brief description…" /></div>
          <div className="flex gap-2">
            <button onClick={addProject} className="ops-btn-primary flex items-center gap-1"><Save className="w-3 h-3" /> Create</button>
            <button onClick={() => setShowNew(false)} className="ops-btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {projects.length === 0 && !showNew && (
        <div className="ops-card text-center py-8">
          <Gamepad2 className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No projects yet. Your supernatural RPG awaits.</p>
        </div>
      )}

      {projects.map(proj => (
        <ProjectCard
          key={proj.id}
          project={proj}
          onUpdate={updateProject}
          onDelete={deleteProject}
          addXp={addXp}
          ts={ts}
        />
      ))}
    </div>
  )
}
