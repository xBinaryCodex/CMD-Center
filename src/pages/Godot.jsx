import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Brain, Plus, Edit3, Save, BookOpen } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function Godot() {
  const { state, update, addXp, ts } = useStore()
  const godot = state.godot || {}
  const lessonLog = godot.lessonLog || []
  const sitrep = state.sitrep.gdquest

  const [lesson, setLesson] = useState('')
  const [duration, setDuration] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(godot.notes || '')

  const logLesson = () => {
    if (!lesson.trim()) return
    update(s => {
      s.godot.lessonLog = [{
        id: crypto.randomUUID(), lesson: lesson.trim(), duration, at: ts()
      }, ...(s.godot.lessonLog || [])].slice(0, 200)
    })
    addXp(25, `Godot lesson: ${lesson}`)
    setLesson('')
    setDuration('')
  }

  const saveNotes = () => {
    update(s => { s.godot.notes = notesDraft })
    setEditingNotes(false)
    addXp(5, 'Updated Godot notes')
  }

  const updateProgress = (val) => {
    update(s => { s.sitrep.gdquest.progressPercent = val; s.sitrep.gdquest.lastUpdated = ts() })
  }

  const updateCurrentLesson = (val) => {
    update(s => { s.sitrep.gdquest.currentLesson = val; s.sitrep.gdquest.lastUpdated = ts() })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-lg font-bold text-ops-lime tracking-widest">// GODOT — GDQUEST TRACK</h1>

      {/* Progress card */}
      <div className="ops-card-glow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="ops-label">Current Lesson / Module</label>
            <input
              className="ops-input"
              value={sitrep.currentLesson || ''}
              onChange={e => updateCurrentLesson(e.target.value)}
              placeholder="e.g. GDQuest Module 3 – Signals"
            />
          </div>
          <div>
            <label className="ops-label">Course Progress — {sitrep.progressPercent || 0}%</label>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-3 bg-bunker-700 rounded-full overflow-hidden">
                <div className="h-full bg-ops-lime rounded-full xp-bar-fill" style={{ width: `${sitrep.progressPercent || 0}%` }} />
              </div>
            </div>
            <input
              type="range" min="0" max="100"
              value={sitrep.progressPercent || 0}
              onChange={e => updateProgress(Number(e.target.value))}
              className="w-full mt-1 accent-ops-lime"
            />
          </div>
        </div>
      </div>

      {/* Log lesson */}
      <div className="ops-card space-y-3">
        <div className="section-title"><Plus className="w-3.5 h-3.5 text-ops-lime" /> Log Lesson / Session</div>
        <div className="flex gap-2">
          <input className="ops-input flex-1" placeholder="Lesson or topic studied…" value={lesson} onChange={e => setLesson(e.target.value)} onKeyDown={e => e.key === 'Enter' && logLesson()} />
          <input type="number" className="ops-input w-20" placeholder="mins" value={duration} onChange={e => setDuration(e.target.value)} />
          <button onClick={logLesson} className="ops-btn-primary flex-shrink-0"><Plus className="w-3.5 h-3.5" /></button>
        </div>
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {lessonLog.length === 0 && <p className="text-xs text-gray-600 text-center py-4">No lessons logged yet.</p>}
          {lessonLog.map(e => (
            <div key={e.id} className="flex items-center gap-2 p-2 rounded bg-bunker-800 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-ops-lime flex-shrink-0" />
              <span className="flex-1 text-gray-300">{e.lesson}</span>
              {e.duration && <span className="text-ops-lime flex-shrink-0">{e.duration}m</span>}
              <span className="text-gray-700 flex-shrink-0">{format(parseISO(e.at), 'MM/dd HH:mm')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="ops-card">
        <div className="flex items-center justify-between mb-2">
          <div className="section-title mb-0"><BookOpen className="w-3.5 h-3.5 text-ops-lime" /> Notes & Concepts</div>
          {!editingNotes && <button onClick={() => { setNotesDraft(godot.notes || ''); setEditingNotes(true) }} className="ops-btn-ghost flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>}
        </div>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea className="ops-textarea min-h-[160px]" value={notesDraft} onChange={e => setNotesDraft(e.target.value)} placeholder="GDScript notes, concepts, cheat sheet…" autoFocus />
            <div className="flex gap-2">
              <button onClick={saveNotes} className="ops-btn-primary flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
              <button onClick={() => setEditingNotes(false)} className="ops-btn-ghost">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {godot.notes || <span className="text-gray-600 italic">No notes yet. Click Edit to add concepts and code snippets.</span>}
          </div>
        )}
      </div>
    </div>
  )
}
