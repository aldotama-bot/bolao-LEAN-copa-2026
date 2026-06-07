'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const PHASES = ['Fase de Grupos', 'Oitavas', 'Quartas', 'Semifinais', '3º Lugar', 'Final']

function ptsBadge(pts: number) {
  const map: Record<number, string> = { 5: 'bg-green-100 text-green-800', 3: 'bg-blue-100 text-blue-800', 2: 'bg-amber-100 text-amber-800', 0: 'bg-red-100 text-red-800' }
  return map[pts] ?? 'bg-gray-100 text-gray-600'
}

export default function Resultados({ userId }: { userId: string }) {
  const [phase, setPhase] = useState('Fase de Grupos')
  const [matches, setMatches] = useState<any[]>([])
  const [allPreds, setAllPreds] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => { load() }, [phase])

  async function load() {
    const { data: ms } = await supabase
      .from('matches')
      .select('*, home:teams!matches_home_team_id_fkey(nome,bandeira), away:teams!matches_away_team_id_fkey(nome,bandeira)')
      .eq('fase', phase)
      .eq('encerrado', true)
      .order('data_jogo')
    setMatches(ms || [])

    const ids = (ms || []).map((m: any) => m.id)
    if (ids.length) {
      const { data: ps } = await supabase
        .from('predictions')
        .select('match_id,home_score,away_score,pontos,user_id,profile:profiles(apelido)')
        .in('match_id', ids)
      setAllPreds(ps || [])
    } else setAllPreds([])
  }

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        {PHASES.map(p => (
          <button key={p} onClick={() => setPhase(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${phase === p ? 'bg-copa-green text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {p}
          </button>
        ))}
      </div>

      {!matches.length && (
        <div className="card text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">⏳</div>
          <p>Nenhum resultado encerrado nesta fase ainda.</p>
        </div>
      )}

      {matches.map(m => {
        const mPreds = allPreds.filter(p => p.match_id === m.id)
        return (
          <div key={m.id} className="card mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">
                {m.data_jogo ? new Date(m.data_jogo + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}
                {m.grupo ? ' · ' + m.grupo : ''}
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Encerrado</span>
            </div>

            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="text-center flex-1">
                <div className="text-xl">{m.home?.bandeira || '🏳️'}</div>
                <div className="text-sm font-medium">{m.home?.nome || m.home_label}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-medium">{m.home_score} × {m.away_score}</div>
                <div className="text-xs text-gray-400">resultado oficial</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xl">{m.away?.bandeira || '🏳️'}</div>
                <div className="text-sm font-medium">{m.away?.nome || m.away_label}</div>
              </div>
            </div>

            {mPreds.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                <p className="text-xs text-gray-400 mb-1.5">Palpites da galera:</p>
                <div className="flex flex-wrap gap-2">
                  {mPreds.map(p => (
                    <div key={p.user_id} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border ${p.user_id === userId ? 'border-copa-green bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                      <span className="font-medium">{p.profile?.apelido}</span>
                      <span className="text-gray-400">{p.home_score}×{p.away_score}</span>
                      <span className={`px-1.5 py-0.5 rounded-full font-medium ${ptsBadge(p.pontos)}`}>{p.pontos}pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
