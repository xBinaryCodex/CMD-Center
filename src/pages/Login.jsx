import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Shield, Terminal, Eye, EyeOff, Loader } from 'lucide-react'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]       = useState('login') // 'login' | 'signup'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        const { error } = await signUp(email, password)
        if (error) throw error
        setSuccess('Account created! Check your email to confirm, then log in.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bunker-950 flex items-center justify-center p-4">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Terminal className="w-8 h-8 text-ops-green" />
            <span className="text-2xl font-bold text-ops-green tracking-widest">CMD CENTER</span>
          </div>
          <p className="text-xs text-gray-600 tracking-wider">SECURE ACCESS — AUTHENTICATE TO CONTINUE</p>
        </div>

        {/* Card */}
        <div className="ops-card-glow p-6 space-y-4">
          <div className="flex border border-bunker-600 rounded overflow-hidden">
            <button
              onClick={() => { setMode('login'); setError('') }}
              className={`flex-1 py-2 text-xs font-semibold transition-colors
                ${mode === 'login' ? 'bg-ops-green/20 text-ops-green' : 'text-gray-500 hover:text-gray-300'}`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => { setMode('signup'); setError('') }}
              className={`flex-1 py-2 text-xs font-semibold transition-colors
                ${mode === 'signup' ? 'bg-ops-green/20 text-ops-green' : 'text-gray-500 hover:text-gray-300'}`}
            >
              CREATE ACCOUNT
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="ops-label">Email</label>
              <input
                type="email"
                className="ops-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="ops-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="ops-input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-ops-red bg-ops-red/10 border border-ops-red/30 rounded px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="text-xs text-ops-green bg-ops-green/10 border border-ops-green/30 rounded px-3 py-2">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="ops-btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader className="w-4 h-4 animate-spin" /> Authenticating…</>
                : mode === 'login' ? '→ ENTER COMMAND CENTER' : '→ CREATE ACCOUNT'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-4">
          All data encrypted and synced via Supabase
        </p>
      </div>
    </div>
  )
}
