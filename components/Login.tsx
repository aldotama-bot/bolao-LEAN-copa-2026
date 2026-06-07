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
    const { data, error } = await sup
