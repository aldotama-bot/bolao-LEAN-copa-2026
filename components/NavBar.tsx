'use client'

export default function NavBar({ profile, onLogout }: { profile: any; onLogout: () => void }) {
  return (
    <div className="bg-copa-green text-white rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
      <span className="text-3xl">⚽</span>
      <div className="flex-1">
        <h1 className="font-medium text-base leading-tight">Bolão Copa 2026</h1>
        <p className="text-xs opacity-80">Olá, {profile?.apelido} 👋</p>
      </div>
      {profile?.is_admin && (
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Admin</span>
      )}
      <button onClick={onLogout} className="text-xs border border-white/50 px-3 py-1 rounded-full hover:bg-white/10 transition-colors">
        Sair
      </button>
    </div>
  )
}
