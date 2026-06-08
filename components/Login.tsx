'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Login({ onLogin }: { onLogin: (p: any) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'auth' | 'profile'>('auth')
  const [apelido, setApelido] = useState('')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('E-mail ou senha incorretos.'); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    if (profile) onLogin(profile)
    else setStep('profile')
    setLoading(false)
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sessão expirada.'); setLoading(false); return }
    const { data, error } = await supabase.from('profiles')
      .upsert({ id: user.id, apelido: apelido.trim() })
      .select().single()
    if (error) setError(error.message)
    else onLogin(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">⚽</div>
          <h1 className="text-xl font-medium">Bolão dos <span className="text-green-600 font-black">PIOR</span> do LEAN</h1>
          <p className="text-sm text-gray-500 mt-1">Entre para participar com seus amigos</p>
        </div>

        {step === 'auth' && (
          <form onSubmit={handleLogin}>
            <input className="input mb-3" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="input mb-3" type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Entrando...' : 'Entrar ⚽'}
            </button>
          </form>
        )}

        {step === 'profile' && (
          <form onSubmit={handleProfile}>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Último passo: escolha seu apelido no bolão!</p>
            <input className="input mb-3" placeholder="Seu apelido (ex: Zé Torcedor)" value={apelido} onChange={e => setApelido(e.target.value)} required maxLength={20} />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button type="submit" disabled={loading || !apelido.trim()} className="btn-primary w-full">
              {loading ? 'Salvando...' : 'Entrar no bolão! ⚽'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
