import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, Check, Pencil, X, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

// ── Edit name inline ──────────────────────────────────────

const EditName = ({ initial, onSaved }: { initial: string; onSaved: (n: string) => void }) => {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    setLoading(true); setErr('')
    try {
      const r = await axios.patch('/api/auth/profile', { name: value })
      onSaved(r.data.name ?? '')
      setEditing(false)
    } catch (e: any) { setErr(e.response?.data?.error || 'Ошибка') }
    finally { setLoading(false) }
  }

  const cancel = () => { setValue(initial); setEditing(false); setErr('') }

  if (!editing) return (
    <div className="flex items-center gap-2 group">
      <span className="text-sm">{initial || '—'}</span>
      <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
        <Pencil size={13} />
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-xs">
      {err && <p className="text-xs text-red-400">{err}</p>}
      <div className="flex gap-2">
        <Input value={value} onChange={e => setValue(e.target.value)} className="h-8 text-sm" autoFocus onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }} />
        <Button size="sm" onClick={save} disabled={loading} className="h-8 px-2"><Check size={14} /></Button>
        <Button size="sm" variant="ghost" onClick={cancel} className="h-8 px-2"><X size={14} /></Button>
      </div>
    </div>
  )
}

// ── Change password form ──────────────────────────────────

const ChangePassword = () => {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null); setLoading(true)
    try {
      await axios.post('/api/auth/change-password', { currentPassword: current, newPassword: next })
      setMsg({ type: 'ok', text: 'Пароль изменён' })
      setCurrent(''); setNext('')
      setTimeout(() => setOpen(false), 1500)
    } catch (e: any) { setMsg({ type: 'err', text: e.response?.data?.error || 'Ошибка' }) }
    finally { setLoading(false) }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
      <KeyRound size={14} />
      Сменить пароль
    </button>
  )

  return (
    <form onSubmit={submit} className="space-y-3 py-1">
      {msg && (
        <Alert variant={msg.type === 'ok' ? 'success' : 'destructive'}>
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cur-pw">Текущий пароль</Label>
          <Input id="cur-pw" type="password" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" required className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-pw">Новый пароль</Label>
          <Input id="new-pw" type="password" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" required className="h-9" placeholder="Мин. 8 символов" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>{loading ? 'Сохраняем...' : 'Сохранить'}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { setOpen(false); setMsg(null) }}>Отмена</Button>
      </div>
    </form>
  )
}

// ── Main ──────────────────────────────────────────────────

const Profile = () => {
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/auth/profile').then(r => setUser(r.data)).catch(() => navigate('/login'))
  }, [navigate])

  const logout = async () => { await axios.post('/api/auth/logout'); navigate('/login') }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Загрузка...</span>
    </div>
  )

  const initials = (user.name || user.email || '?').slice(0, 1).toUpperCase()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="h-14 sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6">
        <a href="/" className="font-display text-base tracking-tight hover:opacity-75 transition-opacity">Arlist ID</a>
        <div className="flex items-center gap-2">
          {user.role === 'ADMIN' && (
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin')}>
              <ShieldCheck size={14} />Управление
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut size={14} />Выйти
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-10 space-y-4 animate-fade-up">

        {/* Hero */}
        <div className="rounded-xl border border-border/60 bg-card p-6 flex items-center gap-5" style={{ borderTopColor: 'rgba(255,255,255,0.1)' }}>
          <div className={cn('w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl font-semibold shrink-0 text-white select-none', avatarGradient(initials))}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight truncate">{user.name || 'Без имени'}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant={user.role === 'ADMIN' ? 'purple' : 'muted'}>{user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}</Badge>
              <Badge variant={user.isVerified ? 'success' : 'muted'}>{user.isVerified ? '✓ Подтверждён' : 'Не подтверждён'}</Badge>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border/40">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Аккаунт</p>
          </div>
          <div className="divide-y divide-border/40">
            <Row label="Email" value={user.email} />
            <div className="flex items-center justify-between gap-4 px-5 py-3.5">
              <span className="text-sm text-muted-foreground shrink-0">Имя</span>
              <EditName initial={user.name || ''} onSaved={name => setUser({ ...user, name })} />
            </div>
            <Row label="ID" value={user.id} mono />
          </div>
        </div>

        {/* Security */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border/40">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Безопасность</p>
          </div>
          <div className="px-5 py-4">
            <ChangePassword />
          </div>
        </div>

        <div className="pt-1">
          <Separator className="mb-4" />
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← На главную</a>
        </div>
      </main>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-sm text-right truncate', mono && 'font-mono text-xs text-muted-foreground')}>{value}</span>
    </div>
  )
}

export default Profile
