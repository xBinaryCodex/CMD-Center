import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useStore, clearSession } from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import { supabase, deleteUserData } from '../lib/supabase'
import {
  LayoutDashboard, CalendarDays, ListChecks,
  BookOpen, Network, Gamepad2, Briefcase, FlaskConical, Timer,
  ChevronRight, ChevronLeft, Shield, Zap, Trophy,
  Brain, Map, Cloud, CloudOff, LogOut,
  Code, Database, Globe, Server, Star, Cpu, Target,
  Sun, Moon, Edit3, Check, X, Trash2,
} from 'lucide-react'

// ─── Icon map for dynamic domain cards ───────────────────────────────────────
const DOMAIN_ICON_MAP = {
  Network, BookOpen, Shield, Gamepad2, Brain, Briefcase,
  Code, Database, Globe, Server, Zap, Target, Star, Cpu,
}

// ─── Static nav sections ──────────────────────────────────────────────────────
const TOP_NAV = [
  { to: '/',            label: 'SITREP',      icon: LayoutDashboard, color: 'text-ops-green' },
  { to: '/calendar',    label: 'Calendar',    icon: CalendarDays,    color: 'text-ops-blue' },
  { to: '/battleplan',  label: 'Battle Plan', icon: Map,             color: 'text-ops-amber' },
  { to: '/tasks',       label: 'Tasks',       icon: ListChecks,      color: 'text-ops-cyan' },
]

const TOOLS_NAV = [
  { to: '/kaizen', label: 'Kaizen', icon: FlaskConical, color: 'text-ops-cyan' },
  { to: '/focus',  label: 'Focus',  icon: Timer,        color: 'text-ops-red' },
]

// ─── XP bar ───────────────────────────────────────────────────────────────────
function XPBar({ xp, level, xpProgress, nextLevelXp }) {
  return (
    <div className="px-3 py-2 border-t border-bunker-700">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Trophy className="w-3 h-3 text-ops-amber" />
          <span className="text-[10px] text-ops-amber font-semibold">LVL {level}</span>
        </div>
        <span className="text-[10px] text-gray-500">{xp.toLocaleString()} XP</span>
      </div>
      <div className="h-1.5 bg-bunker-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-ops-amber to-ops-green rounded-full xp-bar-fill"
          style={{ width: `${Math.min(xpProgress, 100)}%` }}
        />
      </div>
      <div className="text-[9px] text-gray-600 mt-0.5 text-right">
        {(nextLevelXp - xp).toLocaleString()} to LVL {level + 1}
      </div>
    </div>
  )
}

