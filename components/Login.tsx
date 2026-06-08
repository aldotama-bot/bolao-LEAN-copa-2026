'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Login({ onLogin }: { onLogin: (p: any) => void }) {
  const [step, setStep] = useState<'auth' | 'profile'>('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [apelido, setApelido] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const supabase = createClient()

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    if (usePassword) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      if (profile) onLogin(profile)
      else setStep('profile')
    } else {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
      if (error) setError(error.message)
      else setMagicSent(true)
    }
    setLoading(false)
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sessão expirada, faça login novamente'); setLoading(false); return }
    const { data, error } = await supabase.from('profiles')
      .upsert({ id: user.id, apelido: apelido.trim() })
      .select().single()
    if (error) setError(error.message)
    else onLogin(data)
    setLoading(false)
  }

  if (magicSent) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-sm w-full text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-lg font-medium mb-2">Verifique seu e-mail!</h2>
        <p className="text-gray-500 text-sm">Enviamos um link de acesso para <strong>{email}</strong>. Clique nele para entrar.</p>
        <button onClick={() => setMagicSent(false)} className="mt-4 text-sm text-copa-green underline">Tentar outro e-mail</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">⚽</div>
         <h1 className="text-xl font-medium">Bolão dos <span className="text-green-600 font-black">PIOR</span> do LEAN</h1>
          <p className="text-sm text-gray-500 mt-1">Entre para participar com seus amigos</p>
        </div>

        {step === 'auth' && (
          <>
            <form onSubmit={handleEmail}>
              <input className="input mb-3" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              {usePassword && (
                <input className="input mb-3" type="password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} required />
              )}
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Entrando...' : usePassword ? 'Entrar com senha' : 'Receber link de acesso'}
              </button>
            </form>
            <button onClick={() => setUsePassword(!usePassword)} className="mt-3 text-sm text-copa-green underline w-full text-center">
              {usePassword ? 'Usar link por e-mail' : 'Entrar com senha'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              {usePassword ? 'Use sua senha cadastrada.' : 'Sem senha — você recebe um link no e-mail para entrar.'}
            </p>
          </>
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
