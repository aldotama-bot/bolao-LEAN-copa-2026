'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Especiais({ userId }: { userId: string }) {
  const [teams, setTeams] = useState<any[]>([])
  const [champion, setChampion] = useState('')
  const [runner, setRunner] = useState('')
  const [topScorer, setTopScorer] = useState('')
  const [allSpecials, setAllSpecials] = useState<any[]>([])
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: ts } = await supabase.from('teams').select('*').order('nome')
    setTeams(ts || [])
    const { data: my } = await supabase.from('special_predictions').select('*').eq('user_id', userId).single()
    if (my) {
      const champTeam = ts?.find((t: any) => t.id === my.champion_team_id)
      const runTeam = ts?.find((t: any) => t.id === my.runner_team_id)
      setChampion(String(my.champion_team_id || ''))
      setRunner(String(my.runner_team_id || ''))
      setTopScorer(my.top_scorer_name || '')
    }
    const { data: all } = await supabase.from('special_predictions')
      .select('*, profile:profiles(apelido), champion:teams!special_predictions_champion_team_id_fkey(nome,bandeira), runner:teams!special_predictions_runner_team_id_fkey(nome,bandeira)')
    setAllSpecials(all || [])
  }

  async function save() {
    await supabase.from('special_predictions').upsert({
      user_id: userId,
      champion_team_id: champion ? parseInt(champion) : null,
      runner_team_id: runner ? parseInt(runner) : null,
      top_scorer_name: topScorer || null,
    }, { onConflict: 'user_id' })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    load()
  }

  return (
    <div>
      <div className="card mb-4">
        <h2 className="font-medium mb-1">⭐ Palpites Especiais</h2>
        <p className="text-xs text-gray-400 mb-4">Valem pontos bônus! Podem ser alterados até o início da Copa.</p>

        <div className="mb-4">
          <label className="text-sm font-medium block mb-1">🥇 Campeão — 20 pontos</label>
          <select className="input" value={champion} onChange={e => setChampion(e.target.value)}>
            <option value="">Escolha o campeão...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.bandeira} {t.nome}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium block mb-1">🥈 Vice-campeão — 10 pontos</label>
          <select className="input" value={runner} onChange={e => setRunner(e.target.value)}>
            <option value="">Escolha o vice...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.bandeira} {t.nome}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium block mb-1">⚽ Artilheiro — 10 pontos</label>
          <input className="input" placeholder="Nome do artilheiro..." value={topScorer} onChange={e => setTopScorer(e.target.value)} />
        </div>

        <button onClick={save} className="btn-primary w-full">
          {saved ? '✅ Salvo!' : 'Salvar palpites especiais'}
        </button>
      </div>

      <div className="card">
        <h2 className="font-medium mb-3">Palpites da galera</h2>
        {!allSpecials.length && <p className="text-sm text-gray-400">Ninguém enviou ainda.</p>}
        {allSpecials.map(s => (
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
