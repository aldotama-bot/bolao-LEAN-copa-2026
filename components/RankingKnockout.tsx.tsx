'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function RankingKnockout({ userId }: { userId: string }) {
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadRanking()
  }, [])

  async function loadRanking() {
    setLoading(true)
    
    const { data } = await supabase
      .from('knockout_ranking')
      .select('*, profile:profiles(apelido)')
      .order('total_pts', { ascending: false })
    
    setRanking(data || [])
    setLoading(false)
  }

  if (loading) return <div className="text-center py-8">Carregando ranking...</div>

  if (ranking.length === 0) {
    return (
      <div className="card text-center py-8 text-gray-400">
        <p>Nenhum palpite registrado ainda no mata-mata.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {ranking.map((player, idx) => {
        const isCurrentUser = player.user_id === userId
        
        return (
          <div
            key={player.user_id}
            className={`card flex items-center justify-between p-3 ${
              isCurrentUser ? 'border-2 border-copa-green bg-green-50 dark:bg-green-900/20' : ''
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="text-lg font-bold text-gray-400 w-8 text-center">
                {idx + 1}º
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {player.profile?.apelido}
                  {isCurrentUser && <span className="text-xs ml-2 text-copa-green">👤 Você</span>}
                </div>
                <div className="text-xs text-gray-400">
                  {player.correct_predictions} acertos de {player.total_predictions}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-copa-green">{player.total_pts}</div>
              <div className="text-xs text-gray-400">pts</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
