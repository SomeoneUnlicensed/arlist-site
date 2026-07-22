import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, ArrowLeft, Loader2, ShieldCheck, Users, Activity, Ban, AppWindow, Trash2, Search, Coins, Pencil, Plus, RefreshCw, Mail, Globe, Settings, AlertTriangle, Eye, FileText, Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { StatusAdminTab } from '@/components/StatusAdminTab'

// ── Copy button ───────────────────────────────────────────

const CopyBtn = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  )
}

// ── Stats bar ─────────────────────────────────────────────

const StatsBar = () => {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    axios.get('/api/admin/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  if (!stats) return null

  const tiles = [
    { icon: Users, label: 'Всего пользователей', value: stats.totalUsers, color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/10' },
    { icon: Activity, label: 'Верифицировано', value: stats.verifiedUsers, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' },
    { icon: Ban, label: 'Заблокировано', value: stats.bannedUsers, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/10' },
    { icon: AppWindow, label: 'OIDC-клиенты', value: stats.totalClients, color: 'text-lime-700', bg: 'bg-lime-700/5 border-lime-700/10' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      {tiles.map(({ icon: Icon, label, value, color, bg }) => (
        <div key={label} className={cn("min-w-0 rounded-2xl border bg-card/40 p-4 flex flex-col items-start gap-3 transition-all duration-300 hover:bg-card/75 sm:p-5 lg:flex-row lg:items-center lg:gap-4 lg:hover:scale-[1.02]", bg)}>
          <div className={cn("shrink-0 p-3 rounded-xl bg-background/85 border border-border/40", color)}>
            <Icon size={20} className="shrink-0" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="break-words text-xs font-semibold text-muted-foreground mt-0.5 leading-tight">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Users tab ─────────────────────────────────────────────

const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BANNED' | 'UNVERIFIED'>('ALL')

  // Balance editing state
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null)
  const [editBalanceVal, setEditBalanceVal] = useState<string>('')
  const [balanceSaving, setBalanceSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/api/admin/users')
      setUsers(r.data)
    } catch {
      setErr('Не удалось загрузить пользователей')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const ban = async (id: string, isBanned: boolean) => {
    try {
      setErr('')
      await axios.patch(`/api/admin/users/${id}`, { isBanned })
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isBanned } : u))
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Ошибка изменения статуса бана')
    }
  }

  const promote = async (id: string, role: string) => {
    try {
      setErr('')
      await axios.patch(`/api/admin/users/${id}`, { role })
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Ошибка смены роли')
    }
  }

  const toggleVerify = async (id: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/admin/users/${id}`, { isVerified: !currentStatus })
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isVerified: !currentStatus } : u))
    } catch {
      setErr('Ошибка верификации')
    }
  }

  const saveBalance = async (id: string) => {
    const amt = parseFloat(editBalanceVal)
    if (isNaN(amt) || amt < 0) {
      setErr('Сумма баланса должна быть положительным числом')
      return
    }
    setBalanceSaving(true)
    try {
      const balanceKopecks = Math.round(amt * 100)
      await axios.patch(`/api/admin/users/${id}`, { balanceKopecks })
      setUsers(prev => prev.map(u => u.id === id ? { ...u, balanceKopecks } : u))
      setEditingBalanceId(null)
    } catch {
      setErr('Не удалось сохранить баланс')
    } finally {
      setBalanceSaving(false)
    }
  }

  const remove = async (id: string, email: string) => {
    if (!confirm(`Вы действительно хотите безвозвратно удалить пользователя ${email}?`)) return
    try {
      await axios.delete(`/api/admin/users/${id}`)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch {
      setErr('Ошибка удаления пользователя')
    }
  }

  // Filtering logic
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'ALL' ? true : u.role === roleFilter;

    const matchesStatus =
      statusFilter === 'ALL' ? true :
      statusFilter === 'BANNED' ? u.isBanned :
      statusFilter === 'ACTIVE' ? (u.isVerified && !u.isBanned) :
      statusFilter === 'UNVERIFIED' ? (!u.isVerified && !u.isBanned) : true;

    return matchesSearch && matchesRole && matchesStatus;
  })

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground gap-2 text-sm">
      <Loader2 size={18} className="animate-spin text-lime-700" /> Загрузка списка пользователей...
    </div>
  )

  return (
    <div className="space-y-0">
      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-border/40 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card/10">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, email или ID..."
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Role filter buttons */}
          <div className="flex items-center rounded-lg border border-border/50 bg-muted/20 p-0.5 text-[11px]">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={cn("px-2.5 py-1 rounded-md font-medium transition-all", roleFilter === 'ALL' ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground")}
            >
              Все роли
            </button>
            <button
              onClick={() => setRoleFilter('USER')}
              className={cn("px-2.5 py-1 rounded-md font-medium transition-all", roleFilter === 'USER' ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground")}
            >
              Юзеры
            </button>
            <button
              onClick={() => setRoleFilter('ADMIN')}
              className={cn("px-2.5 py-1 rounded-md font-medium transition-all", roleFilter === 'ADMIN' ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground")}
            >
              Админы
            </button>
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center rounded-lg border border-border/50 bg-muted/20 p-0.5 text-[11px]">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={cn("px-2.5 py-1 rounded-md font-medium transition-all", statusFilter === 'ALL' ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground")}
            >
              Все статусы
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={cn("px-2.5 py-1 rounded-md font-medium transition-all", statusFilter === 'ACTIVE' ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground")}
            >
              Актив
            </button>
            <button
              onClick={() => setStatusFilter('UNVERIFIED')}
              className={cn("px-2.5 py-1 rounded-md font-medium transition-all", statusFilter === 'UNVERIFIED' ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground")}
            >
              Неподтвержд.
            </button>
            <button
              onClick={() => setStatusFilter('BANNED')}
              className={cn("px-2.5 py-1 rounded-md font-medium transition-all", statusFilter === 'BANNED' ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground")}
            >
              Бан
            </button>
          </div>

          <Button variant="ghost" size="icon" onClick={load} className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {err && <div className="px-5 pt-4"><Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert></div>}

      {filteredUsers.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm bg-card/10">
          Пользователи по заданным критериям поиска не найдены
        </div>
      ) : (
        <div className="scrollbar-none overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40 bg-muted/10">
                {['Пользователь', 'Роль', 'Баланс', 'Статус', 'Дата регистрации', 'Действия'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-accent/30 transition-colors">
                  {/* User info */}
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground text-sm">{u.name || '—'}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{u.email}</span>
                      <span className="text-[9px] text-muted-foreground/50 font-mono">ID: {u.id}</span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-3.5 align-middle">
                    <Badge variant={u.role === 'ADMIN' ? 'purple' : 'muted'} className="px-2 py-0.5 text-[10px] font-semibold">
                      {u.role === 'ADMIN' ? 'Админ' : 'Юзер'}
                    </Badge>
                  </td>

                  {/* Balance */}
                  <td className="px-5 py-3.5 align-middle">
                    {editingBalanceId === u.id ? (
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <div className="relative">
                          <Input
                            type="number"
                            value={editBalanceVal}
                            onChange={e => setEditBalanceVal(e.target.value)}
                            className="h-8 w-24 pr-5 font-semibold text-xs text-foreground bg-background"
                            step="0.01"
                            min="0"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveBalance(u.id);
                              if (e.key === 'Escape') setEditingBalanceId(null);
                            }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-semibold">₽</span>
                        </div>
                        <Button size="sm" onClick={() => saveBalance(u.id)} disabled={balanceSaving} className="h-8 px-2 bg-lime-700 hover:bg-lime-800 text-white">
                          {balanceSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingBalanceId(null)} className="h-8 px-2 text-muted-foreground hover:bg-accent">
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingBalanceId(u.id);
                          setEditBalanceVal(((u.balanceKopecks ?? 0) / 100).toFixed(2));
                        }}
                        className="group flex items-center gap-1.5 cursor-pointer hover:bg-accent/50 px-2 py-1 -ml-2 rounded-lg max-w-fit transition-all border border-transparent hover:border-border/30"
                        title="Нажмите, чтобы изменить баланс"
                      >
                        <Coins size={13} className="text-amber-500/80" />
                        <span className="font-semibold text-foreground text-xs">{((u.balanceKopecks ?? 0) / 100).toFixed(2)} ₽</span>
                        <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5 align-middle">
                    <div className="flex items-center gap-2">
                      {u.isBanned ? (
                        <Badge variant="destructive" className="px-2 py-0.5 text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Забанен</Badge>
                      ) : (
                        <button
                          onClick={() => toggleVerify(u.id, u.isVerified)}
                          className="hover:scale-105 transition-all duration-200"
                          title="Нажмите, чтобы изменить статус подтверждения"
                        >
                          <Badge
                            variant={u.isVerified ? 'success' : 'muted'}
                            className={cn(
                              "px-2 py-0.5 text-[10px] font-semibold border cursor-pointer select-none",
                              u.isVerified
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20"
                            )}
                          >
                            {u.isVerified ? '✓ Верифицирован' : 'Не верифицирован'}
                          </Badge>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5 align-middle text-muted-foreground/80 font-mono text-[11px]">
                    {new Date(u.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 align-middle">
                    <div className="flex gap-1.5 items-center">
                      {u.isBanned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => ban(u.id, false)}
                          className="h-7 text-[10px] font-semibold border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        >
                          Разбанить
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => ban(u.id, true)}
                          className="h-7 text-[10px] font-semibold text-red-400 border-red-500/25 hover:bg-red-500/10 hover:text-red-300"
                        >
                          Бан
                        </Button>
                      )}

                      {u.role === 'USER' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => promote(u.id, 'ADMIN')}
                          className="h-7 text-[10px] font-semibold text-lime-700 border-lime-700/25 hover:bg-lime-700/10 hover:text-lime-700"
                        >
                          Админ
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => promote(u.id, 'USER')}
                          className="h-7 text-[10px] font-semibold text-muted-foreground border-border/80 hover:bg-accent"
                        >
                          Снять админа
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(u.id, u.email)}
                        className="h-7 px-2 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        title="Удалить аккаунт навсегда"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Clients tab ───────────────────────────────────────────

const ClientsTab = () => {
  const [clients, setClients] = useState<any[]>([])
  const [name, setName] = useState('')
  const [redirectUris, setRedirectUris] = useState('')
  const [isTrusted, setIsTrusted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newSecret, setNewSecret] = useState('')
  const [err, setErr] = useState('')

  const load = async () => {
    try { const r = await axios.get('/api/admin/clients'); setClients(r.data) }
    catch { setErr('Не удалось загрузить') }
  }

  useEffect(() => { load() }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setNewSecret(''); setLoading(true)
    try {
      const uris = redirectUris.split(',').map(u => u.trim()).filter(Boolean)
      const r = await axios.post('/api/admin/clients', { name, redirectUris: uris, isTrusted })
      setNewSecret(r.data.clientSecret)
      setName(''); setRedirectUris(''); setIsTrusted(false)
      load()
    } catch (e: any) { setErr(e.response?.data?.error || 'Ошибка') }
    finally { setLoading(false) }
  }

  const remove = async (id: string, clientName: string) => {
    if (!confirm(`Удалить приложение «${clientName}»?`)) return
    try { await axios.delete(`/api/admin/clients/${id}`); load() }
    catch { setErr('Ошибка удаления') }
  }

  return (
    <div className="p-5 space-y-5">
      {err && <Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert>}

      {newSecret && (
        <Alert variant="success">
          <AlertDescription>
            <p className="font-medium mb-2">Приложение создано. Сохраните Client Secret — показывается один раз.</p>
            <div className="flex items-center gap-2 bg-background/60 rounded px-3 py-2 font-mono text-xs break-all">
              <span className="flex-1">{newSecret}</span>
              <CopyBtn text={newSecret} />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {clients.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-5 border-b border-border/40">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-normal">Приложения ({clients.length})</p>
          </CardHeader>
          <div className="scrollbar-none overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {['Название', 'Client ID', 'Redirect URIs', 'Тип', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs uppercase tracking-widest text-muted-foreground font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {clients.map(c => (
                  <tr key={c.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{c.clientId}</span>
                        <CopyBtn text={c.clientId} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.redirectUris.map((u: string) => (
                        <p key={u} className="font-mono text-xs text-muted-foreground">{u}</p>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.isTrusted ? 'success' : 'muted'}>{c.isTrusted ? 'Доверенное' : 'Обычное'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 hover:text-red-300 px-2" onClick={() => remove(c.id, c.name)}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="max-w-lg">
        <CardHeader className="py-4 px-5 border-b border-border/40">
          <p className="text-sm font-medium">Добавить приложение</p>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">Название</Label>
              <Input id="app-name" value={name} onChange={e => setName(e.target.value)} placeholder="Arlist Analytics" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redirect-uris">Redirect URIs (через запятую)</Label>
              <Input id="redirect-uris" value={redirectUris} onChange={e => setRedirectUris(e.target.value)} placeholder="https://app.example.com/callback" required />
            </div>
            <div className="flex items-start gap-3">
              <input id="is-trusted" type="checkbox" checked={isTrusted} onChange={e => setIsTrusted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input bg-background accent-foreground cursor-pointer" />
              <div>
                <label htmlFor="is-trusted" className="text-sm font-medium cursor-pointer">Доверенное приложение</label>
                <p className="text-xs text-muted-foreground mt-0.5">Получает роль и статус верификации пользователя</p>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Создаём...' : 'Создать OIDC-клиента'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ── System Logs tab ───────────────────────────────────────

const logCategoryLabels: Record<string, string> = {
  SYSTEM: 'Система', AUTH: 'Авторизация', SECURITY: 'Безопасность', ADMIN: 'Админка', API: 'API', STATUS: 'Status page', MAIL: 'Почта', OIDC: 'OIDC',
}

const logLevelLabels: Record<string, string> = { INFO: 'Информация', WARN: 'Предупреждение', ERROR: 'Ошибка' }

const LogsTab = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [level, setLevel] = useState('ALL')
  const [category, setCategory] = useState('ALL')
  const [query, setQuery] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const response = await axios.get('/api/admin/logs', { params: {
        limit: 200,
        ...(level !== 'ALL' ? { level } : {}),
        ...(category !== 'ALL' ? { category } : {}),
        ...(query.trim() ? { query: query.trim() } : {}),
      } })
      setLogs(response.data.logs)
      setTotal(response.data.total)
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || 'Не удалось загрузить реальные логи сервера')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    const debounce = window.setTimeout(() => { void load() }, 250)
    return () => window.clearTimeout(debounce)
  }, [level, category, query])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = window.setInterval(() => { void load(true) }, 10_000)
    return () => window.clearInterval(interval)
  }, [autoRefresh, level, category, query])

  const fieldClass = 'h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring'

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-border/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-semibold">Реальные события сервера</p><p className="mt-1 text-xs text-muted-foreground">HTTP-запросы, авторизация, ошибки и действия администраторов. Хранение — 90 дней.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={autoRefresh ? 'outline' : 'ghost'} onClick={() => setAutoRefresh((value) => !value)}><Activity size={13} className={autoRefresh ? 'text-emerald-500' : 'text-muted-foreground'} />{autoRefresh ? 'Автообновление' : 'Пауза'}</Button>
          <Button size="sm" variant="outline" disabled={loading} onClick={() => void load()}><RefreshCw size={13} className={loading ? 'animate-spin' : ''} />Обновить</Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px_170px]">
        <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 pl-9 text-xs" placeholder="Событие, email, IP или путь…" /></div>
        <select className={fieldClass} value={level} onChange={(event) => setLevel(event.target.value)}><option value="ALL">Все уровни</option>{Object.entries(logLevelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value)}><option value="ALL">Все категории</option>{Object.entries(logCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground"><span>Показано {logs.length} из {total}</span>{autoRefresh && <span className="flex items-center gap-1.5 text-emerald-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />живой поток</span>}</div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {loading && logs.length === 0 ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 size={17} className="animate-spin" />Загружаем журнал…</div> : logs.length === 0 ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">По выбранным фильтрам событий нет.</div> : <div className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/50 bg-card/30">
        {logs.map((log) => <article key={log.id} className="p-4 transition-colors hover:bg-accent/10 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className={cn('h-2 w-2 shrink-0 rounded-full', log.level === 'ERROR' ? 'bg-red-500' : log.level === 'WARN' ? 'bg-amber-500' : 'bg-emerald-500')} /><Badge variant="outline" className="text-[9px]">{logCategoryLabels[log.category] || log.category}</Badge><span className={cn('text-[10px] font-semibold uppercase', log.level === 'ERROR' ? 'text-red-600' : log.level === 'WARN' ? 'text-amber-600' : 'text-muted-foreground')}>{logLevelLabels[log.level] || log.level}</span></div>
              <h3 className="mt-2 break-words text-sm font-semibold">{log.event}</h3>
              <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">{log.user?.email || log.subject || 'Системное событие'}{log.user?.role ? ` · ${log.user.role}` : ''}</p>
            </div>
            <time className="shrink-0 font-mono text-[10px] text-muted-foreground" dateTime={log.createdAt}>{new Date(log.createdAt).toLocaleString('ru-RU')}</time>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground/80">
            {log.method && log.path && <span>{log.method} {log.path}</span>}
            {log.statusCode !== null && <span className={log.statusCode >= 400 ? 'text-red-600' : ''}>HTTP {log.statusCode}</span>}
            {log.durationMs !== null && <span>{log.durationMs} мс</span>}
            {log.ipAddress && <span>IP {log.ipAddress}</span>}
          </div>
          {(log.userAgent || log.metadata) && <details className="mt-3"><summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">Технические данные</summary><div className="mt-2 space-y-2 rounded-md bg-black/[0.03] p-2 font-mono text-[10px] text-muted-foreground">{log.userAgent && <p className="break-all">User-Agent: {log.userAgent}</p>}{log.metadata && <pre className="whitespace-pre-wrap break-all">{JSON.stringify(log.metadata, null, 2)}</pre>}</div></details>}
        </article>)}
      </div>}
    </div>
  )
}

// ── Broadcast tab ─────────────────────────────────────────

const standardEmailTemplate = (subject: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a0f; color: #f4f4f5; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #121016; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #8000FF, #6B23FF); padding: 35px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.05em; }
    .content { padding: 40px 30px; line-height: 1.6; color: #d4d4d8; font-size: 15px; }
    .content p { margin-top: 0; margin-bottom: 16px; }
    .footer { text-align: center; padding: 20px; border-top: 1px solid #27272a; font-size: 12px; color: #71717a; background-color: #0c0a0f; }
    .footer a { color: #A766FF; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>арлист id</h1>
    </div>
    <div class="content font-sans">
      <h2 style="color: #ffffff; margin-top: 0; margin-bottom: 20px; font-size: 18px; font-weight: 600;">${subject}</h2>
      ${content.replace(/\n/g, '<br>')}
    </div>
    <div class="footer">
      Это системное уведомление от платформы <a href="https://arlist.ru">арлист id</a>.
    </div>
  </div>
</body>
</html>
`;

const BroadcastTab = () => {
  const [to, setTo] = useState<'all' | 'single'>('all')
  const [singleEmail, setSingleEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [styleMode, setStyleMode] = useState<'standard' | 'html'>('standard')
  const [content, setContent] = useState('')
  const [htmlCode, setHtmlCode] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null)
  
  // HTML Check warnings
  const [htmlWarnings, setHtmlWarnings] = useState<string[]>([])
  
  const checkHtml = () => {
    const warnings: string[] = []
    if (!htmlCode.includes('<html')) warnings.push('Отсутствует тег <html>. Рекомендуется обернуть письмо в html-структуру для лучшей совместимости.')
    if (!htmlCode.includes('<body')) warnings.push('Отсутствует тег <body>.')
    if (htmlCode.includes('<script')) warnings.push('В письме обнаружен тег <script>. Большинство почтовых провайдеров заблокируют его по соображениям безопасности!')
    if (htmlCode.includes('src="http://') || htmlCode.includes("src='http://")) warnings.push('Письмо содержит ссылки на картинки по незащищенному протоколу http://. Почтовые клиенты могут их скрыть.')
    
    setHtmlWarnings(warnings)
    if (warnings.length === 0) {
      setMessage({ type: 'success', text: 'HTML код успешно прошел базовые проверки почтовой совместимости.' })
    } else {
      setMessage({ type: 'warning', text: `Обнаружено ${warnings.length} предупреждений в HTML коде.` })
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    const finalHtml = styleMode === 'standard' 
      ? standardEmailTemplate(subject, content) 
      : htmlCode;

    const recipient = to === 'all' ? 'all' : singleEmail;

    try {
      const r = await axios.post('/api/admin/broadcast', {
        to: recipient,
        subject,
        html: finalHtml
      })
      setMessage({ type: 'success', text: r.data.message })
      if (to === 'single') setSingleEmail('')
      setSubject('')
      setContent('')
      setHtmlCode('')
      setHtmlWarnings([])
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Ошибка отправки рассылки' })
    } finally {
      setLoading(false)
    }
  }

  const previewHtml = styleMode === 'standard'
    ? standardEmailTemplate(subject || 'Заголовок письма', content || 'Текст вашего сообщения появится здесь...')
    : (htmlCode || '<div style="color: #a1a1aa; text-align: center; padding: 20px; font-family: sans-serif;">Введите HTML-код для предпросмотра</div>');

  return (
    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground mb-4">Настройка рассылки</h2>
        </div>

        {message && (
          <Alert variant={message.type === 'success' ? 'success' : message.type === 'warning' ? 'default' : 'destructive'}>
            <AlertDescription className="text-xs">{message.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Получатели</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={to === 'all' ? 'default' : 'outline'}
                onClick={() => setTo('all')}
                className="h-8 text-xs px-3"
              >
                Все пользователи
              </Button>
              <Button
                type="button"
                variant={to === 'single' ? 'default' : 'outline'}
                onClick={() => setTo('single')}
                className="h-8 text-xs px-3"
              >
                Конкретный email
              </Button>
            </div>
            {to === 'single' && (
              <Input
                type="email"
                placeholder="developer@example.com"
                value={singleEmail}
                onChange={e => setSingleEmail(e.target.value)}
                required
                className="h-9 text-xs mt-1.5"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject" className="text-xs">Тема письма</Label>
            <Input
              id="email-subject"
              placeholder="Важное обновление безопасности Arlist ID"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Стиль письма</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={styleMode === 'standard' ? 'default' : 'outline'}
                onClick={() => { setStyleMode('standard'); setMessage(null); }}
                className="h-8 text-xs px-3"
              >
                Стандартный стиль Arlist ID
              </Button>
              <Button
                type="button"
                variant={styleMode === 'html' ? 'default' : 'outline'}
                onClick={() => { setStyleMode('html'); setMessage(null); }}
                className="h-8 text-xs px-3"
              >
                Собственный HTML
              </Button>
            </div>
          </div>

          {styleMode === 'standard' ? (
            <div className="space-y-2">
              <Label htmlFor="email-text" className="text-xs">Текст сообщения</Label>
              <textarea
                id="email-text"
                rows={8}
                placeholder="Приветствуем! Сообщаем вам, что..."
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-html" className="text-xs">HTML код письма</Label>
                <Button type="button" variant="outline" size="sm" onClick={checkHtml} className="h-7 text-[10px] px-2 gap-1 border-lime-700/20 text-lime-700 hover:bg-lime-700/10">
                  <Check size={10} />Проверить разметку
                </Button>
              </div>
              <textarea
                id="email-html"
                rows={8}
                placeholder="<html><body><div style='color: red;'>Привет!</div></body></html>"
                value={htmlCode}
                onChange={e => setHtmlCode(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {htmlWarnings.length > 0 && (
                <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-md text-[11px] text-yellow-500 space-y-1">
                  <p className="font-semibold flex items-center gap-1"><AlertTriangle size={12} /> Предупреждения почтового клиента:</p>
                  <ul className="list-disc list-inside pl-1 space-y-0.5 font-sans leading-relaxed">
                    {htmlWarnings.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-9 bg-lime-700 hover:bg-lime-800 text-white font-semibold text-xs">
            {loading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Mail size={14} className="mr-1.5" />}
            {loading ? 'Отправка писем...' : 'Запустить рассылку'}
          </Button>
        </form>
      </div>

      <div className="flex flex-col h-full border border-border/50 rounded-xl overflow-hidden bg-card/20 min-h-[450px]">
        <div className="p-3 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Eye size={13} /> Предпросмотр письма</span>
          <Badge variant="outline" className="text-[10px] bg-background/50 border-border">Интерактивный вид</Badge>
        </div>
        <div className="flex-1 bg-white p-2">
          <iframe
            title="Email Preview"
            srcDoc={previewHtml}
            className="w-full h-full border-0 min-h-[400px] bg-white rounded"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}

// ── Settings (Registration Modes) tab ───────────────────────

const SettingsTab = () => {
  const [settings, setSettings] = useState<any>({ registrationMode: 'OPEN', email2faEnabled: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingTfa, setSavingTfa] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/api/admin/settings')
      setSettings(r.data)
    } catch {
      setMsg('Не удалось загрузить настройки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleModeChange = async (mode: 'OPEN' | 'CLOSED') => {
    setSaving(true)
    setMsg(null)
    try {
      const r = await axios.post('/api/admin/settings', { registrationMode: mode })
      setSettings(r.data)
      setMsg('Режим регистрации изменен успешно!')
      setTimeout(() => setMsg(null), 3000)
    } catch {
      setMsg('Ошибка сохранения настроек')
    } finally {
      setSaving(false)
    }
  }

  const handleTfaChange = async (enabled: boolean) => {
    setSavingTfa(true)
    setMsg(null)
    try {
      const r = await axios.post('/api/admin/settings', { email2faEnabled: enabled })
      setSettings(r.data)
      setMsg(enabled ? 'Email-2FA включена для всех пользователей' : 'Email-2FA отключена')
      setTimeout(() => setMsg(null), 3000)
    } catch {
      setMsg('Ошибка сохранения настроек')
    } finally {
      setSavingTfa(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground gap-2 text-sm">
      <Loader2 size={18} className="animate-spin text-lime-700" /> Загрузка настроек системы...
    </div>
  )

  return (
    <div className="p-5 max-w-2xl space-y-6">
      <div>
        <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground mb-1">Режимы регистрации пользователей</h2>
        <p className="text-xs text-muted-foreground">Настройка доступа для новых аккаунтов на платформе Arlist ID</p>
      </div>

      {msg && (
        <Alert variant={msg.includes('Ошибка') ? 'destructive' : 'success'}>
          <AlertDescription className="text-xs font-medium">{msg}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => !saving && settings.registrationMode !== 'OPEN' && handleModeChange('OPEN')}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300",
            settings.registrationMode === 'OPEN'
              ? "border-emerald-500 bg-emerald-500/5 text-foreground shadow-sm shadow-emerald-500/10"
              : "border-border/60 bg-card/40 text-muted-foreground hover:bg-accent/40"
          )}
        >
          <div className="flex items-center justify-between">
            <div className={cn("p-2 rounded-lg bg-background border border-border/40", settings.registrationMode === 'OPEN' ? "text-emerald-400" : "text-muted-foreground")}>
              <Unlock size={18} />
            </div>
            {settings.registrationMode === 'OPEN' && (
              <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                Активен
              </Badge>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Открытая регистрация</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-normal">
              Все новые пользователи могут свободно создавать аккаунты Arlist ID и проходить верификацию по почте.
            </p>
          </div>
        </div>

        <div
          onClick={() => !saving && settings.registrationMode !== 'CLOSED' && handleModeChange('CLOSED')}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300",
            settings.registrationMode === 'CLOSED'
              ? "border-red-500 bg-red-500/5 text-foreground shadow-sm shadow-red-500/10"
              : "border-border/60 bg-card/40 text-muted-foreground hover:bg-accent/40"
          )}
        >
          <div className="flex items-center justify-between">
            <div className={cn("p-2 rounded-lg bg-background border border-border/40", settings.registrationMode === 'CLOSED' ? "text-red-400" : "text-muted-foreground")}>
              <Lock size={18} />
            </div>
            {settings.registrationMode === 'CLOSED' && (
              <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">
                Активен
              </Badge>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Регистрация приостановлена</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-normal">
              Вход новых участников в систему закрыт. Любые попытки зарегистрироваться будут заблокированы с показом предупреждения.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground mb-1">Двухфакторная аутентификация по email</h2>
        <p className="text-xs text-muted-foreground">После ввода правильного пароля пользователю придёт одноразовый код на почту, без которого вход не завершится</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => !savingTfa && !settings.email2faEnabled && handleTfaChange(true)}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300",
            settings.email2faEnabled
              ? "border-emerald-500 bg-emerald-500/5 text-foreground shadow-sm shadow-emerald-500/10"
              : "border-border/60 bg-card/40 text-muted-foreground hover:bg-accent/40"
          )}
        >
          <div className="flex items-center justify-between">
            <div className={cn("p-2 rounded-lg bg-background border border-border/40", settings.email2faEnabled ? "text-emerald-400" : "text-muted-foreground")}>
              <Mail size={18} />
            </div>
            {settings.email2faEnabled && (
              <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                Активна
              </Badge>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Включена</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-normal">
              Каждый вход требует подтверждения кодом из письма. Повышает безопасность аккаунтов.
            </p>
          </div>
        </div>

        <div
          onClick={() => !savingTfa && settings.email2faEnabled && handleTfaChange(false)}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300",
            !settings.email2faEnabled
              ? "border-red-500 bg-red-500/5 text-foreground shadow-sm shadow-red-500/10"
              : "border-border/60 bg-card/40 text-muted-foreground hover:bg-accent/40"
          )}
        >
          <div className="flex items-center justify-between">
            <div className={cn("p-2 rounded-lg bg-background border border-border/40", !settings.email2faEnabled ? "text-red-400" : "text-muted-foreground")}>
              <Lock size={18} />
            </div>
            {!settings.email2faEnabled && (
              <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">
                Активна
              </Badge>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Отключена</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-normal">
              Вход завершается сразу после проверки пароля, без дополнительного кода.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tariffs tab ───────────────────────────────────────────

const TariffsTab = () => {
  const [tariffs, setTariffs] = useState<any[]>([])
  const [knownModels, setKnownModels] = useState<string[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    try {
      const [t, m] = await Promise.all([
        axios.get('/api/admin/tariffs'),
        axios.get('/api/admin/known-models'),
      ])
      setTariffs(t.data)
      setKnownModels(m.data.models)
    } catch { setErr('Не удалось загрузить') }
  }

  useEffect(() => { load() }, [])

  const startEdit = (t: any) => {
    setEditing(t.id)
    setErr('')
    setForm({
      creditsPer5h: t.creditsPer5h,
      creditsPerWeek: t.creditsPerWeek,
      overrunEnabled: t.overrunEnabled,
      overrunPriceKopecks: t.overrunPriceKopecks,
      models: new Set<string>(t.models),
    })
  }

  const toggleModel = (m: string) => {
    setForm((f: any) => {
      const models = new Set<string>(f.models)
      models.has(m) ? models.delete(m) : models.add(m)
      return { ...f, models }
    })
  }

  const save = async (id: string) => {
    setSaving(true); setErr('')
    try {
      await axios.patch(`/api/admin/tariffs/${id}`, {
        creditsPer5h: Number(form.creditsPer5h),
        creditsPerWeek: Number(form.creditsPerWeek),
        overrunEnabled: form.overrunEnabled,
        overrunPriceKopecks: Number(form.overrunPriceKopecks),
        models: Array.from(form.models),
      })
      setEditing(null)
      load()
    } catch (e: any) { setErr(e.response?.data?.error || 'Ошибка сохранения') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-5 space-y-5">
      {err && <Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert>}
      <p className="text-xs text-muted-foreground">
        Модели, кредиты (по токенам, за 5ч/неделю) и оверран для каждого тарифа Вспышки.
      </p>

      {tariffs.map(t => (
        <Card key={t.id}>
          <CardHeader className="py-3 px-5 border-b border-border/40 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins size={14} className="text-muted-foreground" />
              <p className="text-sm font-medium">{t.name}</p>
              <Badge variant="muted" className="text-[10px]">{t.type}</Badge>
            </div>
            {editing !== t.id ? (
              <Button size="sm" variant="outline" onClick={() => startEdit(t)}>
                <Pencil size={13} />Изменить
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Отмена</Button>
                <Button size="sm" disabled={saving} onClick={() => save(t.id)}>
                  {saving && <Loader2 size={13} className="animate-spin" />}Сохранить
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-5">
            {editing !== t.id ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground mb-1">Кредиты / 5ч</p>{t.creditsPer5h.toLocaleString('ru-RU')}</div>
                <div><p className="text-xs text-muted-foreground mb-1">Кредиты / неделя</p>{t.creditsPerWeek.toLocaleString('ru-RU')}</div>
                <div><p className="text-xs text-muted-foreground mb-1">Оверран</p>{t.overrunEnabled ? 'Включён' : 'Выключен'}</div>
                <div><p className="text-xs text-muted-foreground mb-1">Модели</p>{t.models.join(', ') || '—'}</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Кредиты / 5ч</Label>
                    <Input type="number" value={form.creditsPer5h} onChange={e => setForm({ ...form, creditsPer5h: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Кредиты / неделя</Label>
                    <Input type="number" value={form.creditsPerWeek} onChange={e => setForm({ ...form, creditsPerWeek: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={form.overrunEnabled} onChange={e => setForm({ ...form, overrunEnabled: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-input bg-background accent-foreground cursor-pointer" />
                  <div>
                    <label className="text-sm font-medium cursor-pointer">Оверран (платный овердрафт)</label>
                    <p className="text-xs text-muted-foreground mt-0.5">Сверх лимита — списывать с баланса вместо блокировки</p>
                  </div>
                </div>
                {form.overrunEnabled && (
                  <div className="space-y-2 max-w-xs">
                    <Label>Цена за 1000 кредитов сверх лимита (копейки)</Label>
                    <Input type="number" value={form.overrunPriceKopecks} onChange={e => setForm({ ...form, overrunPriceKopecks: e.target.value })} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Модели</Label>
                  <div className="flex flex-wrap gap-2">
                    {knownModels.map(m => (
                      <button key={m} type="button" onClick={() => toggleModel(m)}
                        className={cn(
                          'text-xs font-mono px-3 py-1.5 rounded-full border transition-colors',
                          form.models?.has(m)
                            ? 'border-lime-700/40 bg-lime-700/10 text-lime-700'
                            : 'border-border/40 text-muted-foreground hover:border-border'
                        )}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── AI models tab ────────────────────────────────────────

const EMPTY_MODEL = {
  key: '', label: '', wireProtocol: 'OPENAI_COMPATIBLE', authMethod: 'BEARER_ENV',
  baseUrl: '', upstreamModel: '', apiKeyEnvVar: '', headerName: '',
  extraHeaderName: '', extraHeaderEnvVar: '', oauthTokenUrl: '', oauthScopeEnvVar: '',
  isEnabled: false,
}

const ModelsTab = () => {
  const [models, setModels] = useState<any[]>([])
  const [form, setForm] = useState<any>(EMPTY_MODEL)
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    try {
      const { data } = await axios.get('/api/admin/models')
      setModels(data)
    } catch { setErr('Не удалось загрузить реестр моделей') }
  }

  useEffect(() => { load() }, [])

  const startEdit = (model: any) => {
    setEditing(model.id)
    setErr('')
    setForm({
      key: model.key, label: model.label, wireProtocol: model.wireProtocol, authMethod: model.authMethod,
      baseUrl: model.baseUrl, upstreamModel: model.upstreamModel,
      apiKeyEnvVar: model.apiKeyEnvVar ?? '', headerName: model.headerName ?? '',
      extraHeaderName: model.extraHeaderName ?? '', extraHeaderEnvVar: model.extraHeaderEnvVar ?? '',
      oauthTokenUrl: model.oauthTokenUrl ?? '', oauthScopeEnvVar: model.oauthScopeEnvVar ?? '',
      isEnabled: model.isEnabled,
    })
  }

  const payload = () => ({
    ...form,
    apiKeyEnvVar: form.apiKeyEnvVar || null,
    headerName: form.headerName || null,
    extraHeaderName: form.extraHeaderName || null,
    extraHeaderEnvVar: form.extraHeaderEnvVar || null,
    oauthTokenUrl: form.oauthTokenUrl || null,
    oauthScopeEnvVar: form.oauthScopeEnvVar || null,
  })

  const save = async () => {
    setSaving(true); setErr('')
    try {
      if (editing === 'new') await axios.post('/api/admin/models', payload())
      else await axios.patch(`/api/admin/models/${editing}`, payload())
      setEditing(null)
      await load()
    } catch (error: any) { setErr(error.response?.data?.error || 'Не удалось сохранить модель') }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Удалить модель из реестра?')) return
    try {
      await axios.delete(`/api/admin/models/${id}`)
      await load()
    } catch (error: any) { setErr(error.response?.data?.error || 'Не удалось удалить модель') }
  }

  const fields = (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Ключ модели</Label><Input value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} placeholder="gemini-2.5-flash" /><p className="text-xs text-muted-foreground">Именно это значение передаёт клиент в поле model.</p></div>
        <div className="space-y-2"><Label>Название в интерфейсе</Label><Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Gemini 2.5 Flash" /></div>
        <div className="space-y-2"><Label>API endpoint</Label><Input value={form.baseUrl} onChange={e => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://provider.example/v1/chat/completions" /></div>
        <div className="space-y-2"><Label>Модель у провайдера</Label><Input value={form.upstreamModel} onChange={e => setForm({ ...form, upstreamModel: e.target.value })} placeholder="provider-model-id" /></div>
        <div className="space-y-2"><Label>Протокол</Label><select value={form.wireProtocol} onChange={e => setForm({ ...form, wireProtocol: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="OPENAI_COMPATIBLE">OpenAI-compatible</option><option value="YANDEXGPT">YandexGPT</option></select></div>
        <div className="space-y-2"><Label>Авторизация</Label><select value={form.authMethod} onChange={e => setForm({ ...form, authMethod: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="BEARER_ENV">Bearer token из env</option><option value="API_KEY_HEADER">API key в заголовке</option><option value="OAUTH2_CLIENT_CREDENTIALS">OAuth2 client credentials</option></select></div>
        <div className="space-y-2"><Label>Имя env-переменной с секретом</Label><Input value={form.apiKeyEnvVar} onChange={e => setForm({ ...form, apiKeyEnvVar: e.target.value.toUpperCase() })} placeholder="PROVIDER_API_KEY" /><p className="text-xs text-muted-foreground">Сам секрет в базу не записывается.</p></div>
        {form.authMethod === 'API_KEY_HEADER' && form.wireProtocol === 'OPENAI_COMPATIBLE' && <div className="space-y-2"><Label>Название заголовка</Label><Input value={form.headerName} onChange={e => setForm({ ...form, headerName: e.target.value })} placeholder="x-api-key" /></div>}
        {form.authMethod === 'OAUTH2_CLIENT_CREDENTIALS' && <><div className="space-y-2"><Label>OAuth token URL</Label><Input value={form.oauthTokenUrl} onChange={e => setForm({ ...form, oauthTokenUrl: e.target.value })} placeholder="https://provider.example/oauth" /></div><div className="space-y-2"><Label>Env-переменная scope</Label><Input value={form.oauthScopeEnvVar} onChange={e => setForm({ ...form, oauthScopeEnvVar: e.target.value.toUpperCase() })} placeholder="PROVIDER_SCOPE" /></div></>}
        {form.wireProtocol === 'YANDEXGPT' && <><div className="space-y-2"><Label>Дополнительный заголовок</Label><Input value={form.extraHeaderName} onChange={e => setForm({ ...form, extraHeaderName: e.target.value })} placeholder="x-folder-id" /></div><div className="space-y-2"><Label>Env со значением заголовка</Label><Input value={form.extraHeaderEnvVar} onChange={e => setForm({ ...form, extraHeaderEnvVar: e.target.value.toUpperCase() })} placeholder="YANDEX_FOLDER_ID" /></div></>}
      </div>
      <label className="flex items-start gap-3 rounded-lg border border-border/60 p-3 text-sm"><input type="checkbox" checked={form.isEnabled} onChange={e => setForm({ ...form, isEnabled: e.target.checked })} className="mt-0.5 h-4 w-4 accent-foreground" /><span><span className="font-medium">Модель включена в прокси</span><span className="mt-0.5 block text-xs text-muted-foreground">После включения назначьте её нужным тарифам во вкладке «Тарифы Вспышки».</span></span></label>
    </div>
  )

  return <div className="space-y-5 p-4 sm:p-5">
    {err && <Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert>}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-sm font-semibold">Реестр моделей и провайдеров</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">OpenAI-совместимые модели добавляются без изменения кода. Здесь хранится конфигурация подключения, а секреты остаются только в окружении сервера.</p></div>{editing !== 'new' && <Button size="sm" variant="outline" className="shrink-0" onClick={() => { setEditing('new'); setForm(EMPTY_MODEL); setErr('') }}><Plus size={13} />Добавить модель</Button>}</div>

    {editing === 'new' && <Card><CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/40 px-4 py-3 sm:px-5"><p className="text-sm font-medium">Новая модель</p><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Отмена</Button><Button size="sm" disabled={saving} onClick={save}>{saving && <Loader2 size={13} className="animate-spin" />}Сохранить</Button></div></CardHeader><CardContent className="p-4 sm:p-5">{fields}</CardContent></Card>}

    {models.map(model => <Card key={model.id}><CardHeader className="flex flex-col gap-3 border-b border-border/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex min-w-0 flex-wrap items-center gap-2"><Globe size={14} className="text-muted-foreground" /><span className="break-all font-mono text-sm font-medium">{model.key}</span><Badge variant={model.isEnabled ? 'success' : 'muted'} className="text-[10px]">{model.isEnabled ? 'включена' : 'выключена'}</Badge><Badge variant={model.isConfigured ? 'outline' : 'warning'} className="text-[10px]">{model.isConfigured ? 'секрет подключён' : 'нужен секрет'}</Badge></div><div className="flex gap-2">{editing === model.id ? <><Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Отмена</Button><Button size="sm" disabled={saving} onClick={save}>{saving && <Loader2 size={13} className="animate-spin" />}Сохранить</Button></> : <><Button size="sm" variant="outline" onClick={() => startEdit(model)}><Pencil size={13} />Изменить</Button><Button size="sm" variant="ghost" aria-label={`Удалить ${model.label}`} onClick={() => remove(model.id)}><Trash2 size={13} /></Button></>}</div></CardHeader><CardContent className="p-4 sm:p-5">{editing === model.id ? fields : <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><p className="mb-1 text-xs text-muted-foreground">Название</p>{model.label}</div><div><p className="mb-1 text-xs text-muted-foreground">Протокол</p>{model.wireProtocol}</div><div className="min-w-0 lg:col-span-2"><p className="mb-1 text-xs text-muted-foreground">Endpoint</p><span className="break-all font-mono text-xs">{model.baseUrl}</span></div><div><p className="mb-1 text-xs text-muted-foreground">Авторизация</p>{model.authMethod}</div><div><p className="mb-1 text-xs text-muted-foreground">Env</p><span className="font-mono text-xs">{model.apiKeyEnvVar || '—'}</span></div><div className="min-w-0 lg:col-span-2"><p className="mb-1 text-xs text-muted-foreground">Модель провайдера</p><span className="break-all font-mono text-xs">{model.upstreamModel}</span></div>{!model.isConfigured && <div className="sm:col-span-2 lg:col-span-4"><p className="text-xs text-amber-500">Добавьте в окружение сервера: {model.missingEnvVars.join(', ') || model.apiKeyEnvVar}</p></div>}</div>}</CardContent></Card>)}
  </div>
}

// ── Main ──────────────────────────────────────────────────

const Admin = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6">
        <a href="/" className="font-display text-base tracking-tight hover:opacity-75 transition-opacity">арлист id</a>
        <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
          <ArrowLeft size={14} />Профиль
        </Button>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 animate-fade-up">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-lime-700/10 border border-lime-700/20">
            <ShieldCheck size={18} className="text-lime-700" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Панель управления</h1>
            <p className="text-sm text-muted-foreground">арлист id</p>
          </div>
        </div>

        <StatsBar />

        <Tabs defaultValue="users">
          <Card className="overflow-hidden">
            <TabsList className="scrollbar-none overflow-x-auto rounded-none border-b border-border/60 bg-transparent px-2 gap-0">
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="clients">OIDC-клиенты</TabsTrigger>
              <TabsTrigger value="broadcast">Рассылка писем</TabsTrigger>
              <TabsTrigger value="status">Статус</TabsTrigger>
              <TabsTrigger value="tariffs">Тарифы Вспышки</TabsTrigger>
              <TabsTrigger value="models">Модели ИИ</TabsTrigger>
              <TabsTrigger value="settings">Режимы регистрации</TabsTrigger>
              <TabsTrigger value="logs">Логи системы</TabsTrigger>
            </TabsList>
            <TabsContent value="users"><UsersTab /></TabsContent>
            <TabsContent value="clients"><ClientsTab /></TabsContent>
            <TabsContent value="broadcast"><BroadcastTab /></TabsContent>
            <TabsContent value="status"><StatusAdminTab /></TabsContent>
            <TabsContent value="tariffs"><TariffsTab /></TabsContent>
            <TabsContent value="models"><ModelsTab /></TabsContent>
            <TabsContent value="settings"><SettingsTab /></TabsContent>
            <TabsContent value="logs"><LogsTab /></TabsContent>
          </Card>
        </Tabs>
      </main>
    </div>
  )
}

export default Admin
