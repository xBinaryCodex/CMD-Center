import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, getRemoteData, upsertRemoteData } from '../lib/supabase'

const STORAGE_KEY = 'cmd_center_v1'
const SYNC_DEBOUNCE_MS = 1500

const XP_TABLE = [0,100,250,450,700,1000,1350,1750,2200,2700,3250,3850,4500,5200,5950,6750,7600,8500,9450,10450]

function xpForLevel(lvl) {
  return lvl < XP_TABLE.length ? XP_TABLE[lvl] : XP_TABLE[XP_TABLE.length-1] + (lvl - XP_TABLE.length + 1) * 1200
}

function levelFromXp(xp) {
  let lvl = 1
  while (xp >= xpForLevel(lvl)) lvl++
  return lvl - 1
}

const defaultState = {
  profile: { name: 'Jose', xp: 0, totalXpEarned: 0 },
  sitrep: {
    boeing: {
      role: 'L2 Network Tech (Dell Contract)', l3: 'Scottie Rodriguez',
      activeProject: 'Wireless Modernization – Legacy AP → Cisco 9166',
      status: 'In Progress', notes: '', lastUpdated: null,
    },
    wgu: {
      program: 'BS Network & Cloud – AWS Track', currentCourse: 'Cloud Practitioner',
      daysLeftInTerm: 30, completedCUs: 0, totalCUs: 120, notes: '', lastUpdated: null,
    },
    safeDays: {
      businessName: 'Safe Days Security', tagline: 'Network Security & Pen Testing Consultation',
      status: 'Active', latestUpdate: '', lastUpdated: null,
    },
    gameDev: { projectName: 'Supernatural Zelda-Style Game', engine: 'Godot', currentMilestone: '', notes: '', lastUpdated: null },
    gdquest: { currentLesson: '', progressPercent: 0, notes: '', lastUpdated: null },
  },
  objectives: [],
  tasks: [],
  calendarEvents: [],
  battlePlan: { weekOf: null, days: { Mon:[], Tue:[], Wed:[], Thu:[], Fri:[], Sat:[], Sun:[] }, rhythm: '' },
  boeing: { arista: { notes: '', studyLog: [] }, maintenanceLog: [], apSites: [], notes: '' },
  wgu: { courses: [], studySessions: [], notes: '' },
  godot: { lessonLog: [], notes: '' },
  gameDev: {
    projects: [{
      id: 'proj-1', name: 'Supernatural Zelda-Style RPG', status: 'In Dev',
      description: 'TV show inspired action RPG, Link to the Past style', milestones: [], notes: ''
    }],
  },
  safeDays: { clients: [], services: ['Network Security Audit','Pen Testing','Consultation'], log: [], notes: '' },
  kaizen: [],
  focusSessions: [],
  xpLog: [],
}

function deepMerge(base, override) {
  if (typeof base !== 'object' || base === null) return override ?? base
  if (Array.isArray(base)) return override ?? base
  const result = { ...base }
  for (const k in override) {
    if (Array.isArray(override[k])) result[k] = override[k]
    else if (typeof override[k] === 'object' && override[k] !== null) result[k] = deepMerge(base[k] ?? {}, override[k])
    else result[k] = override[k]
  }
  return result
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? deepMerge(defaultState, JSON.parse(raw)) : { ...defaultState }
  } catch { return { ...defaultState } }
}

function saveLocal(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// Global in-memory state shared across all hook instances
let globalState = loadLocal()
let listeners = []
let currentUserId = null
let syncTimer = null

function notifyAll() {
  listeners.forEach(fn => fn({ ...globalState }))
}

function commitState(next) {
  globalState = next
  saveLocal(next)
  notifyAll()
  scheduleRemoteSync()
}

function scheduleRemoteSync() {
  if (!currentUserId) return
  clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    try {
      await upsertRemoteData(currentUserId, globalState)
    } catch (e) {
      console.warn('[Sync] Remote save failed, data safe in localStorage:', e.message)
    }
  }, SYNC_DEBOUNCE_MS)
}

// Pull remote data and merge (remote wins if newer, but never loses local XP earned offline)
async function syncFromRemote(userId) {
  try {
    const remote = await getRemoteData(userId)
    if (!remote) {
      // First login — push local data up
      await upsertRemoteData(userId, globalState)
      return
    }
    // Merge: take remote as base but keep whichever has more XP (offline work protection)
    const merged = deepMerge(defaultState, remote)
    if ((globalState.profile?.xp || 0) > (merged.profile?.xp || 0)) {
      merged.profile.xp = globalState.profile.xp
      merged.profile.totalXpEarned = globalState.profile.totalXpEarned
      merged.xpLog = [...(globalState.xpLog || []), ...(merged.xpLog || [])].slice(0, 200)
    }
    globalState = merged
    saveLocal(merged)
    notifyAll()
  } catch (e) {
    console.warn('[Sync] Remote fetch failed, using local data:', e.message)
  }
}

function ts() { return new Date().toISOString() }

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useStore() {
  const [state, setState] = useState(() => globalState)

  useEffect(() => {
    const handler = (s) => setState(s)
    listeners.push(handler)
    return () => { listeners = listeners.filter(fn => fn !== handler) }
  }, [])

  const update = useCallback((fn) => {
    const next = JSON.parse(JSON.stringify(globalState)) // deep clone
    fn(next)
    commitState(next)
  }, [])

  const addXp = useCallback((amount, reason) => {
    update(s => {
      s.profile.xp = (s.profile.xp || 0) + amount
      s.profile.totalXpEarned = (s.profile.totalXpEarned || 0) + amount
      s.xpLog = [{ id: crypto.randomUUID(), amount, reason, at: ts() }, ...(s.xpLog || [])].slice(0, 200)
    })
  }, [update])

  const level = levelFromXp(state.profile?.xp || 0)
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const xpProgress = ((( state.profile?.xp || 0) - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100

  return { state, update, addXp, level, xpProgress, nextLevelXp, currentLevelXp, ts }
}

// ─── Auth helpers (called from AuthProvider) ───────────────────────────────

export async function initSession(userId) {
  currentUserId = userId
  await syncFromRemote(userId)
}

export function clearSession() {
  currentUserId = null
  clearTimeout(syncTimer)
  globalState = { ...defaultState }
  saveLocal(globalState)
  notifyAll()
}

export { ts, xpForLevel, levelFromXp }
