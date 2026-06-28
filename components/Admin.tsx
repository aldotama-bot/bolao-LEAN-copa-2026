'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

```typescript
import AdminKnockout from './AdminKnockout'
```

export default function Admin() {
  const [matches, setMatches] = useState<any[]>([])
  const [results, setResults] = useState<Record<number, { h: string; a: string }>>({})
  const [toast, setToast] = useState('')
  const [phase, setPhase] = useState('Fase de Grupos')
  const [users, setUsers] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => { loadMatches(); loadUsers() }, [phase])

  async function loadMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*, home:teams!matches_home_team_id_fkey(nome,bandeira), away:teams!matches_away_team_id_fkey(nome,bandeira)')
      .eq('fase', phase)
      .order('data_jogo')
    setMatches(data || [])
  }

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('apelido')
    setUsers(data || [])
  }

  async function saveResult(m: any) {
    const r = results[m.id]
    if (!r || r.h === '' || r.a === '') { showToast('Preencha o placar!'); return }
    const { error } = await supabase.from('matches').update({
      home_score: parseInt(r.h),
      away_score: parseInt(r.a),
      encerrado: true
    }).eq('id', m.id)
    if (error) showToast('Erro: ' + error.message)
    else { showToast('✅ Resultado salvo e pontos calculados!'); loadMatches() }
  }

  async function toggleAdmin(uid: string, current: boolean) {
    await supabase.from('profiles').update({ is_admin: !current }).eq('id', uid)
    loadUsers()
  }

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(''), 3000)
  }

  const PHASES = ['Fase de Grupos', 'Oitavas', 'Quartas', 'Semifinais', '3º Lugar', 'Final']

  return (
    <div>
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2 rounded-full text-sm z-50">
          {toast}
        </div>
      )}

      <div className="card mb-4 border-amber-300 dark:border-amber-700">
        <h2 className="font-medium mb-1">⚙️ Painel Administrativo</h2>
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">Insira os resultados oficiais aqui. Os pontos são calculados automaticamente.</p>

        <div className="flex gap-2 flex-wrap mb-4">
          {PHASES.map(p => (
            <button key={p} onClick={() => setPhase(p)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${phase === p ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              {p}
            </button>
          ))}
        </div>

        {matches.filter(m => !m.encerrado).map(m => (
          <div key={m.id} className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div className="flex-1 text-sm">
              <span>{m.home?.bandeira || ''} {m.home?.nome || m.home_label}</span>
              <span className="text-gray-400 mx-1">×</span>
              <span>{m.away?.nome || m.away_label} {m.away?.bandeira || ''}</span>
            </div>
            <input
              type="number" min="0" max="20" placeholder="C"
              value={results[m.id]?.h ?? ''}
              onChange={e => setResults(p => ({ ...p, [m.id]: { ...p[m.id], h: e.target.value } }))}
              className="w-12 h-9 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <span className="text-gray-400">×</span>
            <input
              type="number" min="0" max="20" placeholder="V"
              value={results[m.id]?.a ?? ''}
              onChange={e => setResults(p => ({ ...p, [m.id]: { ...p[m.id], a: e.target.value } }))}
              className="w-12 h-9 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={() => saveResult(m)}
              className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
            >
              Salvar
            </button>
          </div>
        ))}

        {matches.filter(m => m.encerrado).length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-2">Encerradas:</p>
            {matches.filter(m => m.encerrado).map(m => (
              <div key={m.id} className="flex items-center gap-2 text-sm py-1 text-gray-400">
                <span className="text-green-600">✓</span>
                <span className="flex-1">{m.home?.nome || m.home_label} {m.home_score}×{m.away_score} {m.away?.nome || m.away_label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-medium mb-3">👥 Usuários ({users.length})</h2>
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div className="w-8 h-8 rounded-full bg-copa-green text-white text-sm font-medium flex items-center justify-center">
              {u.apelido[0].toUpperCase()}
            </div>
            <span className="flex-1 text-sm font-medium">{u.apelido}</span>
            {u.is_admin && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">admin</span>}
            <button
              onClick={() => toggleAdmin(u.id, u.is_admin)}
              className="text-xs text-gray-400 hover:text-copa-green transition-colors"
            >
              {u.is_admin ? 'Remover admin' : 'Tornar admin'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
