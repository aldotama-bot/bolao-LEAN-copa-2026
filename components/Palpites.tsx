'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import PalpitesKnockout from './PalpitesKnockout'

const PHASES = ['Fase de Grupos', '16-avos', 'Oitavas', 'Quartas', 'Semifinais', '3º Lugar', 'Final']

function ptsBadge(pts: number) {
  const colors: Record<number, string> = {
    5: 'bg-green-100 text-green-800',
    3: 'bg-blue-100 text-blue-800',
    2: 'bg-amber-100 text-amber-800',
    0: 'bg-red-100 text-red-800',
  }
  return colors[pts] ?? 'bg-gray-100 text-gray-600'
}

export default function Palpites({ userId }: { userId: string }) {
  const [phase, setPhase] = useState('Fase de Grupos')
  const [matches, setMatches] = useState<any[]>([])
  const [preds, setPreds] = useState<Record<number, { h: string; a: string }>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const supabase = createClient()

  useEffect(() => { loadMatches() }, [phase])

  async function loadMatches() {
    const { data: ms } = await supabase
      .from('matches')
      .select('*, home:teams!matches_home_team_id_fkey(nome,bandeira), away:teams!matches_away_team_id_fkey(nome,bandeira)')
      .eq('fase', phase)
      .order('data_jogo')
    setMatches(ms || [])

    const ids = (ms || []).map((m: any) => m.id)
    if (ids.length) {
      const { data: ps } = await supabase
        .from('predictions')
        .select('match_id,home_score,away_score,pontos')
        .eq('user_id', userId)
        .in('match_id', ids)
      const map: Record<number, { h: string; a: string; pts?: number }> = {}
      ps?.forEach((p: any) => { map[p.match_id] = { h: String(p.home_score), a: String(p.away_score), pts: p.pontos } })
      setPreds(map)
    }
  }

  function isLocked(m: any) {
    if (m.encerrado) return true
    if (!m.data_jogo) return false
    const gameTime = new Date(`${m.data_jogo}T${m.hora_jogo || '23:59'}`)
    return new Date() > new Date(gameTime.getTime() - 30 * 60000)
  }

  async function savePred(matchId: number) {
    const p = preds[matchId]
    if (p?.h === '' || p?.a === '' || p?.h === undefined) { showToast('Preencha os dois placares!'); return }
    setSaving(matchId)
    const { error } = await supabase.from('predictions').upsert({
      user_id: userId, match_id: matchId,
      home_score: parseInt(p.h), away_score: parseInt(p.a)
    }, { onConflict: 'user_id,match_id' })
    if (error) showToast('Erro ao salvar: ' + error.message)
    else { showToast('Palpite salvo! 🎯'); loadMatches() }
    setSaving(null)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const byGroup: Record<string, any[]> = {}
  matches.forEach(m => {
    const k = m.grupo || phase
    if (!byGroup[k]) byGroup[k] = []
    byGroup[k].push(m)
  })

  return (
    <div>
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-copa-green text-white px-5 py-2 rounded-full text-sm z-50 shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto">
        {PHASES.map(p => (
          <button key={p} onClick={() => setPhase(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${phase === p ? 'bg-copa-green text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {p}
          </button>
        ))}
      </div>

      {phase === '16-avos' ? (
        <PalpitesKnockout userId={userId} />
      ) : (
        <>
      {!matches.length && (
        <div className="card text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">📅</div>
          <p>Nenhuma partida cadastrada nesta fase ainda.</p>
        </div>
      )}

      {Object.entries(byGroup).map(([grp, ms]) => (
        <div key={grp}>
          {grp !== phase && <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 mt-3">{grp}</p>}
          {ms.map(m => {
            const pred = preds[m.id] || { h: '', a: '' }
            const locked = isLocked(m)
            const pts = (pred as any).pts

            return (
              <div key={m.id} className="card mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">
                    {m.data_jogo ? new Date(m.data_jogo + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}
                    {m.hora_jogo ? ' · ' + m.hora_jogo.slice(0,5) : ''}
                    {m.grupo ? ' · ' + m.grupo : ''}
                  </span>
                  {m.encerrado && pts !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ptsBadge(pts)}`}>
                      {pts} {pts === 1 ? 'pt' : 'pts'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 items-center gap-2">
                  <div className="text-center">
                    <div className="text-2xl">{m.home?.bandeira || '🏳️'}</div>
                    <div className="text-sm font-medium mt-1">{m.home?.nome || m.home_label}</div>
                  </div>
                  <div className="text-center text-xs text-gray-400">vs</div>
                  <div className="text-center">
                    <div className="text-2xl">{m.away?.bandeira || '🏳️'}</div>
                    <div className="text-sm font-medium mt-1">{m.away?.nome || m.away_label}</div>
                  </div>
                </div>

                {locked ? (
                  <div className="mt-3">
                    {m.encerrado && (
                      <div className="flex justify-center items-center gap-2 mb-1">
                        <span className="text-xl font-medium">{m.home_score} × {m.away_score}</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">oficial</span>
                      </div>
                    )}
                    <p className="text-center text-xs text-gray-400">
                      {pred.h !== '' ? `Seu palpite: ${pred.h} × ${pred.a}` : 'Sem palpite registrado'}
                    </p>
                    {!m.encerrado && <p className="text-center text-xs text-amber-600 mt-1">🔒 Palpite encerrado (30 min antes do jogo)</p>}
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex items-center justify-center gap-3">
                      <input
                        type="number" min="0" max="20" placeholder="0" inputMode="numeric"
                        value={pred.h}
                        onFocus={e => e.target.select()}
                        onChange={e => setPreds(prev => ({ ...prev, [m.id]: { ...pred, h: e.target.value } }))}
                        className="w-14 h-10 text-center text-lg font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-copa-green"
                      />
                      <span className="text-xl text-gray-400">×</span>
                      <input
                        type="number" min="0" max="20" placeholder="0" inputMode="numeric"
                        value={pred.a}
                        onFocus={e => e.target.select()} 
                        onChange={e => setPreds(prev => ({ ...prev, [m.id]: { ...pred, a: e.target.value } }))}
                        className="w-14 h-10 text-center text-lg font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-copa-green"
                      />
                    </div>
                    <button
                      onClick={() => savePred(m.id)}
                      disabled={saving === m.id}
                      className="btn-primary w-full mt-3 text-sm"
                    >
                      {saving === m.id ? 'Salvando...' : 'Salvar palpite'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
      </>
      )}
    </div>
  )
}
