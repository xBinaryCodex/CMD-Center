import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, CalendarDays, ListChecks,
  BookOpen, Network, Gamepad2, Briefcase, FlaskConical, Timer,
  ChevronRight, ChevronLeft, Shield, Zap, Trophy,
  Brain, Map, Cloud, CloudOff, LogOut,
  Code, Database, Globe, Server, Star, Cpu, Target,
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

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [synced, setSynced]       = useState(true)
  const { state, level, xpProgress, nextLevelXp, currentLevelXp } = useStore()
  const { user, signOut } = useAuth()
  const location = useLocation()
  const now = new Date()

  // Flash sync indicator whenever state changes
  useEffect(() => {
    setSynced(false)
    const t = setTimeout(() => setSynced(true), 2000)
    return () => clearTimeout(t)
  }, [state])

  // Derive display name: auth metadata → store profile name
  const displayName = user?.user_metadata?.first_name || state.profile.name || 'USER'

  // Dynamic domain cards from SITREP
  const domainCards = state.sitrep?.cards || []

  return (
    <div className="flex h-screen overflow-hidden bg-bunker-950">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-bunker-900 border-r border-bunker-700 transition-all duration-200 flex-shrink-0
          ${collapsed ? 'w-14' : 'w-52'}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-bunker-700">
          {!collapsed && (
            <div>
              <div className="text-ops-green font-bold text-sm tracking-widest">CMD CENTER</div>
              <div className="text-[10px] text-gray-600 tracking-wider">// {displayName.toUpperCase()}</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1 rounded hover:bg-bunker-700 text-gray-500 hover:text-gray-200 transition-colors ml-auto"
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
