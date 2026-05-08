import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { RefreshCw, Unlink, CheckCircle, AlertCircle, Globe } from 'lucide-react'
import { format } from 'date-fns'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPE     = 'https://www.googleapis.com/auth/calendar.readonly'

// ─── Map Google event → Aligned format ───────────────────────────────────────

function mapGoogleEvent(gev) {
  const isAllDay  = !!gev.start?.date
  const startDate = gev.start?.date ?? gev.start?.dateTime?.slice(0, 10) ?? ''

  // Google all-day end is exclusive (next day) — subtract 1 day to match our convention
  const endDateRaw = gev.end?.date
    ? new Date(new Date(gev.end.date).getTime() - 86_400_000).toISOString().slice(0, 10)
    : (gev.end?.dateTime?.slice(0, 10) ?? startDate)

  return {
    id:         `goog_${gev.id}`,
    title:      gev.summary     || '(No title)',
    startDate,
    endDate:    endDateRaw,
    startTime:  isAllDay ? '' : (gev.start?.dateTime?.slice(11, 16) ?? ''),
    endTime:    isAllDay ? '' : (gev.end?.dateTime?.slice(11, 16)   ?? ''),
    allDay:     isAllDay,
    subject:    'personal',
    priority:   'normal',
    notes:      gev.description ?? '',
    recurrence: null,
    exceptions: [],
    source:     'google',
    googleId:   gev.id,
  }
}

// ─── Fetch from Google Calendar REST API ─────────────────────────────────────

async function fetchGoogleEvents(token, days = 90) {
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + days * 86_400_000).toISOString()

  const url =
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?' +
    new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy:      'startTime',
      maxResults:   '500',
    })

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Google API error ${res.status}`)
  }
  return res.json()
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoogleSync() {
  const { state, update }     = useStore()
  const [status, setStatus]   = useState('idle')   // idle | loading | synced | error
  const [message, setMessage] = useState('')
  const [tokenClient, setTokenClient] = useState(null)

  const syncInfo    = state.integrations?.googleSync || {}
  const isConnected = !!syncInfo.connected
  const lastSync    = syncInfo.lastSync

  // ── Perform the actual sync once we have a token ──────────────────────────
  const doSync = useCallback(async (token) => {
    setStatus('loading')
    setMessage('')
    try {
      const data         = await fetchGoogleEvents(token)
      const googleEvents = (data.items || []).map(mapGoogleEvent)

      update(s => {
        // Replace all previous Google events, keep user-created ones
        const own = (s.calendarEvents || []).filter(e => !e.id?.startsWith('goog_'))
        s.calendarEvents = [...own, ...googleEvents]
        if (!s.integrations) s.integrations = {}
        s.integrations.googleSync = {
          connected: true,
          lastSync:  new Date().toISOString(),
          count:     googleEvents.length,
        }
      })

      setStatus('synced')
      setMessage(`${googleEvents.length} events imported`)
    } catch (e) {
      setStatus('error')
      setMessage(e.message)
    }
  }, [update])

  // ── Initialize Google token client after GIS script loads ─────────────────
  const initTokenClient = useCallback(() => {
    if (!window.google?.accounts?.oauth2 || !CLIENT_ID) return
    const tc = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope:     SCOPE,
      callback:  (resp) => {
        if (resp.error) {
          setStatus('error')
          setMessage(resp.error_description || resp.error)
          return
        }
        doSync(resp.access_token)
      },
    })
    setTokenClient(tc)
  }, [doSync])

  // ── Load GIS script once on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!CLIENT_ID) return
    if (window.google?.accounts?.oauth2) { initTokenClient(); return }

    const existing = document.getElementById('gis-script')
    if (existing) {
      existing.addEventListener('load', initTokenClient)
      return
    }
    const script    = document.createElement('script')
    script.id       = 'gis-script'
    script.src      = 'https://accounts.google.com/gsi/client'
    script.async    = true
    script.onload   = initTokenClient
    document.head.appendChild(script)
  }, [initTokenClient])

  // ── Connect / re-sync ──────────────────────────────────────────────────────
  const connect = () => {
    if (!tokenClient) {
      setStatus('error')
      setMessage('Google not ready yet — try again in a moment')
      return
    }
    tokenClient.requestAccessToken()
  }

  // ── Disconnect — remove all Google events ─────────────────────────────────
  const disconnect = () => {
    update(s => {
      s.calendarEvents = (s.calendarEvents || []).filter(e => !e.id?.startsWith('goog_'))
      if (!s.integrations) s.integrations = {}
      s.integrations.googleSync = { connected: false, lastSync: null, count: 0 }
    })
    setStatus('idle')
    setMessage('')
    // Revoke token so Google re-prompts next time
    if (window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke('', () => {})
    }
  }

  // Hidden until VITE_GOOGLE_CLIENT_ID is set
  if (!CLIENT_ID) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!isConnected ? (
        <button
          onClick={connect}
          disabled={status === 'loading'}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded border transition-colors
            border-ops-blue/40 text-ops-blue bg-ops-blue/10 hover:bg-ops-blue/20 disabled:opacity-50"
        >
          <Globe className="w-3.5 h-3.5" />
          {status === 'loading' ? 'Syncing…' : 'Sync Google Calendar'}
        </button>
      ) : (
        <>
          <button
            onClick={connect}
            disabled={status === 'loading'}
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded border transition-colors
              border-ops-green/40 text-ops-green bg-ops-green/10 hover:bg-ops-green/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
            {status === 'loading' ? 'Syncing…' : 'Re-sync Google'}
          </button>
          <button
            onClick={disconnect}
            className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded border border-bunker-600
              text-gray-500 hover:text-ops-red hover:border-ops-red/40 transition-colors"
          >
            <Unlink className="w-3 h-3" /> Disconnect
          </button>
        </>
      )}

      {/* Status messages */}
      {status === 'synced' && (
        <span className="text-[10px] text-ops-green flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> {message}
        </span>
      )}
      {status === 'error' && (
        <span className="text-[10px] text-ops-red flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {message}
        </span>
      )}
      {isConnected && lastSync && status !== 'loading' && (
        <span className="text-[10px] text-gray-600">
          · synced {format(new Date(lastSync), 'MMM d · HH:mm')}
          {syncInfo.count != null ? ` · ${syncInfo.count} events` : ''}
        </span>
      )}
    </div>
  )
}
