import { useState } from 'react'
import { Lock, Zap } from 'lucide-react'
import { redeemLicense } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useAuth } from '../context/AuthContext'

/**
 * Full-page paywall with inline key redemption.
 * Drop this inside any pro-gated page component.
 *
 * Usage:
 *   if (!isPro) return <UpgradePrompt feature="Battle Plan" />
 */
export default function UpgradePrompt({ feature }) {
  const [key, setKey]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const { update } = useStore()
  const { user } = useAuth()

  const activate = async () => {
    if (!key.trim()) return
    setLoading(true)
    setError('')
    const result = await redeemLicense(key.trim(), user.id)
    setLoading(false)
    if (result.success) {
      update(s => { s.profile.plan = result.plan })
      setSuccess(true)
    } else {
      setError(result.error)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-ops-green/10 border border-ops-green/40 flex items-center justify-center">
          <Zap className="w-8 h-8 text-ops-green" />
        </div>
        <h2 className="text-lg font-bold text-ops-green">Pro Activated!</h2>
        <p className="text-sm text-gray-400">Reloading your access…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <div className="w-16 h-16 rounded-full bg-ops-amber/10 border border-ops-amber/30 flex items-center justify-center">
        <Lock className="w-8 h-8 text-ops-amber" />
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-200">Pro Feature</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">
          <span className="text-ops-amber font-semibold">{feature}</span> is included in CMD Center Pro.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2.5">
        <input
          className="ops-input text-sm text-center tracking-widest font-mono"
          placeholder="Enter your license key"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && activate()}
          autoFocus
        />
        {error && <p className="text-xs text-ops-red">{error}</p>}
        <button
          onClick={activate}
          disabled={loading || !key.trim()}
          className="ops-btn-primary w-full flex items-center justify-center gap-2 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Zap className="w-3.5 h-3.5" />
          {loading ? 'Activating…' : 'Activate License Key'}
        </button>
      </div>

      <p className="text-[10px] text-gray-700 max-w-xs leading-relaxed">
        Purchase a key via Venmo or CashApp — contact <span className="text-ops-amber">@xBinaryCodex</span> after payment.
      </p>
    </div>
  )
}