// ─── Nav link ─────────────────────────────────────────────────────────────────
function NavItem({ to, label, icon: Icon, collapsed, accentHex }) {
  const location = useLocation()
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  const iconStyle = active && accentHex ? { color: accentHex } : {}
  const dotStyle  = accentHex ? { backgroundColor: accentHex } : {}

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-2.5 px-2 py-2 rounded text-xs transition-all duration-150
        ${active
          ? 'bg-bunker-700 text-gray-100 border-l-2'
          : 'text-gray-500 hover:bg-bunker-800 hover:text-gray-300 border-l-2 border-transparent'
        }`}
      style={active ? { borderLeftColor: accentHex || '#00ff88' } : {}}
    >
      {accentHex ? (
        /* Domain card: colored dot instead of lucide icon */
        <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full" style={dotStyle} />
        </span>
      ) : (
        <Icon className={`w-4 h-4 flex-shrink-0`} style={iconStyle} />
      )}
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

// ─── Section divider ──────────────────────────────────────────────────────────
function Divider({ label, collapsed }) {
  return collapsed
    ? <div className="my-2 border-t border-bunker-700" />
    : <div className="px-2 pt-3 pb-1 text-[9px] text-gray-600 uppercase tracking-widest">{label}</div>
}

// ─── Delete account modal ─────────────────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel }) {
  const [confirmText, setConfirmText] = useState('')
  const ready = confirmText === 'DELETE'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-bunker-900 border border-ops-red/40 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="flex items-center gap-2 text-ops-red">
          <Trash2 className="w-5 h-5 flex-shrink-0" />
          <h3 className="font-bold text-sm">Delete Account Data</h3>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          This permanently deletes all your data — domains, notes, objectives, calendar events, XP, everything.
          You will be signed out. <span className="text-ops-red font-semibold">This cannot be undone.</span>
        </p>
        <div>
          <p className="text-[10px] text-gray-500 mb-1.5">
            Type <span className="text-ops-red font-mono font-bold">DELETE</span> to confirm:
          </p>
          <input
            className="ops-input text-sm"
            placeholder="DELETE"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && ready) onConfirm(); if (e.key === 'Escape') onCancel() }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={!ready}
            className={`flex-1 ops-btn text-xs py-2 border rounded transition-all
              ${ready
                ? 'bg-ops-red/20 border-ops-red/60 text-ops-red hover:bg-ops-red/30'
                : 'bg-bunker-800 border-bunker-600 text-gray-600 cursor-not-allowed'}`}
          >
            Delete Everything
          </button>
          <button onClick={onCancel} className="ops-btn-ghost text-xs py-2">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const [collapsed, setCollapsed]           = useState(false)
  const [synced, setSynced]                 = useState(true)
  const [theme, setTheme]                   = useState(() => localStorage.getItem('cmdcenter_theme') || 'dark')
  const [editingName, setEditingName]       = useState(false)
  const [nameDraft, setNameDraft]           = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { state, update, level, xpProgress, nextLevelXp, currentLevelXp } = useStore()
  const { user, signOut } = useAuth()
  const location = useLocation()
  const now = new Date()

  // Apply theme class to <html> and persist
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('cmdcenter_theme', theme)
  }, [theme])

  // Flash sync indicator whenever state changes
  useEffect(() => {
    setSynced(false)
    const t = setTimeout(() => setSynced(true), 2000)
    return () => clearTimeout(t)
  }, [state])

  // Display name: store profile takes priority (updated by name editor + by initSession),
  // then auth metadata fallback, then generic placeholder
  const displayName = state.profile.name || user?.user_metadata?.first_name || 'USER'

  // Dynamic domain cards from SITREP
  const domainCards = state.sitrep?.cards || []

  // ── Save display name ──────────────────────────────────────────────────────
  const saveName = async () => {
    const trimmed = nameDraft.trim()
    if (!trimmed) { setEditingName(false); return }
    // Update store immediately so UI reflects change
    update(s => { s.profile.name = trimmed })
    // Sync to Supabase user metadata so next login remembers it
    try { await supabase.auth.updateUser({ data: { first_name: trimmed } }) }
    catch (e) { console.warn('[Profile] metadata update failed:', e.message) }
    setEditingName(false)
  }

  // ── Delete account ─────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setShowDeleteModal(false)
    try { await deleteUserData(user.id) } catch (e) { console.warn('[Delete] Remote data delete failed:', e) }
    clearSession()
    await signOut()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bunker-950">
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-bunker-900 border-r border-bunker-700 transition-all duration-200 flex-shrink-0
          ${collapsed ? 'w-14' : 'w-52'}`}
      >
        {/* Logo + Name */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-bunker-700">
          {!collapsed && (
            <div className="flex-1 min-w-0 mr-1">
              <div className="text-ops-green font-bold text-sm tracking-widest">CMD CENTER</div>
              {/* Editable display name */}
              {editingName ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    autoFocus
                    value={nameDraft}
                    onChange={e => setNameDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                    className="bg-bunker-800 border border-bunker-600 rounded px-1.5 py-0.5 text-[10px] text-gray-200 w-full focus:outline-none focus:border-ops-green/60"
                    placeholder="Your name"
                  />
                  <button onClick={saveName} className="text-ops-green hover:text-white flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => setEditingName(false)} className="text-gray-600 hover:text-gray-300 flex-shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setNameDraft(displayName !== 'USER' ? displayName : ''); setEditingName(true) }}
                  className="text-[10px] text-gray-400 tracking-wider hover:text-gray-200 transition-colors flex items-center gap-1 group"
                  title="Edit display name"
                >
                  // {displayName.toUpperCase()}
                  <Edit3 className="w-2.5 h-2.5 text-gray-700 group-hover:text-ops-green transition-colors" />
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1 rounded hover:bg-bunker-700 text-gray-500 hover:text-gray-200 transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-1.5">
          {/* Top static nav */}
          {TOP_NAV.map(item => (
            <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} collapsed={collapsed} />
          ))}

          {/* Dynamic Domains section */}
          {domainCards.length > 0 && (
            <>
              <Divider label="Domains" collapsed={collapsed} />
              {domainCards.map(card => (
                <NavItem
                  key={card.id}
                  to={`/domain/${card.id}`}
                  label={card.title}
                  icon={DOMAIN_ICON_MAP[card.icon] || Star}
                  collapsed={collapsed}
                  accentHex={card.accentColor}
                />
              ))}
            </>
          )}

          {/* Tools section */}
          <Divider label="Tools" collapsed={collapsed} />
          {TOOLS_NAV.map(item => (
            <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} collapsed={collapsed} />
          ))}
        </nav>

        {/* XP Bar */}
        <XPBar
          xp={state.profile.xp || 0}
          level={level}
          xpProgress={xpProgress}
          nextLevelXp={nextLevelXp}
          currentLevelXp={currentLevelXp}
        />
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-2 bg-bunker-900 border-b border-bunker-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-ops-green" />
            <span className="text-[11px] text-gray-500 tracking-wider">
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-600 font-mono">
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {/* Sync indicator */}
            <div className="flex items-center gap-1.5" title={synced ? 'Synced to cloud' : 'Syncing…'}>
              {synced
                ? <Cloud className="w-3.5 h-3.5 text-ops-green" />
                : <CloudOff className="w-3.5 h-3.5 text-ops-amber animate-pulse" />
              }
              <span className={`text-[10px] ${synced ? 'text-ops-green' : 'text-ops-amber'}`}>
                {synced ? 'SYNCED' : 'SYNCING'}
              </span>
            </div>
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="text-gray-500 hover:text-ops-amber transition-colors"
            >
              {theme === 'dark'
                ? <Sun className="w-3.5 h-3.5" />
                : <Moon className="w-3.5 h-3.5" />
              }
            </button>
            {/* Delete account */}
            <button
              onClick={() => setShowDeleteModal(true)}
              title="Delete account data"
              className="text-gray-600 hover:text-ops-red transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {/* Sign out */}
            <button
              onClick={signOut}
              title="Sign out"
              className="text-gray-600 hover:text-ops-red transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
