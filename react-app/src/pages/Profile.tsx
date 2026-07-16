import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, Check, Pencil, X, KeyRound, User, Home, Lock, ChevronRight, Wallet, CreditCard, Smartphone, Bitcoin, Terminal, BarChart3, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

const GRADIENTS = [
  'from-violet-600 via-purple-500 to-pink-500',
  'from-blue-600 via-cyan-500 to-teal-400',
  'from-emerald-500 via-green-400 to-lime-400',
  'from-orange-500 via-rose-500 to-pink-600',
  'from-sky-500 via-blue-500 to-indigo-600',
]
function avatarGradient(seed: string) {
  return GRADIENTS[(seed.charCodeAt(0) || 0) % GRADIENTS.length]
}

function greeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Доброе утро'
  if (h >= 12 && h < 17) return 'Добрый день'
  if (h >= 17 && h < 22) return 'Добрый вечер'
  return 'Доброй ночи'
}

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
        <Input value={value} onChange={e => setValue(e.target.value)} className="h-8 text-sm" autoFocus
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }} />
        <Button size="sm" onClick={save} disabled={loading} className="h-8 px-2"><Check size={14} /></Button>
        <Button size="sm" variant="ghost" onClick={cancel} className="h-8 px-2"><X size={14} /></Button>
      </div>
    </div>
  )
}

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
      setTimeout(() => { setOpen(false); setMsg(null) }, 1500)
    } catch (e: any) { setMsg({ type: 'err', text: e.response?.data?.error || 'Ошибка' }) }
    finally { setLoading(false) }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
      <KeyRound size={14} /> Сменить пароль
    </button>
  )

  return (
    <form onSubmit={submit} className="space-y-3">
      {msg && <Alert variant={msg.type === 'ok' ? 'success' : 'destructive'}><AlertDescription>{msg.text}</AlertDescription></Alert>}
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

type Section = 'profile' | 'security' | 'usage' | 'billing'

const Sidebar = ({ user, active, setActive, onLogout, onAdmin }:
  { user: any; active: Section; setActive: (s: Section) => void; onLogout: () => void; onAdmin: () => void }) => {

  const nav = [
    { id: 'profile' as Section, icon: User, label: 'Профиль' },
    { id: 'security' as Section, icon: Lock, label: 'Безопасность' },
    { id: 'usage' as Section, icon: BarChart3, label: 'Использование' },
    ...(user.role === 'ADMIN' ? [{ id: 'billing' as Section, icon: Wallet, label: 'Тарификация' }] : []),
  ]

  return (
    <aside className="w-60 shrink-0 border-r border-border/60 flex flex-col bg-card/40">
      <div className="h-14 flex items-center px-5 border-b border-border/60">
        <a href="/" className="font-display text-base tracking-tight hover:opacity-75 transition-opacity">Arlist ID</a>
      </div>

      <div className="px-5 py-5 border-b border-border/40">
        <p className="text-sm font-medium truncate">{user.name || 'Без имени'}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          <Badge variant={user.role === 'ADMIN' ? 'purple' : 'muted'} className="text-[10px] px-1.5 py-0">
            {user.role === 'ADMIN' ? 'Админ' : 'Юзер'}
          </Badge>
          <Badge variant={user.isVerified ? 'success' : 'muted'} className="text-[10px] px-1.5 py-0">
            {user.isVerified ? '✓ Верифицирован' : 'Не верифицирован'}
          </Badge>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActive(id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              active === id
                ? 'bg-accent text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}>
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border/40 space-y-0.5">
        {user.role === 'ADMIN' && (
          <button onClick={onAdmin}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
            <ShieldCheck size={16} /> Управление
          </button>
        )}
        <a href="/"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
          <Home size={16} /> На главную
        </a>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={16} /> Выйти
        </button>
      </div>
    </aside>
  )
}

const UsageGauge = ({ percent, label }: { percent: number; label: string }) => {
  const pct = Math.min(100, Math.max(0, percent))
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-violet-500'
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 bg-accent rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const UsageSection = () => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/cli/auth/usage').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="px-10 pt-14 pb-10">
      <p className="text-sm text-muted-foreground">Загрузка...</p>
    </div>
  )

  if (!stats) return (
    <div className="px-10 pt-14 pb-10">
      <p className="text-sm text-muted-foreground">Не удалось загрузить статистику</p>
    </div>
  )

  return (
    <div className="px-10 pt-14 pb-10">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Использование</h1>
      <p className="text-muted-foreground text-sm mb-8">Использование и лимиты тарифа</p>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-border/50 bg-card/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Тариф: {stats.tariff.name}</p>
            <Badge variant="purple" className="text-[10px] px-2 py-0">{stats.tariff.type}</Badge>
          </div>
          <div className="space-y-4">
            <UsageGauge percent={stats.usagePercent.per5h} label="За 5 часов" />
            <UsageGauge percent={stats.usagePercent.week} label="За неделю" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/50 bg-card/60 p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Всего токенов (вход)</p>
            <p className="text-2xl font-bold tracking-tight">{stats.tokens.prompt.toLocaleString('ru-RU')}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/60 p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Всего токенов (выход)</p>
            <p className="text-2xl font-bold tracking-tight">{stats.tokens.output.toLocaleString('ru-RU')}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/60 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Кошелёк (оверран)</p>
            <p className="text-2xl font-bold tracking-tight">{((stats.wallet.balanceKopecks ?? 0) / 100).toFixed(2)} ₽</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.wallet.overrunEnabled
                ? 'Включён — сверх лимита доплата списывается с баланса автоматически'
                : 'Выключен на этом тарифе — по исчерпании лимита запросы блокируются'}
            </p>
          </div>
          <Wallet size={32} className="text-muted-foreground/40" />
        </div>

        {stats.usagePercent.per5h >= 100 && !stats.wallet.overrunEnabled && (
          <Alert variant="destructive">
            <AlertTriangle size={16} />
            <AlertDescription>
              Лимит на 5 часов исчерпан. Попробуйте позже.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

const Profile = () => {
  const [user, setUser] = useState<any>(null)
  const [active, setActive] = useState<Section>('profile')
  const navigate = useNavigate()

  const [billingMethod, setBillingMethod] = useState<'card' | 'sbp' | null>('card')
  const [billingAmount, setBillingAmount] = useState<string>('500')
  const [billingMessage, setBillingMessage] = useState<string | null>(null)

  useEffect(() => {
    axios.get('/api/auth/profile').then(r => setUser(r.data)).catch(() => navigate('/login'))
  }, [navigate])

  const logout = async () => { await axios.post('/api/auth/logout'); navigate('/login') }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Загрузка...</span>
    </div>
  )

  const grad = avatarGradient((user.name || user.email || '?').slice(0, 1).toUpperCase())

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar user={user} active={active} setActive={setActive} onLogout={logout} onAdmin={() => navigate('/admin')} />

      <main className="flex-1 overflow-y-auto">
        {active === 'profile' && (
          <div className="min-h-full flex flex-col">
            <div className="relative overflow-hidden px-10 pt-14 pb-16 border-b border-border/60" style={{ background: 'linear-gradient(to bottom, hsl(var(--background)), hsl(var(--background)) 70%, transparent)' }}>
              <div className={cn('absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br opacity-10 blur-3xl pointer-events-none', grad)} />
              <div className={cn('absolute -bottom-10 right-10 w-64 h-64 rounded-full bg-gradient-to-br opacity-5 blur-3xl pointer-events-none', grad)} />

              <p className="text-muted-foreground text-base mb-1">{greeting()},</p>
              <h1 className={cn('text-5xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent', grad)}>
                {user.name || user.email.split('@')[0]}
              </h1>
              <p className="text-muted-foreground mt-3 text-sm">
                Вы вошли как <span className="text-foreground">{user.email}</span>
              </p>
            </div>

            <div className="px-10 pt-8 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoCard label="Email" value={user.email} />
              <InfoCard label="Имя">
                <EditName initial={user.name || ''} onSaved={name => setUser({ ...user, name })} />
              </InfoCard>
              <InfoCard label="ID" value={user.id} mono />
            </div>

            <div className="px-10 pb-10">
              <div className="rounded-xl border border-border/50 bg-card/60 divide-y divide-border/40">
                <Row label="Роль" value={user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'} />
                <Row label="Статус" value={user.isVerified ? 'Подтверждён' : 'Не подтверждён'} />
                <Row label="Зарегистрирован" value={new Date(user.createdAt || Date.now()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />
              </div>
            </div>
          </div>
        )}

        {active === 'security' && (
          <div className="px-10 pt-14 pb-10">
            <h1 className="text-2xl font-semibold tracking-tight mb-1">Безопасность</h1>
            <p className="text-muted-foreground text-sm mb-8">Управление паролем и доступом</p>
            <div className="max-w-lg">
              <div className="rounded-xl border border-border/50 bg-card/60 p-5">
                <p className="text-sm font-medium mb-4">Смена пароля</p>
                <ChangePassword />
              </div>
            </div>
          </div>
        )}

        {active === 'usage' && <UsageSection />}

        {active === 'billing' && (
          <div className="px-10 pt-14 pb-10">
            <h1 className="text-2xl font-semibold tracking-tight mb-1">Тарификация</h1>
            <p className="text-muted-foreground text-sm mb-8">Баланс и способы пополнения</p>

            <div className="max-w-2xl space-y-6">
              <div className="rounded-xl border border-border/50 bg-card/60 p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Баланс</p>
                  <p className="text-3xl font-bold tracking-tight">
                    {((user.balanceKopecks ?? 0) / 100).toFixed(2)} ₽
                  </p>
                </div>
                <Wallet size={32} className="text-muted-foreground/40" />
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Способ пополнения</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'card' as const, icon: CreditCard, label: 'Банковская карта' },
                    { id: 'sbp' as const, icon: Smartphone, label: 'СБП' },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setBillingMethod(id); setBillingMessage(null); }}
                      className={cn(
                        'relative rounded-xl border p-5 flex flex-col items-center gap-2 transition-all text-left w-full hover:bg-accent/40',
                        billingMethod === id
                          ? 'border-violet-500 bg-violet-500/10 text-foreground shadow-sm shadow-violet-500/15'
                          : 'border-border/50 bg-card/40 text-muted-foreground'
                      )}
                    >
                      <Icon size={22} className={billingMethod === id ? 'text-violet-400' : 'text-muted-foreground'} />
                      <p className="text-sm font-medium text-center">{label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const amt = parseFloat(billingAmount);
                if (isNaN(amt) || amt <= 0) { setBillingMessage('Укажите корректную сумму'); return }
                setBillingMessage(`Переход к оплате на сумму ${amt.toFixed(2)} ₽`);
              }} className="space-y-4 border border-border/40 bg-card/40 p-5 rounded-xl">
                <div className="space-y-2">
                  <Label htmlFor="topup-amount" className="text-sm font-medium text-muted-foreground">Сумма пополнения (₽)</Label>
                  <div className="flex gap-2 flex-wrap">
                    {['100', '500', '1000', '5000'].map((val) => (
                      <Button key={val} type="button" variant={billingAmount === val ? 'default' : 'outline'}
                        onClick={() => { setBillingAmount(val); setBillingMessage(null) }}
                        className={cn('h-9 px-4 text-sm font-medium', billingAmount === val ? 'bg-violet-600 hover:bg-violet-700 text-white' : '')}>
                        {val} ₽
                      </Button>
                    ))}
                  </div>
                  <Input id="topup-amount" type="number" value={billingAmount}
                    onChange={(e) => { setBillingAmount(e.target.value); setBillingMessage(null) }}
                    className="max-w-xs mt-2 pr-8 text-base font-semibold" placeholder="Другая сумма" min="1" required />
                </div>
                <Button type="submit" className="w-full sm:w-auto px-6 bg-violet-600 hover:bg-violet-700 text-white">
                  Пополнить баланс
                </Button>
              </form>

              {billingMessage && (
                <div className="p-5 rounded-xl border border-violet-500/20 bg-violet-950/10 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                    <Wallet size={14} className="text-white" />
                  </div>
                  <p className="text-sm text-foreground/90">{billingMessage}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function InfoCard({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 px-5 py-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      {children ?? (
        <p className={cn('text-sm font-medium truncate', mono && 'font-mono text-xs text-muted-foreground')}>{value}</p>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}

export default Profile
