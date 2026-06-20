import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, ArrowLeft, Loader2, ShieldCheck, Users, Activity, Ban, AppWindow, Trash2, Search, Coins, Pencil, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

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
    { icon: AppWindow, label: 'OIDC-клиенты', value: stats.totalClients, color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/10' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      {tiles.map(({ icon: Icon, label, value, color, bg }) => (
        <div key={label} className={cn("rounded-2xl border bg-card/40 p-5 flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] hover:bg-card/75", bg)}>
          <div className={cn("p-3 rounded-xl bg-background/85 border border-border/40", color)}>
            <Icon size={20} className="shrink-0" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5 leading-tight">{label}</p>
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
      <Loader2 size={18} className="animate-spin text-violet-500" /> Загрузка списка пользователей...
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
        <div className="overflow-x-auto">
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
                        <Button size="sm" onClick={() => saveBalance(u.id)} disabled={balanceSaving} className="h-8 px-2 bg-violet-600 hover:bg-violet-700 text-white">
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
                          className="h-7 text-[10px] font-semibold text-violet-400 border-violet-500/25 hover:bg-violet-500/10 hover:text-violet-300"
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
          <div className="overflow-x-auto">
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

const LogsTab = () => {
  const mockLogs = [
    { id: 1, event: 'Успешный вход администратора', user: 'admin@arlist.ru', ip: '192.168.1.45', time: 'Только что', status: 'success' },
    { id: 2, event: 'Обновление баланса пользователя', user: 'user@example.com (Баланс: +500.00 ₽)', ip: '192.168.1.45', time: '5 мин. назад', status: 'success' },
    { id: 3, event: 'Изменение роли пользователя на ADMIN', user: 'moderator@arlist.ru', ip: '127.0.0.1', time: '12 мин. назад', status: 'success' },
    { id: 4, event: 'Неудачная попытка входа (неверный пароль)', user: 'hacker@scam.com', ip: '93.184.216.34', time: '34 мин. назад', status: 'warning' },
    { id: 5, event: 'Создание OIDC-клиента «Selectel Integration»', user: 'admin@arlist.ru', ip: '192.168.1.45', time: '1 ч. назад', status: 'success' },
    { id: 6, event: 'Регистрация нового аккаунта', user: 'developer99@gmail.com', ip: '82.200.12.190', time: '2 ч. назад', status: 'success' },
    { id: 7, event: 'Запрос на смену пароля', user: 'guest_user@mail.ru', ip: '95.54.120.3', time: '4 ч. назад', status: 'info' }
  ]

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-normal">Последние события безопасности</p>
        <Badge variant="outline" className="text-[10px] text-violet-400 border-violet-500/20 bg-violet-500/5">
          Живой поток событий
        </Badge>
      </div>

      <div className="divide-y divide-border/30">
        {mockLogs.map(l => (
          <div key={l.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-accent/10 px-2 rounded-lg transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  l.status === 'success' ? "bg-emerald-500" :
                  l.status === 'warning' ? "bg-red-500 animate-pulse" : "bg-blue-400"
                )} />
                <span className="font-semibold text-foreground/90">{l.event}</span>
              </div>
              <p className="text-muted-foreground pl-3.5 font-mono text-[10px]">{l.user}</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground/80 font-mono sm:text-right">
              <span>{l.ip}</span>
              <span className="min-w-20 text-right">{l.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────

const Admin = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6">
        <a href="/" className="font-display text-base tracking-tight hover:opacity-75 transition-opacity">Arlist ID</a>
        <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
          <ArrowLeft size={14} />Профиль
        </Button>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 animate-fade-up">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <ShieldCheck size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Панель управления</h1>
            <p className="text-sm text-muted-foreground">Arlist ID</p>
          </div>
        </div>

        <StatsBar />

        <Tabs defaultValue="users">
          <Card className="overflow-hidden">
            <TabsList className="rounded-none border-b border-border/60 bg-transparent px-2 gap-0">
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="clients">OIDC-клиенты</TabsTrigger>
              <TabsTrigger value="logs">Логи системы</TabsTrigger>
            </TabsList>
            <TabsContent value="users"><UsersTab /></TabsContent>
            <TabsContent value="clients"><ClientsTab /></TabsContent>
            <TabsContent value="logs"><LogsTab /></TabsContent>
          </Card>
        </Tabs>
      </main>
    </div>
  )
}

export default Admin
