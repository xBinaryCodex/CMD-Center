import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Network, Plus, Trash2, Edit3, Save, BookOpen, Wifi, Phone, HardDrive, ChevronDown, ChevronUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'

function Section({ title, icon: Icon, color, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="ops-card">
      <div className="flex items-center justify-between cursor-pointer mb-2" onClick={() => setOpen(o => !o)}>
        <div className={`section-title mb-0 ${color}`}>
          <Icon className="w-3.5 h-3.5" /> {title}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-600" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600" />}
      </div>
      {open && children}
    </div>
  )
}

function LogEntry({ label, value, sub }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-bunker-700 last:border-0">
      <div className="flex-1">
        <div className="text-sm text-gray-200">{label}</div>
        {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
      </div>
      {value && <span className="text-xs text-gray-500 flex-shrink-0">{value}</span>}
    </div>
  )
}

export default function Boeing() {
  const { state, update, addXp, ts } = useStore()
  const boeing = state.boeing || {}
  const arista = boeing.arista || {}
  const apSites = boeing.apSites || []
  const mainLog = boeing.maintenanceLog || []

  const [newSite, setNewSite] = useState({ name: '', location: '', apCount: '', status: 'Pending' })
  const [showSiteForm, setShowSiteForm] = useState(false)
  const [mainEntry, setMainEntry] = useState('')
  const [aristaNote, setAristaNote] = useState('')
  const [aristaStudy, setAristaStudy] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(boeing.notes || '')
  const [editingArista, setEditingArista] = useState(false)
  const [aristaDraft, setAristaDraft] = useState(arista.notes || '')

  const SITE_STATUS = {
    'Pending':     'text-gray-500 bg-gray-500/10',
    'In Progress': 'text-ops-amber bg-ops-amber/10',
    'Completed':   'text-ops-green bg-ops-green/10',
    'On Hold':     'text-ops-red bg-ops-red/10',
  }

  const addSite = () => {
    if (!newSite.name.trim()) return
    update(s => {
      s.boeing.apSites = [...(s.boeing.apSites || []), { id: crypto.randomUUID(), ...newSite, apCount: Number(newSite.apCount) || 0, addedAt: ts() }]
    })
    setNewSite({ name: '', location: '', apCount: '', status: 'Pending' })
    setShowSiteForm(false)
    addXp(10, `AP site added: ${newSite.name}`)
  }

  const updateSiteStatus = (id, status) => {
    update(s => { s.boeing.apSites = s.boeing.apSites.map(a => a.id === id ? { ...a, status } : a) })
    if (status === 'Completed') addXp(75, `AP site completed: ${apSites.find(a => a.id === id)?.name}`)
  }

  const removeSite = (id) => update(s => { s.boeing.apSites = s.boeing.apSites.filter(a => a.id !== id) })

  const addMainEntry = () => {
    if (!mainEntry.trim()) return
    update(s => {
      s.boeing.maintenanceLog = [{ id: crypto.randomUUID(), note: mainEntry.trim(), at: ts() }, ...(s.boeing.maintenanceLog || [])].slice(0, 200)
    })
    addXp(10, `Maintenance log: ${mainEntry}`)
    setMainEntry('')
  }

  const logAristaStudy = () => {
    if (!aristaStudy.trim()) return
    update(s => {
      s.boeing.arista.studyLog = [{ id: crypto.randomUUID(), note: aristaStudy.trim(), at: ts() }, ...(s.boeing.arista.studyLog || [])].slice(0, 100)
    })
    addXp(20, `Arista study: ${aristaStudy}`)
    setAristaStudy('')
  }

  const saveNotes = () => { update(s => { s.boeing.notes = notesDraft }); setEditingNotes(false) }
  const saveArista = () => { update(s => { s.boeing.arista.notes = aristaDraft }); setEditingArista(false) }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-lg font-bold text-ops-blue tracking-widest">// BOEING — DELL CONTRACT</h1>

      {/* Info bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Role', value: 'L2 Network Tech' },
          { label: 'L3', value: 'Scottie Rodriguez' },
          { label: 'Project', value: 'Wireless Modernization' },
          { label: 'AP Model', value: 'Cisco 9166' },
        ].map(item => (
          <div key={item.label} className="ops-card text-center">
            <div className="ops-label">{item.label}</div>
            <div className="text-sm text-ops-blue font-semibold">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Wireless Modernization tracker */}
      <Section title="Wireless Modernization — AP Site Tracker" icon={Wifi} color="text-ops-cyan" defaultOpen>
        <div className="flex justify-end mb-3">
          <button onClick={() => setShowSiteForm(s => !s)} className="ops-btn-primary flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Site
          </button>
        </div>

        {showSiteForm && (
          <div className="border border-bunker-600 rounded-lg p-3 bg-bunker-800 space-y-2 mb-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="ops-label">Site Name</label><input className="ops-input" value={newSite.name} onChange={e => setNewSite(n => ({ ...n, name: e.target.value }))} placeholder="e.g. Building 40-10" /></div>
              <div><label className="ops-label">Location</label><input className="ops-input" value={newSite.location} onChange={e => setNewSite(n => ({ ...n, location: e.target.value }))} placeholder="e.g. Everett, WA" /></div>
              <div><label className="ops-label">AP Count</label><input type="number" className="ops-input" value={newSite.apCount} onChange={e => setNewSite(n => ({ ...n, apCount: e.target.value }))} placeholder="0" /></div>
              <div>
                <label className="ops-label">Status</label>
                <select className="ops-input" value={newSite.status} onChange={e => setNewSite(n => ({ ...n, status: e.target.value }))}>
                  {['Pending','In Progress','Completed','On Hold'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addSite} className="ops-btn-primary flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
              <button onClick={() => setShowSiteForm(false)} className="ops-btn-ghost">Cancel</button>
            </div>
          </div>
        )}

        {apSites.length === 0 && !showSiteForm && (
          <p className="text-xs text-gray-600 text-center py-4">No sites tracked. Add your first site above.</p>
        )}

        <div className="space-y-2">
          {apSites.map(site => (
            <div key={site.id} className="flex items-center gap-3 p-2.5 rounded bg-bunker-800 group">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 font-semibold">{site.name}</div>
                <div className="text-xs text-gray-600">{site.location} · {site.apCount} APs · Added {format(parseISO(site.addedAt), 'MM/dd/yy')}</div>
              </div>
              <select
                value={site.status}
                onChange={e => updateSiteStatus(site.id, e.target.value)}
                className={`text-[10px] bg-bunker-700 border border-bunker-600 rounded px-2 py-0.5 ${SITE_STATUS[site.status]?.split(' ')[0] || 'text-gray-400'}`}
              >
                {['Pending','In Progress','Completed','On Hold'].map(s => <option key={s} className="text-gray-200 bg-bunker-800">{s}</option>)}
              </select>
              <button onClick={() => removeSite(site.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3 text-gray-600 hover:text-ops-red" />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Arista subsection */}
      <Section title="Arista Study Track" icon={BookOpen} color="text-ops-cyan" defaultOpen>
        <div className="space-y-3">
          <div className="flex gap-2 mb-2">
            <input className="ops-input flex-1" placeholder="Log study session / topic…" value={aristaStudy} onChange={e => setAristaStudy(e.target.value)} onKeyDown={e => e.key === 'Enter' && logAristaStudy()} />
            <button onClick={logAristaStudy} className="ops-btn-primary flex-shrink-0"><Plus className="w-3.5 h-3.5" /></button>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1">
            {(arista.studyLog || []).length === 0 && <p className="text-xs text-gray-600">No study sessions logged.</p>}
            {(arista.studyLog || []).map(e => (
              <div key={e.id} className="flex gap-2 p-2 rounded bg-bunker-800 text-xs">
                <span className="flex-1 text-gray-300">{e.note}</span>
                <span className="text-gray-700">{format(parseISO(e.at), 'MM/dd HH:mm')}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="ops-label">Arista Notes</span>
              {!editingArista && <button onClick={() => { setAristaDraft(arista.notes || ''); setEditingArista(true) }} className="ops-btn-ghost text-[10px] flex items-center gap-1"><Edit3 className="w-2.5 h-2.5" /> Edit</button>}
            </div>
            {editingArista ? (
              <div className="space-y-2">
                <textarea className="ops-textarea min-h-[100px]" value={aristaDraft} onChange={e => setAristaDraft(e.target.value)} autoFocus />
                <div className="flex gap-2">
                  <button onClick={saveArista} className="ops-btn-primary flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                  <button onClick={() => setEditingArista(false)} className="ops-btn-ghost">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-300 whitespace-pre-wrap">{arista.notes || <span className="text-gray-600 italic">No notes. ACE exam goal noted.</span>}</div>
            )}
          </div>
        </div>
      </Section>

      {/* Maintenance log */}
      <Section title="Maintenance / Activity Log" icon={HardDrive} color="text-ops-blue">
        <div className="flex gap-2 mb-3">
          <input className="ops-input flex-1" placeholder="Log maintenance activity, ticket, or note…" value={mainEntry} onChange={e => setMainEntry(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMainEntry()} />
          <button onClick={addMainEntry} className="ops-btn-primary flex-shrink-0"><Plus className="w-3.5 h-3.5" /></button>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {mainLog.length === 0 && <p className="text-xs text-gray-600 text-center py-2">No entries.</p>}
          {mainLog.map(e => (
            <LogEntry key={e.id} label={e.note} value={format(parseISO(e.at), 'MM/dd/yy HH:mm')} />
          ))}
        </div>
      </Section>

      {/* General notes */}
      <div className="ops-card">
        <div className="flex items-center justify-between mb-2">
          <div className="section-title mb-0"><BookOpen className="w-3.5 h-3.5 text-ops-blue" /> General Notes</div>
          {!editingNotes && <button onClick={() => { setNotesDraft(boeing.notes || ''); setEditingNotes(true) }} className="ops-btn-ghost flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>}
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
          <div className="text-sm text-gray-300 whitespace-pre-wrap">{boeing.notes || <span className="text-gray-600 italic">No notes.</span>}</div>
        )}
      </div>
    </div>
  )
}
