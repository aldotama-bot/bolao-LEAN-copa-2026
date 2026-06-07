'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Login from '@/components/Login'
import NavBar from '@/components/NavBar'
import Palpites from '@/components/Palpites'
import Ranking from '@/components/Ranking'
import Resultados from '@/components/Resultados'
import Especiais from '@/components/Especiais'
import Stats from '@/components/Stats'
import Admin from '@/components/Admin'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [tab, setTab] = useState('palpites')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
useEffect(() => {
    const { searchParams } = new URL(window.location.href)
    const code = searchParams.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(() => {
        window.history.replaceState({}, '', '/')
      })
    }
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(data)
      } else {
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚽</div>
          <p className="text-gray-500">Carregando o bolão...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return <Login onLogin={(p) => setProfile(p)} />
  }

  const tabs: { id: string; label: string; icon: string }[] = [
    { id: 'palpites', label: 'Palpites', icon: '🎯' },
    { id: 'especiais', label: 'Especiais', icon: '⭐' },
    { id: 'resultados', label: 'Resultados', icon: '📊' },
    { id: 'ranking', label: 'Ranking', icon: '🏆' },
    { id: 'stats', label: 'Estatísticas', icon: '📈' },
    ...(profile?.is_admin ? [{ id: 'admin', label: 'Admin', icon: '⚙️' }] : []),
  ]

  return (
    <div className="max-w-2xl mx-auto px-3 pb-10">
      <NavBar profile={profile} onLogout={() => { supabase.auth.signOut(); setUser(null); setProfile(null) }} />
      <nav className="flex gap-2 flex-wrap mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-copa-green text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-copa-green'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>
      {tab === 'palpites' && <Palpites userId={user.id} />}
      {tab === 'especiais' && <Especiais userId={user.id} />}
      {tab === 'resultados' && <Resultados userId={user.id} />}
      {tab === 'ranking' && <Ranking currentUserId={user.id} />}
      {tab === 'stats' && <Stats userId={user.id} apelido={profile.apelido} />}
      {tab === 'admin' && profile?.is_admin && <Admin />}
    </div>
  )
}
