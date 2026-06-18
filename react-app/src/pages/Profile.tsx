import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const PALETTES = [
  'from-indigo-950 to-indigo-700',
  'from-emerald-950 to-emerald-700',
  'from-rose-950 to-rose-700',
  'from-sky-950 to-sky-700',
  'from-violet-950 to-violet-700',
]

function avatarGradient(seed: string) {
  return PALETTES[(seed.charCodeAt(0) || 0) % PALETTES.length]
}

const Profile = () => {
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/auth/profile')
      .then(r => setUser(r.data))
      .catch(() => navigate('/login'))
  }, [navigate])

  const logout = async () => {
    await axios.post('/api/auth/logout')
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Загрузка...</span>
      </div>
    )
  }

  const initials = (user.name || user.email || '?').slice(0, 1).toUpperCase()
  const grad = avatarGradient(initials)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="h-14 sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6">
        <a href="/" className="font-display text-base text-foreground tracking-tight hover:opacity-75 transition-opacity">
          Arlist ID
        </a>
        <div className="flex items-center gap-2">
          {user.role === 'ADMIN' && (
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin')}>
              <ShieldCheck size={14} />
              Управление
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut size={14} />
            Выйти
          </Button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-10 space-y-4 animate-fade-up">

        {/* Hero */}
        <div className="rounded-xl border border-border/60 bg-card p-6 flex items-center gap-5"
             style={{ borderTopColor: 'rgba(255,255,255,0.1)' }}>
          <div className={cn(
            'w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl font-semibold shrink-0 text-white select-none',
            grad
          )}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight truncate">{user.name || 'Без имени'}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant={user.role === 'ADMIN' ? 'purple' : 'muted'}>
                {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
              </Badge>
              <Badge variant={user.isVerified ? 'success' : 'muted'}>
                {user.isVerified ? '✓ Подтверждён' : 'Не подтверждён'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border/40">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Аккаунт</p>
          </div>

          <div className="divide-y divide-border/40">
            <Row label="Email" value={user.email} />
            {user.name && <Row label="Имя" value={user.name} />}
            <Row label="ID" value={user.id} mono />
          </div>
        </div>

        {/* Back to site */}
        <div className="pt-1">
          <Separator className="mb-4" />
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← На главную
          </a>
        </div>
      </main>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-sm text-right truncate', mono && 'font-mono text-xs text-muted-foreground')}>
        {value}
      </span>
    </div>
  )
}

export default Profile
