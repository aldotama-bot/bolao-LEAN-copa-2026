'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const DEADLINE_ESPECIALES = new Date('2026-06-19T23:59:59')

export default function Especiais({ userId }: { userId: string }) {
  const [teams, setTeams] = useState<any[]>([])
  const [campeon, setCampeon] = useState('')
  const [subcampeon, setSubcampeon] = useState('')
  const [goleador, setGoleador] = useState('')
  const [todosEsp, setTodosEsp] = useState<any[]>([])
  const [guardado, setGuardado] = useState(false)
  const [cerrado, setCerrado] = useState(false)
  const supabase = createClient()

  function estaCerrado() {
    return new Date() > DEADLINE_ESPECIALES
  }

  useEffect(() => { 
    setCerrado(estaCerrado())
    cargar() 
  }, [])

  async function cargar() {
    const { data: ts } = await supabase.from('teams').select('*').order('nome')
    setTeams(ts || [])
    const { data: my } = await supabase.from('special_predictions').select('*').eq('user_id', userId).single()
    if (my) {
      setCampeon(String(my.champion_team_id || ''))
      setSubcampeon(String(my.runner_team_id || ''))
      setGoleador(my.top_scorer_name || '')
    }
    const { data: all } = await supabase.from('special_predictions')
      .select('*, profile:profiles(apelido), champion:teams!special_predictions_champion_team_id_fkey(nome,bandeira), runner:teams!special_predictions_runner_team_id_fkey(nome,bandeira)')
    setTodosEsp(all || [])
  }

  async function guardar() {
    if (estaCerrado()) {
      alert('Os palpites especiais fecharam em 19/06 às 23:59')
      return
    }
    await supabase.from('special_predictions').upsert({
      user_id: userId,
      champion_team_id: campeon ? parseInt(campeon) : null,
      runner_team_id: subcampeon ? parseInt(subcampeon) : null,
      top_scorer_name: goleador || null,
    }, { onConflict: 'user_id' })
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
    cargar()
  }

  return (
    <div>
      <div className="card mb-4">
        <h2 className="font-medium mb-1">⭐ Palpites Especiais</h2>
        {!cerrado ? (
          <p className="text-xs text-gray-400 mb-4">Valem pontos extras! Podem ser alterados até 19/06 às 23:59.</p>
        ) : (
          <p className="text-xs text-amber-600 font-medium mb-4">🔒 Os palpites especiais fecharam em 19/06 às 23:59</p>
        )}

        <div className="mb-4">
          <label className="text-sm font-medium block mb-1">🥇 Campeão — 20 pontos</label>
          <select className="input" value={campeon} onChange={e => setCampeon(e.target.value)} disabled={cerrado}>
            <option value="">Escolha o campeão...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.bandeira} {t.nome}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium block mb-1">🥈 Vice-campeão — 10 pontos</label>
          <select className="input" value={subcampeon} onChange={e => setSubcampeon(e.target.value)} disabled={cerrado}>
            <option value="">Escolha o vice...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.bandeira} {t.nome}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium block mb-1">⚽ Artilheiro — 10 pontos</label>
          <input className="input" placeholder="Nome do artilheiro..." value={goleador} onChange={e => setGoleador(e.target.value)} disabled={cerrado} />
        </div>

        <button onClick={guardar} disabled={cerrado} className="btn-primary w-full">
          {guardado ? '✅ Salvo!' : cerrado ? '🔒 Fechado' : 'Salvar palpites especiais'}
        </button>
      </div>

      <div className="card">
        <h2 className="font-medium mb-3">Palpites do grupo</h2>
        {!todosEsp.length && <p className="text-sm text-gray-400">Ninguém enviou ainda.</p>}
        {todosEsp.map(s => (
          <div key={s.user_id} className={`flex flex-wrap items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 text-sm ${s.user_id === userId ? 'font-medium' : ''}`}>
            <span className="min-w-[80px] text-gray-700 dark:text-gray-300">{s.profile?.apelido}{s.user_id === userId ? ' (você)' : ''}</span>
            {s.champion && <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full">🥇 {s.champion?.bandeira} {s.champion?.nome}</span>}
            {s.runner && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">🥈 {s.runner?.bandeira} {s.runner?.nome}</span>}
            {s.top_scorer_name && <span className="text-xs bg-green-50 text-green-800 px-2 py-0.5 rounded-full">⚽ {s.top_scorer_name}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
