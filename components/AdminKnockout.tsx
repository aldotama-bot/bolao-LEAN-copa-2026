'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function AdminKnockout() {
  const [matches, setMatches] = useState<any[]>([])
  const [results, setResults] = useState<Record<number, { winner: string }>>({})
  const [toast, setToast] = useState('')
  const [fase, setFase] = useState('16-avos')
  const supabase = createClient()

  useEffect(() => { loadMatches() }, [fase])

  async function loadMatches() {
    const { data } = await supabase
      .from('knockout_matches')
      .select('*')
      .eq('fase', fase)
      .order('data_jogo')
    setMatches(data || [])
    setResults({})
  }

  async function saveResult(m: any) {
    const winner = results[m.id]?.winner
    if (!winner || winner === '') { 
      showToast('Selecione o vencedor!'); 
      return 
    }

    const { error: updateError } = await supabase
      .from('knockout_matches')
      .update({
        encerrado: true,
        time1: m.time1 === winner ? m.time1 : m.time2,
        time2: m.time1 === winner ? m.time2 : m.time1
      })
      .eq('id', m.id)

    if (updateError) {
      showToast('Erro: ' + updateError.message)
      return
    }

    const { data: predictions } = await supabase
      .from('knockout_predictions')
      .select('user_id, predicted_winner')
      .eq('knockout_match_id', m.id)

    if (predictions) {
      for (const pred of predictions) {
        const points = pred.predicted_winner === winner ? 10 : 0
        await supabase
          .from('knockout_predictions')
          .update({ points })
          .eq('knockout_match_id', m.id)
          .eq('user_id', pred.user_id)
      }
    }

    await recalculateKnockoutRanking()
    
    showToast('✅ Resultado salvo e ranking atualizado!')
    loadMatches()
  }

  async function recalculateKnockoutRanking() {
    await supabase
      .from('knockout_ranking')
      .delete()
      .neq('user_id', '')

    const { data: users } = await supabase
      .from('profiles')
      .select('id, apelido')

    if (!users) return

    for (const user of users) {
      const { data: userPreds } = await supabase
        .from('knockout_predictions')
        .select('points')
        .eq('user_id', user.id)
        .eq('points', 10)

      const { data: allPreds } = await supabase
        .from('knockout_predictions')
        .select('id')
        .eq('user_id', user.id)

      const totalPts = userPreds?.reduce((sum, p) => sum + (p.points || 0), 0) || 0
      const correctPreds = userPreds?.length || 0
      const totalPreds = allPreds?.length || 0

      await supabase
        .from('knockout_ranking')
        .upsert({
          user_id: user.id,
          total_pts: totalPts,
          correct_predictions: correctPreds,
          total_predictions: totalPreds
        }, { onConflict: 'user_id' })
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const FASES = ['16-avos', 'Oitavas', 'Quartas', 'Semifinais', '3º Lugar', 'Final']
  const pendingMatches = matches.filter(m => !m.encerrado)
  const completedMatches = matches.filter(m => m.encerrado)

  return (
    <div>
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2 rounded-full text-sm z-50">
          {toast}
        </div>
      )}

      <div>
        <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto">
          {FASES.map(f => (
            <button 
              key={f} 
              onClick={() => setFase(f)}
              className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                fase === f 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {pendingMatches.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Pendentes:</h3>
            <div className="space-y-3 mb-4">
              {pendingMatches.map(m => (
                <div key={m.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1 text-sm font-medium">
                    <div>{m.time1} × {m.time2}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(m.data_jogo).toLocaleDateString('pt-BR')} · {m.hora_jogo?.substring(0, 5)}
                    </div>
                  </div>
                  
                  <select
                    value={results[m.id]?.winner || ''}
                    onChange={(e) => setResults(prev => ({
                      ...prev,
                      [m.id]: { winner: e.target.value }
                    }))}
                    className="text-xs px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Vencedor?</option>
                    <option value={m.time1}>{m.time1}</option>
                    <option value={m.time2}>{m.time2}</option>
                  </select>

                  <button
                    onClick={() => saveResult(m)}
                    className="px-3 py-1 text-xs bg-amber-500 text-white rounded font-medium hover:bg-amber-600 transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedMatches.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Encerrados:</h3>
            <div className="space-y-1">
              {completedMatches.map(m => (
                <div key={m.id} className="text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300">
                  ✓ {m.time1} × {m.time2}
                </div>
              ))}
            </div>
          </div>
        )}

        {matches.length === 0 && (
          <div className="text-center py-6 text-gray-400">
            <div className="text-3xl mb-2">⚽</div>
            <p className="text-sm">Nenhum jogo nesta fase.</p>
          </div>
        )}
      </div>
    </div>
  )
}
