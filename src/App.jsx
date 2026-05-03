import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Sitrep from './pages/Sitrep'
import Calendar from './pages/Calendar'
import BattlePlan from './pages/BattlePlan'
import Tasks from './pages/Tasks'
import WGU from './pages/WGU'
import Boeing from './pages/Boeing'
import Godot from './pages/Godot'
import GameDev from './pages/GameDev'
import SafeDays from './pages/SafeDays'
import Kaizen from './pages/Kaizen'
import Focus from './pages/Focus'
import { Loader } from 'lucide-react'

function ProtectedRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/"           element={<Sitrep />} />
        <Route path="/calendar"   element={<Calendar />} />
        <Route path="/battleplan" element={<BattlePlan />} />
        <Route path="/tasks"      element={<Tasks />} />
        <Route path="/wgu"        element={<WGU />} />
        <Route path="/boeing"     element={<Boeing />} />
        <Route path="/godot"      element={<Godot />} />
        <Route path="/gamedev"    element={<GameDev />} />
        <Route path="/safedays"   element={<SafeDays />} />
        <Route path="/kaizen"     element={<Kaizen />} />
        <Route path="/focus"      element={<Focus />} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bunker-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-ops-green">
          <Loader className="w-5 h-5 animate-spin" />
          <span className="text-sm tracking-wider">INITIALIZING…</span>
        </div>
      </div>
    )
  }

  if (!user) return <Login />
  return <ProtectedRoutes />
}
