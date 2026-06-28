'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function PalpitesKnockout({ userId }: { userId: string }) {
  const [matches, setMatches] = useState<any[]>([])
  const [predictions, setPredictions] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadMatches()
  }, [])

  async function loadMatches() {
    setLoading(true)
    
    // Buscar jogos do mata-mata
    const { data: matchesData } = await supabase
      .from('knockout_matches')
      .select('*')
      .order('data_jogo')
    
    setMatches(matchesData || [])

    // Buscar palpites existentes do usuário
    if (matchesData && matchesData.length > 0) {
      const matchIds = matchesData.map((m: any) => m.id)
      const { data: predsData } = await supabase
        .from('knockout_predictions')
        .select('knockout_match_id, predicted_winner')
        .eq('user_id', userId)
        .in('knockout_match_id', matchIds)
      
      const predsMap: Record<number, string> = {}
      predsData?.forEach((p: any) => {
        predsMap[p.knockout_match_id] = p.predicted_winner
      })
      setPredictions(predsMap)
    }
    
    setLoading(false)
  }

  async function savePrediction(matchId: number, winner: string) {
    setPredictions(prev => ({ ...prev, [matchId]: winner }))

    const { error } = await supabase
      .from('knockout_predictions')
      .upsert({
        user_id: userId,
        knockout_match_id: matchId,
        predicted_winner: winner
      }, { onConflict: 'user_id,knockout_match_id' })
    
    if (error) console.error('Erro ao salvar palpite:', error)
  }

  function isClosedForPrediction(match: any) {
    const matchTime = new Date(`${match.data_jogo}T${match.hora_jogo}`)
    const now = new Date()
    const thirtyMinBefore = new Date(matchTime.getTime() - 30 * 60000)
    return now >= thirtyMinBefore
  }

  if (loading) return <div className="text-center py-8">Carregando...</div>

  const groupedMatches = matches.reduce((acc: Record<string, any[]>, match: any) => {
    if (!acc[match.fase]) acc[match.fase] = []
    acc[match.fase].push(match)
    return acc
  }, {})

  const faseOrder = ['16-avos', 'Oitavas', 'Quartas', 'Semifinais', '3º Lugar', 'Final']

  return (
    <div className="space-y-6">
      {faseOrder.map(fase => {
        const faseMatches = groupedMatches[fase]
        if (!faseMatches) return null

        return (
          <div key={fase}>
            <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-300">{fase}</h3>
            <div className="space-y-3">
              {faseMatches.map(match => {
                const closed = isClosedForPrediction(match)
                const selectedWinner = predictions[match.id]

                return (
                  <div key={match.id} className="card">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-gray-400">
                        {new Date(match.data_jogo + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {match.hora_jogo.substring(0, 5)}
                      </span>
                      {closed && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Fechado</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => !closed && savePrediction(match.id, match.time1)}
                        disabled={closed}
                        className={`p-3 rounded-lg border-2 transition-all font-medium text-sm ${
                          selectedWinner === match.time1
                            ? 'border-copa-green bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        } ${closed ? 'opacity-50 cursor-not-allowed' : 'hover:border-copa-green'}`}
                      >
                        {match.time1}
                        {match.encerrado && <div className="text-xs mt-1">✓ Avançou</div>}
                      </button>

                      <button
                        onClick={() => !closed && savePrediction(match.id, match.time2)}
                        disabled={closed}
                        className={`p-3 rounded-lg border-2 transition-all font-medium text-sm ${
                          selectedWinner === match.time2
                            ? 'border-copa-green bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        } ${closed ? 'opacity-50 cursor-not-allowed' : 'hover:border-copa-green'}`}
                      >
                        {match.time2}
                        {match.encerrado && <div className="text-xs mt-1">✓ Avançou</div>}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
