import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { Timer, Play, Pause, RotateCcw, CheckCircle, XCircle, ChevronDown, ChevronUp, Zap, Lock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { isPlanPro } from '../lib/plans'

const PRESETS = [
  { label: '25m', seconds: 25 * 60, type: 'work' },
  { label: '50m', seconds: 50 * 60, type: 'work' },
  { label: '90m', seconds: 90 * 60, type: 'work' },
  { label: '5m break', seconds: 5 * 60, type: 'break' },
  { label: '15m break', seconds: 15 * 60, type: 'break' },
]

const PERSONAL_SUBJECT = { id: 'personal', title: 'Personal', accentColor: '#6b7280' }

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function SessionRow({ s }) {
  const diff = s.success === null ? null : s.success
  return (
    <div className="flex items-center gap-3 p-2.5 rounded bg-bunker-800 text-xs">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${diff === true ? 'bg-ops-green' : diff === false ? 'bg-ops-red' : 'bg-gray-500'}`} />
      <div className="flex-1 min-w-0">
        <div className="text-gray-200">{s.focus}</div>
        <div className="text-gray-600">{s.subject} · {Math.round(s.duration / 60)}m</div>
      </div>
      {s.success !== null && (
        <div className={`text-[10px] font-semibold flex-shrink-0 ${s.success ? 'text-ops-green' : 'text-ops-red'}`}>
          {s.success ? '✓ SUCCESS' : '✗ FAILED'}
        </div>
      )}
      <div className="text-gray-700 flex-shrink-0">{format(parseISO(s.at), 'MM/dd HH:mm')}</div>
    </div>
  )
}

export default function Focus() {
  const { state, update, addXp, ts } = useStore()
  const sessions = state.focusSessions || []

  // Dynamic subjects from SITREP cards + Personal fallback
  const domainSubjects = state.sitrep?.cards || []
  const allSubjects = [...domainSubjects, PERSONAL_SUBJECT]

  const [totalSeconds, setTotalSeconds] = useState(25 * 60)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [focusLabel, setFocusLabel] = useState('')
  const [subject, setSubject] = useState(() => domainSubjects[0]?.title || 'Personal')
  const [sessionType, setSessionType] = useState('work')
  const [startedAt, setStartedAt] = useState(null)
  const [showLogs, setShowLogs] = useState(true)
  const [customMins, setCustomMins] = useState('')
  const intervalRef = useRef(null)
  const alarmRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            if (alarmRef.current) { alarmRef.current.currentTime = 0; alarmRef.current.play().catch(() => {}) }
            return 0
          }
          return r - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const start = () => {
    if (!focusLabel.trim()) return
    setStartedAt(ts())
    setRunning(true)
  }

  const pause = () => setRunning(false)
  const resume = () => setRunning(true)

  const reset = () => {
    setRunning(false)
    setRemaining(totalSeconds)
    setStartedAt(null)
  }

  const setPreset = (p) => {
    setRunning(false)
    setTotalSeconds(p.seconds)
    setRemaining(p.seconds)
    setSessionType(p.type)
    setStartedAt(null)
  }

  const setCustom = () => {
    const mins = parseInt(customMins)
    if (!mins || mins <= 0) return
    const secs = mins * 60
    setRunning(false)
    setTotalSeconds(secs)
    setRemaining(secs)
    setStartedAt(null)
    setCustomMins('')
  }

  const complete = (success) => {
    if (!startedAt) return
    const duration = totalSeconds - remaining
    update(s => {
      s.focusSessions = [{
        id: crypto.randomUUID(), focus: focusLabel.trim(), subject, duration,
        planned: totalSeconds, success, at: startedAt, endAt: ts()
      }, ...(s.focusSessions || [])].slice(0, 200)
    })
    const xp = success ? Math.round((duration / 60) * 3 + 20) : 10
    addXp(xp, `Focus: ${focusLabel} (${success ? 'success' : 'failed'})`)
    reset()
    setStartedAt(null)
  }

  const percent = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0
  const circumference = 2 * Math.PI * 80
  const strokeDash = circumference - (percent / 100) * circumference

  const todaySessions = sessions.filter(s => {
    try { return format(parseISO(s.at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') }
    catch { return false }
  })
  const todayMins = todaySessions.reduce((acc, s) => acc + Math.round(s.duration / 60), 0)
  const todaySuccess = todaySessions.filter(s => s.success).length

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Invisible audio element for alarm */}
      <audio ref={alarmRef} preload="none">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA..." type="audio/wav" />
      </audio>

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ops-red tracking-widest">// FOCUS — POMODORO</h1>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>{todayMins}m today</span>
          <span className="text-ops-green">{todaySuccess} sessions ✓</span>
        </div>
      </div>

      {/* Timer card */}
      <div className="ops-card-glow flex flex-col items-center py-6 space-y-4">
        {/* SVG ring timer */}
        <div className="relative">
          <svg width="200" height="200" className="-rotate-90">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#1a2a3a" strokeWidth="10" />
            <circle
              cx="100" cy="100" r="80" fill="none"
              stroke={remaining === 0 ? '#00ff88' : sessionType === 'break' ? '#38bdf8' : '#ef4444'}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-bold font-mono tabular-nums ${remaining === 0 ? 'text-ops-green animate-pulse' : 'text-gray-100'}`}>
              {formatTime(remaining)}
            </div>
            <div className="text-xs text-gray-600 mt-1">{sessionType === 'break' ? 'BREAK' : 'FOCUS'}</div>
          </div>
        </div>

        {/* Presets */}
        <div className="flex gap-2 flex-wrap justify-center">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => setPreset(p)}
              className={`ops-btn text-[10px] border ${p.seconds === totalSeconds && p.type === sessionType ? 'border-ops-red bg-ops-red/20 text-ops-red' : 'border-bunker-600 text-gray-500 hover:border-gray-500'}`}
            >
              {p.label}
            </button>
          ))}
          <div className="flex gap-1">
            <input type="number" className="ops-input w-14 text-xs text-center" placeholder="min" value={customMins} onChange={e => setCustomMins(e.target.value)} onKeyDown={e => e.key === 'Enter' && setCustom()} />
            <button onClick={setCustom} className="ops-btn-ghost text-xs">set</button>
          </div>
        </div>

        {/* Focus label & subject */}
        <div className="w-full max-w-sm space-y-2">
          <input
            className="ops-input text-center"
            placeholder="What are you focusing on?"
            value={focusLabel}
            onChange={e => setFocusLabel(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5 justify-center">
            {allSubjects.map(s => {
              const isActive = subject === s.title
              const hex = s.accentColor || '#6b7280'
              const [r,g,b] = [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
              const activeStyle = isActive
                ? { borderColor: `rgba(${r},${g},${b},0.6)`, backgroundColor: `rgba(${r},${g},${b},0.12)`, color: `rgb(${r},${g},${b})` }
                : {}
              return (
                <button
                  key={s.id}
                  onClick={() => setSubject(s.title)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1
                    ${isActive ? '' : 'border-bunker-600 text-gray-600 hover:border-gray-500'}`}
                  style={activeStyle}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: hex }} />
                  {s.title}
                </button>
              )
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {!running && remaining === totalSeconds && (
            <button onClick={start} disabled={!focusLabel.trim()} className="ops-btn-primary flex items-center gap-2 px-6 py-2 disabled:opacity-40">
              <Play className="w-4 h-4" /> Start
            </button>
          )}
          {running && (
            <button onClick={pause} className="ops-btn bg-ops-amber/20 border border-ops-amber/50 text-ops-amber flex items-center gap-2 px-6 py-2">
              <Pause className="w-4 h-4" /> Pause
            </button>
          )}
          {!running && remaining < totalSeconds && remaining > 0 && (
            <button onClick={resume} className="ops-btn-primary flex items-center gap-2 px-4 py-2">
              <Play className="w-4 h-4" /> Resume
            </button>
          )}
          {startedAt && (
            <>
              <button onClick={() => complete(true)} className="ops-btn bg-ops-green/20 border border-ops-green/50 text-ops-green flex items-center gap-2 px-4 py-2">
                <CheckCircle className="w-4 h-4" /> Done ✓
              </button>
              <button onClick={() => complete(false)} className="ops-btn-danger flex items-center gap-2 px-4 py-2">
                <XCircle className="w-4 h-4" /> Fail
              </button>
            </>
          )}
          {(remaining < totalSeconds) && (
            <button onClick={reset} className="ops-btn-ghost flex items-center gap-1 px-3 py-2">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>

        {remaining === 0 && (
          <div className="text-ops-green text-sm font-bold animate-pulse">
            ⚡ TIME'S UP — mark success or fail above
          </div>
        )}
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Sessions Today', value: todaySessions.length, color: 'text-gray-200' },
          { label: 'Focus Minutes', value: todayMins, color: 'text-ops-red' },
          { label: 'Success Rate', value: todaySessions.length ? `${Math.round((todaySuccess/todaySessions.length)*100)}%` : '—', color: 'text-ops-green' },
        ].map(s => (
          <div key={s.label} className="ops-card text-center">
            <div className="ops-label">{s.label}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Session log — Pro only */}
      <div className="ops-card">
        {isPlanPro(state.profile.plan) ? (
          <>
            <button
              onClick={() => setShowLogs(l => !l)}
              className="flex items-center justify-between w-full"
            >
              <div className="section-title mb-0"><Zap className="w-3.5 h-3.5 text-ops-red" /> Session Log ({sessions.length})</div>
              {showLogs ? <ChevronUp className="w-3.5 h-3.5 text-gray-600" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600" />}
            </button>
            {showLogs && (
              <div className="mt-3 space-y-1.5 max-h-72 overflow-y-auto">
                {sessions.length === 0 && <p className="text-xs text-gray-600 text-center py-4">No sessions logged yet.</p>}
                {sessions.map(s => <SessionRow key={s.id} s={s} />)}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="section-title mb-0"><Zap className="w-3.5 h-3.5 text-ops-red" /> Session Log</div>
            <span className="text-[10px] text-ops-amber/70 flex items-center gap-1 border border-ops-amber/30 rounded px-2 py-0.5">
              <Lock className="w-2.5 h-2.5" /> Pro feature
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
