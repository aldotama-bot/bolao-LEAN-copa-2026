'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Ranking({ currentUserId }: { currentUserId: string }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadRanking()
    return () => {} 
  }, [])

  async function loadRanking() {
    const { data } = await supabase
      .from('ranking')
      .select('*, profile:profiles(apelido)')
      .order('total_pts', { ascending: false })
      .order('exact_scores', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  const medal = (i: number) => ['🥇', '🥈', '🥉'][i] ?? ''
  const posColor = (i: number) => i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-400'
  const totalDone = rows.reduce((s, r) => Math.max(s, r.total_predictions), 0)

  if (loading) return <div className="text-center py-10 text-gray-400">Carregando ranking...</div>

  return (
    <div>
      <div className="card mb-4">
        <h2 className="font-medium mb-3">🏆 Ranking Geral</h2>
        {!rows.length && <p className="text-gray-400 text-sm">Ninguém pontuou ainda. Aguardando resultados!</p>}
        {rows.map((r, i) => {
          const isMe = r.user_id === currentUserId
          const pct = r.total_predictions ? Math.round((r.correct_winner / r.total_predictions) * 100) : 0
          return (
            <div key={r.user_id}
              className={`flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0 ${isMe ? 'bg-green-50 dark:bg-green-900/20 -mx-4 px-4 rounded-lg' : ''}`}>
              <span className={`font-medium w-7 text-center ${posColor(i)}`}>
                {medal(i) || (i + 1) + 'º'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{r.profile?.apelido}</span>
                  {isMe && <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">você</span>}
                </div>
                <div className="text-xs text-gray-400">{r.exact_scores} exatos · {pct}% aproveit.</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-copa-green">{r.total_pts} pts</div>
                <div className="text-xs text-gray-400">{r.total_predictions} palpites</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <h2 className="font-medium mb-3">🌟 Hall da Fama</h2>
        <div className="flex items-center gap-3 py-2">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-medium text-sm">2026 — Em disputa!</p>
            <p className="text-xs text-gray-400">Seja o primeiro campeão do bolão</p>
          </div>
        </div>
      </div>
    </div>
  )
}
