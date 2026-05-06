import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useStore, clearSession } from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import { supabase, deleteUserData, redeemLicense } from '../lib/supabase'
import { isPlanPro } from '../lib/plans'
import {
  LayoutDashboard, CalendarDays, ListChecks,
  BookOpen, Network, Gamepad2, Briefcase, FlaskConical, Timer,
  ChevronRight, ChevronLeft, Shield, Zap, Trophy,
  Brain, Map, Cloud, CloudOff, LogOut,
  Code, Database, Globe, Server, Star, Cpu, Target,
  Sun, Moon, Edit3, Check, X, Trash2, Menu,
} from 'lucide-react'

// ─── Icon map for dynamic domain cards ───────────────────────────────────────
const DOMAIN_ICON_MAP = {
  Network, BookOpen, Shield, Gamepad2, Brain, Briefcase,
  Code, Database, Globe, Server, Zap, Target, Star, Cpu,
}

// ─── Nav definitions ──────────────────────────────────────────────────────────
const TOP_NAV = [
  { to: '/',           label: 'SITREP',      icon: LayoutDashboard },
  { to: '/calendar',   label: 'Calendar',    icon: CalendarDays    },
  { to: '/battleplan', label: 'Battle Plan', icon: Map             },
  { to: '/tasks',      label: 'Tasks',       icon: ListChecks      },
]

const TOOLS_NAV = [
  { to: '/kaizen', label: 'Kaizen', icon: FlaskConical },
  { to: '/focus',  label: 'Focus',  icon: Timer        },
]

