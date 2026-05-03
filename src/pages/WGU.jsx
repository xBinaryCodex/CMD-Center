import { useState } from 'react'
import { useStore } from '../store/useStore'
import { BookOpen, Plus, Trash2, Check, Edit3, X, Save, GraduationCap, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function WGU() {
  const { state, update, addXp, ts } = useStore()
  const wgu = state.wgu || {}
  const courses = wgu.courses || []
  const sessions = wgu.studySessions || []

  const [newCourse, setNewCourse] = useState({ name: '', cus: '', status: 'Not Started' })
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [sessionNote, setSessionNote] = useState('')
  const [sessionDuration, setSessionDuration] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(wgu.notes || '')

  const sitrep = state.sitrep.wgu

  const addCourse = () => {
    if (!newCourse.name.trim()) return
    update(s => {
      s.wgu.courses = [...(s.wgu.courses || []), {
        id: crypto.randomUUID(), ...newCourse, cus: Number(newCourse.cus) || 0, addedAt: ts()
      }]
    })
    setNewCourse({ name: '', cus: '', status: 'Not Started' })
    setShowAddCourse(false)
    addXp(10, `WGU course added: ${newCourse.name}`)
  }

  const updateCourseStatus = (id, status) => {
    update(s => {
      s.wgu.courses = s.wgu.courses.map(c => c.id === id ? { ...c, status, completedAt: status === 'Completed' ? ts() : c.completedAt } : c)
    })
    if (status === 'Completed') {
      const c = courses.find(c => c.id === id)
      addXp(100, `WGU course completed: ${c?.name}`)
    }
  }

  const removeCourse = (id) => update(s => { s.wgu.courses = s.wgu.courses.filter(c => c.id !== id) })

  const logSession = () => {
    if (!sessionNote.trim()) return
    update(s => {
      s.wgu.studySessions = [{
        id: crypto.randomUUID(), note: sessionNote.trim(),
        duration: sessionDuration, at: ts()
      }, ...(s.wgu.studySessions || [])].slice(0, 100)
    })
    addXp(30, `WGU study session: ${sessionNote}`)
    setSessionNote('')
    setSessionDuration('')
  }

  const saveNotes = () => {
    update(s => { s.wgu.notes = notesDraft })
    setEditingNotes(false)
  }

  const STATUS_COLORS = {
    'Not Started': 'text-gray-500 border-gray-600',
    'In Progress': 'text-ops-amber border-ops-amber/50',
    'Completed':   'text-ops-green border-ops-green/50',
    'Retake':      'text-ops-red border-ops-red/50',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ops-purple tracking-widest">// WGU — CLOUD & NETWORK</h1>
      </div>

      {/* Status bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Program', value: sitrep.program, color: 'text-ops-purple' },
          { label: 'Current Course', value: sitrep.currentCourse, color: 'text-ops-blue' },
          { label: 'Term Days Left', value: `${sitrep.daysLeftInTerm}d`, color: sitrep.daysLeftInTerm <= 7 ? 'text-ops-red' : 'text-ops-amber' },
          { label: 'Courses Done', value: `${courses.filter(c => c.status === 'Completed').length}/${courses.length}`, color: 'text-ops-green' },
        ].map(item => (
          <div key={item.label} className="ops-card text-center">
            <div className="ops-label">{item.label}</div>
            <div className={`text-sm font-bold ${item.color}`}>{item.value || '—'}</div>
          </div>
        ))}
      </div>

      {/* Course tracker */}
      <div className="ops-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="section-title mb-0"><GraduationCap className="w-3.5 h-3.5 text-ops-purple" /> Course Tracker</div>
          <button onClick={() => setShowAddCourse(s => !s)} className="ops-btn-primary flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Course
          </button>
        </div>

        {showAddCourse && (
          <div className="border border-bunker-600 rounded-lg p-3 bg-bunker-800 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="ops-label">Course Name</label>
                <input className="ops-input" value={newCourse.name} onChange={e => setNewCourse(n => ({ ...n, name: e.target.value }))} placeholder="e.g. Cloud Practitioner" />
              </div>
              <div>
                <label className="ops-label">CUs</label>
                <input type="number" className="ops-input" value={newCourse.cus} onChange={e => setNewCourse(n => ({ ...n, cus: e.target.value }))} placeholder="3" />
              </div>
            </div>
            <div>
              <label className="ops-label">Status</label>
              <select className="ops-input" value={newCourse.status} onChange={e => setNewCourse(n => ({ ...n, status: e.target.value }))}>
                {['Not Started','In Progress','Completed','Retake'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={addCourse} className="ops-btn-primary flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
              <button onClick={() => setShowAddCourse(false)} className="ops-btn-ghost">Cancel</button>
            </div>
          </div>
        )}

        {courses.length === 0 && !showAddCourse && (
          <p className="text-xs text-gray-600 text-center py-4">No courses tracked yet.</p>
        )}

        <div className="space-y-1.5">
          {courses.map(course => (
            <div key={course.id} className="flex items-center gap-3 p-2.5 rounded bg-bunker-800 group">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200">{course.name}</div>
                <div className="text-[10px] text-gray-600">{course.cus} CUs · Added {format(parseISO(course.addedAt), 'MM/dd/yy')}</div>
              </div>
              <select
                value={course.status}
                onChange={e => updateCourseStatus(course.id, e.target.value)}
                className={`text-[10px] bg-bunker-700 border rounded px-2 py-0.5 ${STATUS_COLORS[course.status] || 'text-gray-400'}`}
              >
                {['Not Started','In Progress','Completed','Retake'].map(s => <option key={s} className="text-gray-200 bg-bunker-800">{s}</option>)}
              </select>
              <button onClick={() => removeCourse(course.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3 text-gray-600 hover:text-ops-red" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Study session log */}
      <div className="ops-card space-y-3">
        <div className="section-title"><Clock className="w-3.5 h-3.5 text-ops-blue" /> Log Study Session</div>
        <div className="flex gap-2">
          <input className="ops-input flex-1" placeholder="What did you study?" value={sessionNote} onChange={e => setSessionNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && logSession()} />
          <input className="ops-input w-20" placeholder="mins" type="number" value={sessionDuration} onChange={e => setSessionDuration(e.target.value)} />
          <button onClick={logSession} className="ops-btn-primary flex-shrink-0"><Plus className="w-3.5 h-3.5" /></button>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {sessions.length === 0 && <p className="text-xs text-gray-600 text-center py-2">No sessions logged.</p>}
          {sessions.map(s => (
            <div key={s.id} className="flex items-start gap-2 p-2 rounded bg-bunker-800 text-xs">
              <div className="flex-1 text-gray-300">{s.note}</div>
              {s.duration && <span className="text-ops-blue flex-shrink-0">{s.duration}m</span>}
              <span className="text-gray-700 flex-shrink-0">{format(parseISO(s.at), 'MM/dd HH:mm')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="ops-card">
        <div className="flex items-center justify-between mb-2">
          <div className="section-title mb-0"><BookOpen className="w-3.5 h-3.5 text-ops-purple" /> Notes</div>
          {!editingNotes && (
            <button onClick={() => { setNotesDraft(wgu.notes || ''); setEditingNotes(true) }} className="ops-btn-ghost flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea className="ops-textarea min-h-[120px]" value={notesDraft} onChange={e => setNotesDraft(e.target.value)} autoFocus />
            <div className="flex gap-2">
              <button onClick={saveNotes} className="ops-btn-primary flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
              <button onClick={() => setEditingNotes(false)} className="ops-btn-ghost">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-300 whitespace-pre-wrap">{wgu.notes || <span className="text-gray-600 italic">No notes.</span>}</div>
        )}
      </div>
    </div>
  )
}
