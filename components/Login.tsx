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
  const supabase = createClient()

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    if (error) setError(error.message)
    else setMagicSent(true)
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
          <h1 className="text-xl font-medium">Bolão Copa 2026</h1>
          <p className="text-sm text-gray-500 mt-1">Entre para participar com seus amigos</p>
        </div>

        {step === 'auth' && (
          <>
            <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-4">
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/></svg>
              Entrar com Google
            </button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"/></div>
              <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-800 px-2 text-sm text-gray-400">ou via e-mail</span></div>
            </div>
            <form onSubmit={handleEmail}>
              <input className="input mb-3" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Enviando...' : 'Receber link de acesso'}
              </button>
            </form>
            <p className="text-xs text-gray-400 text-center mt-3">Sem senha — você recebe um link no e-mail para entrar.</p>
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