// Bottom nav (mobile) — 4 most-used items + More
const BOTTOM_NAV = [
  { to: '/',         label: 'SITREP',   icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays    },
  { to: '/tasks',    label: 'Tasks',    icon: ListChecks      },
  { to: '/focus',    label: 'Focus',    icon: Timer           },
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

// ─── Shared nav item ──────────────────────────────────────────────────────────
function NavItem({ to, label, icon: Icon, collapsed, accentHex, onClick }) {
  const location = useLocation()
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
  const dotStyle = accentHex ? { backgroundColor: accentHex } : {}

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-2 py-2 rounded text-xs transition-all duration-150
        ${active
          ? 'bg-bunker-700 text-gray-100 border-l-2'
          : 'text-gray-500 hover:bg-bunker-800 hover:text-gray-300 border-l-2 border-transparent'
        }`}
      style={active ? { borderLeftColor: accentHex || '#00ff88' } : {}}
    >
      {accentHex ? (
        <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full" style={dotStyle} />
        </span>
      ) : (
        <Icon className="w-4 h-4 flex-shrink-0" style={active && accentHex ? { color: accentHex } : {}} />
      )}
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-bunker-900 border border-ops-red/40 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="flex items-center gap-2 text-ops-red">
          <Trash2 className="w-5 h-5 flex-shrink-0" />
          <h3 className="font-bold text-sm">Delete Account Data</h3>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Permanently deletes all your data. You will be signed out.{' '}
          <span className="text-ops-red font-semibold">This cannot be undone.</span>
        </p>
        <div>
          <p className="text-[10px] text-gray-500 mb-1.5">
            Type <span className="text-ops-red font-mono font-bold">DELETE</span> to confirm:
          </p>
          <input className="ops-input text-sm" placeholder="DELETE"
            value={confirmText} onChange={e => setConfirmText(e.target.value)} autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && ready) onConfirm(); if (e.key === 'Escape') onCancel() }}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onConfirm} disabled={!ready}
            className={`flex-1 ops-btn text-xs py-2 border rounded transition-all
              ${ready ? 'bg-ops-red/20 border-ops-red/60 text-ops-red hover:bg-ops-red/30'
                      : 'bg-bunker-800 border-bunker-600 text-gray-600 cursor-not-allowed'}`}>
            Delete Everything
          </button>
          <button onClick={onCancel} className="ops-btn-ghost text-xs py-2">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const [collapsed, setCollapsed]             = useState(false)
  const [synced, setSynced]                   = useState(true)
  const [theme, setTheme]                     = useState(() => localStorage.getItem('aligned_theme') || 'dark')
  const [editingName, setEditingName]         = useState(false)
  const [nameDraft, setNameDraft]             = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUpgrade, setShowUpgrade]         = useState(false)
  const [licenseKey, setLicenseKey]           = useState('')
  const [licenseError, setLicenseError]       = useState('')
  const [licenseLoading, setLicenseLoading]   = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false)

  const { state, update, level, xpProgress, nextLevelXp, currentLevelXp } = useStore()
  const { user, signOut } = useAuth()
  const location = useLocation()
  const now = new Date()

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])

  // Apply theme class to <html> and persist
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('aligned_theme', theme)
  }, [theme])

  // Flash sync indicator on state change
  useEffect(() => {
    setSynced(false)
    const t = setTimeout(() => setSynced(true), 2000)
    return () => clearTimeout(t)
  }, [state])

  const displayName = state.profile.name || user?.user_metadata?.first_name || 'USER'
  const isPro = isPlanPro(state.profile.plan)
  const domainCards = state.sitrep?.cards || []

  // ── Save display name ──────────────────────────────────────────────────────
  const saveName = async () => {
    const trimmed = nameDraft.trim()
    if (!trimmed) { setEditingName(false); return }
    update(s => { s.profile.name = trimmed })
    try { await supabase.auth.updateUser({ data: { first_name: trimmed } }) }
    catch (e) { console.warn('[Profile] metadata update failed:', e.message) }
    setEditingName(false)
  }

  // ── License key activation ─────────────────────────────────────────────────
  const activateLicense = async () => {
    if (!licenseKey.trim()) return
    setLicenseLoading(true); setLicenseError('')
    const result = await redeemLicense(licenseKey.trim(), user.id)
    setLicenseLoading(false)
    if (result.success) {
      update(s => { s.profile.plan = result.plan })
      setShowUpgrade(false); setLicenseKey('')
    } else {
      setLicenseError(result.error)
    }
  }

  // ── Delete account ─────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setShowDeleteModal(false)
    try { await deleteUserData(user.id) } catch (e) { console.warn('[Delete]', e) }
    clearSession()
    await signOut()
  }

  // ─── Sidebar / drawer nav content (shared between desktop sidebar + mobile drawer) ───
  const NavContent = ({ onClose }) => (
    <>
      {/* Logo + name */}
      <div className="px-3 py-3 border-b border-bunker-700">
        <div className="flex items-center justify-between">
          <div className="text-ops-green font-bold text-sm tracking-widest">ALIGNED</div>
          {onClose && (
            <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {editingName ? (
          <div className="flex items-center gap-1 mt-1">
            <input autoFocus value={nameDraft} onChange={e => setNameDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
              className="bg-bunker-800 border border-bunker-600 rounded px-1.5 py-0.5 text-[10px] text-gray-200 w-full focus:outline-none focus:border-ops-green/60"
              placeholder="Your name" />
            <button onClick={saveName} className="text-ops-green"><Check className="w-3 h-3" /></button>
            <button onClick={() => setEditingName(false)} className="text-gray-600"><X className="w-3 h-3" /></button>
          </div>
        ) : (
          <button
            onClick={() => { setNameDraft(displayName !== 'USER' ? displayName : ''); setEditingName(true) }}
            className="text-[10px] text-gray-400 tracking-wider hover:text-gray-200 transition-colors flex items-center gap-1 group mt-0.5"
            title="Edit display name"
          >
            // {displayName.toUpperCase()}
            <Edit3 className="w-2.5 h-2.5 text-gray-700 group-hover:text-ops-green transition-colors" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-1.5">
        {TOP_NAV.map(item => (
          <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} onClick={onClose} />
        ))}

        {domainCards.length > 0 && (
          <>
            <Divider label="Domains" collapsed={false} />
            {domainCards.map(card => (
              <NavItem key={card.id} to={`/domain/${card.id}`} label={card.title}
                icon={DOMAIN_ICON_MAP[card.icon] || Star} accentHex={card.accentColor} onClick={onClose} />
            ))}
          </>
        )}

        <Divider label="Tools" collapsed={false} />
        {TOOLS_NAV.map(item => (
          <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} onClick={onClose} />
        ))}
      </nav>

      {/* Upgrade / Pro */}
      {isPro ? (
        <div className="px-3 py-1.5 border-t border-bunker-700">
          <span className="text-[9px] text-ops-amber font-semibold tracking-widest uppercase">⚡ Pro</span>
        </div>
      ) : (
        <div className="border-t border-bunker-700">
          {showUpgrade ? (
            <div className="px-3 py-2 space-y-1.5">
              <input autoFocus
                className="ops-input text-xs py-1 font-mono tracking-widest text-center"
                placeholder="License key…"
                value={licenseKey} onChange={e => setLicenseKey(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') activateLicense(); if (e.key === 'Escape') { setShowUpgrade(false); setLicenseError('') } }}
              />
              {licenseError && <p className="text-[9px] text-ops-red">{licenseError}</p>}
              <div className="flex gap-1">
                <button onClick={activateLicense} disabled={licenseLoading || !licenseKey.trim()}
                  className="flex-1 ops-btn text-[10px] py-1 border rounded border-ops-amber/50 text-ops-amber bg-ops-amber/10 hover:bg-ops-amber/20 disabled:opacity-40">
                  {licenseLoading ? '…' : 'Activate'}
                </button>
                <button onClick={() => { setShowUpgrade(false); setLicenseError('') }}
                  className="ops-btn-ghost text-[10px] py-1 px-2"><X className="w-3 h-3" /></button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowUpgrade(true)}
              className="w-full px-3 py-2 text-[10px] text-ops-amber/70 hover:text-ops-amber hover:bg-ops-amber/5 transition-colors flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Upgrade to Pro
            </button>
          )}
        </div>
      )}

      {/* XP bar */}
      <XPBar xp={state.profile.xp || 0} level={level} xpProgress={xpProgress}
        nextLevelXp={nextLevelXp} currentLevelXp={currentLevelXp} />

      {/* Bottom actions */}
      <div className="px-3 py-2 border-t border-bunker-700 flex items-center justify-between">
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className="text-gray-500 hover:text-ops-amber transition-colors p-1">
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
        <button onClick={() => setShowDeleteModal(true)} title="Delete account data"
          className="text-gray-600 hover:text-ops-red transition-colors p-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={signOut} title="Sign out"
          className="text-gray-600 hover:text-ops-red transition-colors p-1">
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  )

  return (
    <div className="flex bg-bunker-950" style={{ position: 'fixed', inset: 0 }}>
      {/* Modals */}
      {showDeleteModal && <DeleteModal onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteModal(false)} />}

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className={`hidden lg:flex flex-col bg-bunker-900 border-r border-bunker-700 transition-all duration-200 flex-shrink-0
        ${collapsed ? 'w-14' : 'w-52'}`}>

        {/* Collapsed mode: just icons + toggle */}
        {collapsed ? (
          <>
            <div className="flex items-center justify-center px-3 py-3 border-b border-bunker-700">
              <button onClick={() => setCollapsed(false)}
                className="p-1 rounded hover:bg-bunker-700 text-gray-500 hover:text-gray-200 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-1.5">
              {TOP_NAV.map(item => (
                <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} collapsed />
              ))}
              {domainCards.length > 0 && (
                <><Divider collapsed />{domainCards.map(card => (
                  <NavItem key={card.id} to={`/domain/${card.id}`} label={card.title}
                    icon={DOMAIN_ICON_MAP[card.icon] || Star} collapsed accentHex={card.accentColor} />
                ))}</>
              )}
              <Divider collapsed />
              {TOOLS_NAV.map(item => (
                <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} collapsed />
              ))}
            </nav>
            {!isPro && (
              <button onClick={() => setCollapsed(false)} title="Upgrade to Pro"
                className="py-2 flex items-center justify-center text-ops-amber/60 hover:text-ops-amber hover:bg-ops-amber/5 transition-colors border-t border-bunker-700">
                <Zap className="w-3.5 h-3.5" />
              </button>
            )}
            {isPro && <div className="py-1.5 flex justify-center border-t border-bunker-700">
              <span className="text-[9px] text-ops-amber">⚡</span></div>}
            <XPBar xp={state.profile.xp || 0} level={level} xpProgress={xpProgress}
              nextLevelXp={nextLevelXp} currentLevelXp={currentLevelXp} />
          </>
        ) : (
          <>
            {/* Expanded header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-bunker-700">
              <div className="flex-1 min-w-0 mr-1">
                <div className="text-ops-green font-bold text-sm tracking-widest">ALIGNED</div>
                {editingName ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <input autoFocus value={nameDraft} onChange={e => setNameDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                      className="bg-bunker-800 border border-bunker-600 rounded px-1.5 py-0.5 text-[10px] text-gray-200 w-full focus:outline-none focus:border-ops-green/60"
                      placeholder="Your name" />
                    <button onClick={saveName} className="text-ops-green flex-shrink-0"><Check className="w-3 h-3" /></button>
                    <button onClick={() => setEditingName(false)} className="text-gray-600 flex-shrink-0"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setNameDraft(displayName !== 'USER' ? displayName : ''); setEditingName(true) }}
                    className="text-[10px] text-gray-400 tracking-wider hover:text-gray-200 transition-colors flex items-center gap-1 group"
                    title="Edit display name">
                    // {displayName.toUpperCase()}
                    <Edit3 className="w-2.5 h-2.5 text-gray-700 group-hover:text-ops-green transition-colors" />
                  </button>
                )}
              </div>
              <button onClick={() => setCollapsed(true)}
                className="p-1 rounded hover:bg-bunker-700 text-gray-500 hover:text-gray-200 transition-colors flex-shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-1.5">
              {TOP_NAV.map(item => (
                <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
              ))}
              {domainCards.length > 0 && (
                <><Divider label="Domains" />{domainCards.map(card => (
                  <NavItem key={card.id} to={`/domain/${card.id}`} label={card.title}
                    icon={DOMAIN_ICON_MAP[card.icon] || Star} accentHex={card.accentColor} />
                ))}</>
              )}
              <Divider label="Tools" />
              {TOOLS_NAV.map(item => (
                <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
              ))}
            </nav>

            {/* Upgrade / Pro */}
            {isPro ? (
              <div className="px-3 py-1.5 border-t border-bunker-700">
                <span className="text-[9px] text-ops-amber font-semibold tracking-widest uppercase">⚡ Pro</span>
              </div>
            ) : (
              <div className="border-t border-bunker-700">
                {showUpgrade ? (
                  <div className="px-3 py-2 space-y-1.5">
                    <input autoFocus className="ops-input text-xs py-1 font-mono tracking-widest text-center"
                      placeholder="License key…" value={licenseKey} onChange={e => setLicenseKey(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') activateLicense(); if (e.key === 'Escape') { setShowUpgrade(false); setLicenseError('') } }} />
                    {licenseError && <p className="text-[9px] text-ops-red">{licenseError}</p>}
                    <div className="flex gap-1">
                      <button onClick={activateLicense} disabled={licenseLoading || !licenseKey.trim()}
                        className="flex-1 ops-btn text-[10px] py-1 border rounded border-ops-amber/50 text-ops-amber bg-ops-amber/10 hover:bg-ops-amber/20 disabled:opacity-40">
                        {licenseLoading ? '…' : 'Activate'}
                      </button>
                      <button onClick={() => { setShowUpgrade(false); setLicenseError('') }}
                        className="ops-btn-ghost text-[10px] py-1 px-2"><X className="w-3 h-3" /></button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowUpgrade(true)}
                    className="w-full px-3 py-2 text-[10px] text-ops-amber/70 hover:text-ops-amber hover:bg-ops-amber/5 transition-colors flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> Upgrade to Pro
                  </button>
                )}
              </div>
            )}

            <XPBar xp={state.profile.xp || 0} level={level} xpProgress={xpProgress}
              nextLevelXp={nextLevelXp} currentLevelXp={currentLevelXp} />

            {/* Bottom actions */}
            <div className="px-3 py-2 border-t border-bunker-700 flex items-center justify-between">
              <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                className="text-gray-500 hover:text-ops-amber transition-colors p-1">
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setShowDeleteModal(true)} title="Delete account data"
                className="text-gray-600 hover:text-ops-red transition-colors p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={signOut} title="Sign out"
                className="text-gray-600 hover:text-ops-red transition-colors p-1">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </aside>

      {/* ── Mobile slide-in drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-bunker-900 border-r border-bunker-700 flex flex-col shadow-2xl">
            <NavContent onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-3 py-2 bg-bunker-900 border-b border-bunker-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Hamburger — mobile only */}
            <button onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 -ml-1 rounded hover:bg-bunker-700 text-gray-500 hover:text-gray-200 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <Zap className="w-3.5 h-3.5 text-ops-green hidden sm:block" />
            <span className="text-[11px] text-gray-500 tracking-wider hidden sm:block">
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {/* Mobile: just show app name */}
            <span className="text-ops-green font-bold text-sm tracking-widest lg:hidden">ALIGNED</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[10px] text-gray-600 font-mono hidden sm:block">
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {/* Sync indicator */}
            <div className="flex items-center gap-1" title={synced ? 'Synced' : 'Syncing…'}>
              {synced
                ? <Cloud className="w-3.5 h-3.5 text-ops-green" />
                : <CloudOff className="w-3.5 h-3.5 text-ops-amber animate-pulse" />}
              <span className={`text-[10px] hidden sm:block ${synced ? 'text-ops-green' : 'text-ops-amber'}`}>
                {synced ? 'SYNCED' : 'SYNCING'}
              </span>
            </div>
            {/* Theme toggle — always visible */}
            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              className="text-gray-500 hover:text-ops-amber transition-colors">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            {/* Sign out — desktop only (mobile: in drawer) */}
            <button onClick={signOut} title="Sign out"
              className="hidden lg:block text-gray-600 hover:text-ops-red transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4">
          {children}
        </main>

        {/* ── Mobile bottom nav — in normal flow (NOT fixed) so iOS keyboard can't displace it ── */}
        <nav className="mobile-bottom-nav lg:hidden flex-shrink-0 bg-bunker-900 border-t border-bunker-700 flex safe-area-inset-bottom">
          {BOTTOM_NAV.map(item => {
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
            return (
              <NavLink key={item.to} to={item.to}
                className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors
                  ${active ? 'text-ops-green' : 'text-gray-600 hover:text-gray-300'}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </NavLink>
            )
          })}
          {/* More → opens drawer */}
          <button onClick={() => setMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 text-gray-600 hover:text-gray-300 transition-colors">
            <Menu className="w-5 h-5" />
            <span className="text-[9px] font-medium">More</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
