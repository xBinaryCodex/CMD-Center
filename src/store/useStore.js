import { useState, useEffect, useCallback } from 'react'
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

// ─── Default SITREP cards ─────────────────────────────────────────────────

export function buildDefaultCards() {
  return [
    {
      id: 'boeing',
      title: 'Boeing — Dell Contract',
      icon: 'Network',
      accentColor: 'blue',
      status: 'In Progress',
      order: 0,
      collapsed: false,
      // Boeing-specific
      role: 'L2 Network Tech (Dell Contract)',
      l3: 'Scottie Rodriguez',
      hasProjects: true,
      activeProjectId: 'wp-1',
      projects: [
        { id: 'wp-1', name: 'Wireless Modernization – Legacy AP → Cisco 9166', notes: [] }
      ],
      notes: [],
      objectives: [],
    },
    {
      id: 'wgu',
      title: 'WGU — Cloud & Network BS',
      icon: 'BookOpen',
      accentColor: 'purple',
      status: 'In Progress',
      order: 1,
      collapsed: false,
      // WGU-specific
      program: 'BS Network & Cloud – AWS Track',
      currentCourse: 'Cloud Practitioner',
      daysLeftInTerm: 30,
      completedCUs: 0,
      totalCUs: 120,
      notes: [],
      objectives: [],
    },
    {
      id: 'safedays',
      title: 'Safe Days Security',
      icon: 'Shield',
      accentColor: 'green',
      status: 'Active',
      order: 2,
      collapsed: false,
      tagline: 'Network Security & Pen Testing Consultation',
      notes: [],
      objectives: [],
    },
    {
      id: 'gamedev',
      title: 'Game Dev',
      icon: 'Gamepad2',
      accentColor: 'amber',
      status: 'In Dev',
      order: 3,
      collapsed: false,
      engine: 'Godot',
      currentMilestone: '',
      hasProjects: true,
      activeProjectId: 'gd-1',
      projects: [
        { id: 'gd-1', name: 'Supernatural Zelda-Style RPG', notes: [] }
      ],
      notes: [],
      objectives: [],
    },
    {
      id: 'gdquest',
      title: 'GDQuest Course',
      icon: 'Brain',
      accentColor: 'lime',
      status: 'Active',
      order: 4,
      collapsed: false,
      currentLesson: '',
      progressPercent: 0,
      notes: [],
      objectives: [],
    },
  ]
}

const defaultState = {
  profile: { name: 'Jose', xp: 0, totalXpEarned: 0 },
  sitrep: { cards: buildDefaultCards() },
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

// ─── Migration: old flat sitrep → new cards structure ────────────────────

function migrate(state) {
  if (state.sitrep && !state.sitrep.cards) {
    // Convert old format to new cards, preserving whatever text data existed
    const old = state.sitrep
    const cards = buildDefaultCards()

    // Carry over old notes as first note entry if they had content
    const carry = (cardId, oldNote) => {
      if (!oldNote || typeof oldNote !== 'string' || !oldNote.trim()) return
      const card = cards.find(c => c.id === cardId)
      if (card) card.notes.push({ id: crypto.randomUUID(), text: oldNote.trim(), at: new Date().toISOString() })
    }
    carry('boeing',   old.boeing?.notes)
    carry('wgu',      old.wgu?.notes)
    carry('safedays', old.safeDays?.latestUpdate)
    carry('gamedev',  old.gameDev?.notes)
    carry('gdquest',  old.gdquest?.notes)

    // WGU numbers
    const wguCard = cards.find(c => c.id === 'wgu')
    if (wguCard && old.wgu) {
      if (old.wgu.currentCourse)   wguCard.currentCourse   = old.wgu.currentCourse
      if (old.wgu.daysLeftInTerm)  wguCard.daysLeftInTerm  = old.wgu.daysLeftInTerm
      if (old.wgu.completedCUs)    wguCard.completedCUs    = old.wgu.completedCUs
      if (old.wgu.totalCUs)        wguCard.totalCUs        = old.wgu.totalCUs
    }

    // GDQuest progress
    const gdqCard = cards.find(c => c.id === 'gdquest')
    if (gdqCard && old.gdquest) {
      if (old.gdquest.currentLesson)    gdqCard.currentLesson    = old.gdquest.currentLesson
      if (old.gdquest.progressPercent)  gdqCard.progressPercent  = old.gdquest.progressPercent
    }

    // Old global objectives → boeing card objectives
    if (Array.isArray(state.objectives) && state.objectives.length) {
      const boeingCard = cards.find(c => c.id === 'boeing')
      if (boeingCard) boeingCard.objectives = state.objectives
    }

    state.sitrep = { cards }
    delete state.objectives
  }

  // Ensure every card has notes + objectives arrays (for cards added before this version)
  if (Array.isArray(state.sitrep?.cards)) {
    state.sitrep.cards = state.sitrep.cards.map(c => ({
      ...c,
      notes: c.notes || [],
      objectives: c.objectives || [],
      projects: c.projects || undefined,
    }))
  }

  return state
}

// ─── Deep merge ──────────────────────────────────────────────────────────

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

// ─── Local storage ───────────────────────────────────────────────────────

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState }
    const parsed = JSON.parse(raw)
    const merged = deepMerge(defaultState, parsed)
    return migrate(merged)
  } catch { return { ...defaultState } }
}

function saveLocal(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// ─── Global singleton state ──────────────────────────────────────────────

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
    try { await upsertRemoteData(currentUserId, globalState) }
    catch (e) { console.warn('[Sync] Remote save failed:', e.message) }
  }, SYNC_DEBOUNCE_MS)
}

async function syncFromRemote(userId) {
  try {
    const remote = await getRemoteData(userId)
    if (!remote) { await upsertRemoteData(userId, globalState); return }
    const merged = migrate(deepMerge(defaultState, remote))
    // Keep whichever has more XP (offline protection)
    if ((globalState.profile?.xp || 0) > (merged.profile?.xp || 0)) {
      merged.profile.xp = globalState.profile.xp
      merged.profile.totalXpEarned = globalState.profile.totalXpEarned
      merged.xpLog = [...(globalState.xpLog || []), ...(merged.xpLog || [])].slice(0, 200)
    }
    globalState = merged
    saveLocal(merged)
    notifyAll()
  } catch (e) { console.warn('[Sync] Remote fetch failed:', e.message) }
}

function ts() { return new Date().toISOString() }

// ─── Hook ────────────────────────────────────────────────────────────────

export function useStore() {
  const [state, setState] = useState(() => globalState)

  useEffect(() => {
    const handler = (s) => setState(s)
    listeners.push(handler)
    return () => { listeners = listeners.filter(fn => fn !== handler) }
  }, [])

  const update = useCallback((fn) => {
    const next = JSON.parse(JSON.stringify(globalState))
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
  const xpProgress = (((state.profile?.xp || 0) - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100

  return { state, update, addXp, level, xpProgress, nextLevelXp, currentLevelXp, ts }
}

// ─── Auth helpers ─────────────────────────────────────────────────────────

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
