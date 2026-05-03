import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Shield, Plus, Edit3, Save, Trash2, FileText, Users, Briefcase } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const LOG_TYPES = ['Update','Client','Proposal','Win','Learning','Admin']
const LOG_COLORS = {
  'Update':   'text-ops-blue',
  'Client':   'text-ops-green',
  'Proposal': 'text-ops-purple',
  'Win':      'text-ops-amber',
  'Learning': 'text-ops-cyan',
  'Admin':    'text-gray-500',
}

export default function SafeDays() {
  const { state, update, addXp, ts } = useStore()
  const sd = state.safeDays || {}
  const clients = sd.clients || []
  const log = sd.log || []
  const services = sd.services || []

  const [logEntry, setLogEntry] = useState('')
  const [logType, setLogType] = useState('Update')
  const [newClient, setNewClient] = useState({ name: '', contact: '', status: 'Lead' })
  const [showClientForm, setShowClientForm] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(sd.notes || '')
  const [newService, setNewService] = useState('')

  const addLog = () => {
    if (!logEntry.trim()) return
    update(s => {
      s.safeDays.log = [{ id: crypto.randomUUID(), type: logType, note: logEntry.trim(), at: ts() }, ...(s.safeDays.log || [])].slice(0, 200)
    })
    addXp(logType === 'Win' ? 50 : 10, `Safe Days ${logType}: ${logEntry}`)
    setLogEntry('')
  }

  const addClient = () => {
    if (!newClient.name.trim()) return
    update(s => {
      s.safeDays.clients = [...(s.safeDays.clients || []), { id: crypto.randomUUID(), ...newClient, addedAt: ts() }]
    })
    addXp(20, `New client: ${newClient.name}`)
    setNewClient({ name: '', contact: '', status: 'Lead' })
    setShowClientForm(false)
  }

  const updateClientStatus = (id, status) => {
    update(s => { s.safeDays.clients = s.safeDays.clients.map(c => c.id === id ? { ...c, status } : c) })
    if (status === 'Active') addXp(100, 'Client activated')
  }

  const removeClient = (id) => update(s => { s.safeDays.clients = s.safeDays.clients.filter(c => c.id !== id) })

  const addService = () => {
    if (!newService.trim()) return
    update(s => { s.safeDays.services = [...(s.safeDays.services || []), newService.trim()] })
    setNewService('')
  }

  const removeService = (svc) => update(s => { s.safeDays.services = s.safeDays.services.filter(s2 => s2 !== svc) })

  const saveNotes = () => { update(s => { s.safeDays.notes = notesDraft }); setEditingNotes(false) }

  const CLIENT_STATUS_COLORS = {
    'Lead':    'text-ops-blue',
    'Active':  'text-ops-green',
    'Closed':  'text-gray-500',
    'Paused':  'text-ops-amber',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-ops-green tracking-widest">// SAFE DAYS SECURITY</h1>
          <p className="text-xs text-gray-600 mt-0.5">Network Security & Pen Testing Consultation</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="status-dot bg-ops-green animate-pulse-slow" />
          <span className="text-xs text-ops-green">ACTIVE</span>
        </div>
      </div>

      {/* Services */}
      <div className="ops-card">
        <div className="section-title"><Briefcase className="w-3.5 h-3.5 text-ops-green" /> Services Offered</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {services.map(svc => (
            <div key={svc} className="flex items-center gap-1 px-2 py-1 rounded border border-ops-green/30 bg-ops-green/10 text-xs text-ops-green group">
              {svc}
              <button onClick={() => removeService(svc)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <Trash2 className="w-2.5 h-2.5 text-ops-red" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="ops-input flex-1 text-xs" placeholder="Add service…" value={newService} onChange={e => setNewService(e.target.value)} onKeyDown={e => e.key === 'Enter' && addService()} />
          <button onClick={addService} className="ops-btn-primary flex-shrink-0"><Plus className="w-3 h-3" /></button>
        </div>
      </div>

      {/* Client Pipeline */}
      <div className="ops-card">
        <div className="flex items-center justify-between mb-3">
          <div className="section-title mb-0"><Users className="w-3.5 h-3.5 text-ops-green" /> Client Pipeline</div>
          <button onClick={() => setShowClientForm(s => !s)} className="ops-btn-primary flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Client
          </button>
        </div>

        {showClientForm && (
          <div className="border border-bunker-600 rounded-lg p-3 bg-bunker-800 space-y-2 mb-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="ops-label">Name / Company</label><input className="ops-input" value={newClient.name} onChange={e => setNewClient(n => ({ ...n, name: e.target.value }))} placeholder="Client name…" /></div>
              <div><label className="ops-label">Contact</label><input className="ops-input" value={newClient.contact} onChange={e => setNewClient(n => ({ ...n, contact: e.target.value }))} placeholder="email or phone…" /></div>
            </div>
            <div>
              <label className="ops-label">Status</label>
              <select className="ops-input" value={newClient.status} onChange={e => setNewClient(n => ({ ...n, status: e.target.value }))}>
                {['Lead','Active','Paused','Closed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={addClient} className="ops-btn-primary flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
              <button onClick={() => setShowClientForm(false)} className="ops-btn-ghost">Cancel</button>
            </div>
          </div>
        )}

        {clients.length === 0 && !showClientForm && (
          <p className="text-xs text-gray-600 text-center py-4">No clients yet. Start building your pipeline.</p>
        )}

        <div className="space-y-1.5">
          {clients.map(client => (
            <div key={client.id} className="flex items-center gap-3 p-2.5 rounded bg-bunker-800 group">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 font-semibold">{client.name}</div>
                {client.contact && <div className="text-xs text-gray-600">{client.contact}</div>}
                <div className="text-[9px] text-gray-700">Added {format(parseISO(client.addedAt), 'MM/dd/yy')}</div>
              </div>
              <select
                value={client.status}
                onChange={e => updateClientStatus(client.id, e.target.value)}
                className={`text-[10px] bg-bunker-700 border border-bunker-600 rounded px-2 py-0.5 ${CLIENT_STATUS_COLORS[client.status] || 'text-gray-400'}`}
              >
                {['Lead','Active','Paused','Closed'].map(s => <option key={s} className="text-gray-200 bg-bunker-800">{s}</option>)}
              </select>
              <button onClick={() => removeClient(client.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3 text-gray-600 hover:text-ops-red" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div className="ops-card space-y-3">
        <div className="section-title"><FileText className="w-3.5 h-3.5 text-ops-green" /> Activity Log</div>
        <div className="flex gap-2">
          <select className="ops-input w-28 text-xs" value={logType} onChange={e => setLogType(e.target.value)}>
            {LOG_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input className="ops-input flex-1" placeholder="Log entry…" value={logEntry} onChange={e => setLogEntry(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLog()} />
          <button onClick={addLog} className="ops-btn-primary flex-shrink-0"><Plus className="w-3.5 h-3.5" /></button>
        </div>
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {log.length === 0 && <p className="text-xs text-gray-600 text-center py-2">No log entries.</p>}
          {log.map(e => (
            <div key={e.id} className="flex items-start gap-2 p-2 rounded bg-bunker-800 text-xs">
              <span className={`flex-shrink-0 text-[10px] font-semibold ${LOG_COLORS[e.type] || 'text-gray-500'}`}>[{e.type}]</span>
              <span className="flex-1 text-gray-300">{e.note}</span>
              <span className="text-gray-700 flex-shrink-0">{format(parseISO(e.at), 'MM/dd HH:mm')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="ops-card">
        <div className="flex items-center justify-between mb-2">
          <div className="section-title mb-0"><Shield className="w-3.5 h-3.5 text-ops-green" /> Strategy Notes</div>
          {!editingNotes && <button onClick={() => { setNotesDraft(sd.notes || ''); setEditingNotes(true) }} className="ops-btn-ghost flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>}
        </div>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea className="ops-textarea min-h-[120px]" value={notesDraft} onChange={e => setNotesDraft(e.target.value)} placeholder="Strategy, pricing, goals, roadmap…" autoFocus />
            <div className="flex gap-2">
              <button onClick={saveNotes} className="ops-btn-primary flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
              <button onClick={() => setEditingNotes(false)} className="ops-btn-ghost">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-300 whitespace-pre-wrap">{sd.notes || <span className="text-gray-600 italic">No notes.</span>}</div>
        )}
      </div>
    </div>
  )
}
