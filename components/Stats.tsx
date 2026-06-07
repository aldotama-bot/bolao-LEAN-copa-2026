'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const PHASES = ['Grupos', 'Oitavas', 'Quartas', 'Semis', '3º', 'Final']
const PHASE_FULL = ['Fase de Grupos', 'Oitavas', 'Quartas', 'Semifinais', '3º Lugar', 'Final']

export default function Stats({ userId, apelido }: { userId: string; apelido: string }) {
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: r } = await supabase.from('ranking').select('*').eq('user_id', userId).single()
    const { data: allRanking } = await supabase.from('ranking').select('user_id').order('total_pts', { ascending: false })
    const pos = (allRanking || []).findIndex((x: any) => x.user_id === userId) + 1
    setStats({ ...r, pos })

    const phaseData = await Promise.all(PHASE_FULL.map(async (ph, i) => {
      const { data: ms } = await supabase.from('matches')
        .select('id').eq('fase', ph).eq('encerrado', true)
      const ids = (ms || []).map((m: any) => m.id)
      if (!ids.length) return { name: PHASES[i], pts: 0 }
      const { data: ps } = await supabase.from('predictions')
        .select('pontos').eq('user_id', userId).in('match_id', ids)
      const pts = (ps || []).reduce((s: number, p: any) => s + (p.pontos || 0), 0)
      return { name: PHASES[i], pts }
    }))
    setChartData(phaseData)

    const { data: done } = await supabase
      .from('matches')
      .select('*, home:teams!matches_home_team_id_fkey(nome,bandeira), away:teams!matches_away_team_id_fkey(nome,bandeira)')
      .eq('encerrado', true)
      .order('data_jogo', { ascending: false })
      .limit(10)
    const ids = (done || []).map((m: any) => m.id)
    const { data: myPreds } = await supabase.from('predictions')
      .select('*').eq('user_id', userId).in('match_id', ids)
    const predMap: Record<number, any> = {}
    myPreds?.forEach((p: any) => { predMap[p.match_id] = p })
    setHistory((done || []).map((m: any) => ({ ...m, pred: predMap[m.id] }))) 
  }

  function ptsBg(pts: number) {
    return pts === 5 ? '#1a9e3f' : pts === 3 ? '#3b82f6' : pts === 2 ? '#f59e0b' : '#ef4444'
  }

  if (!stats) return <div className="text-center py-10 text-gray-400">Carregando estatísticas...</div>

  return (
    <div>
      <div className="card mb-4">
        <h2 className="font-medium mb-3">📈 Meu desempenho — {apelido}</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Pontuação total', val: stats.total_pts ?? 0, unit: 'pts' },
            { label: 'Posição', val: stats.pos ? stats.pos + 'º' : '—', unit: '' },
            { label: 'Placares exatos', val: stats.exact_scores ?? 0, unit: '' },
            { label: 'Aproveitamento', val: stats.total_predictions ? Math.round((stats.correct_winner / stats.total_predictions) * 100) + '%' : '0%', unit: '' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-2xl font-medium">{s.val}<span className="text-sm text-gray-400 ml-1">{s.unit}</span></p>
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-4">
        <h2 className="font-medium mb-3">Pontos por fase</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => [v + ' pts', 'Pontos']} />
            <Bar dataKey="pts" radius={[4,4,0,0]}>
              {chartData.map((_, i) => <Cell key={i} fill="#1a9e3f" />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="font-medium mb-3">🎯 Últimas partidas</h2>
        {!history.length && <p className="text-sm text-gray-400">Nenhuma partida encerrada ainda.</p>}
        {history.map(m => (
          <div key={m.id} className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 text-sm">
            <span>{m.home?.bandeira}{m.away?.bandeira}</span>
            <span className="flex-1 text-gray-600 dark:text-gray-400 truncate">{m.home?.nome} {m.home_score}×{m.away_score} {m.away?.nome}</span>
            <span className="text-xs text-gray-400">{m.pred ? `${m.pred.home_score}×${m.pred.away_score}` : '—'}</span>
            {m.pred && (
              <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium" style={{ background: ptsBg(m.pred.pontos) }}>
                {m.pred.pontos}pts
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

