import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ── Copy button ───────────────────────────────────────────

const CopyBtn = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copied ? 'скопировано' : 'копировать'}
    </button>
  )
}

// ── Users tab ─────────────────────────────────────────────

const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/api/admin/users')
      setUsers(r.data)
    } catch { setErr('Не удалось загрузить') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const ban = async (id: string, isBanned: boolean) => {
    try { await axios.patch(`/api/admin/users/${id}`, { isBanned }); load() }
    catch { setErr('Ошибка') }
  }

  const promote = async (id: string, role: string) => {
    try { await axios.patch(`/api/admin/users/${id}`, { role }); load() }
    catch { setErr('Ошибка') }
  }

  const remove = async (id: string, email: string) => {
    if (!confirm(`Удалить ${email}?`)) return
    try { await axios.delete(`/api/admin/users/${id}`); load() }
    catch { setErr('Ошибка удаления') }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
      <Loader2 size={16} className="animate-spin" /> Загрузка...
    </div>
  )

  return (
    <div className="p-0">
      {err && <div className="px-5 pt-4"><Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert></div>}
      {users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Нет пользователей</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                {['Пользователь', 'Роль', 'Статус', 'Дата', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-widest text-muted-foreground font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name || '—'}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === 'ADMIN' ? 'purple' : 'muted'}>
                      {u.role === 'ADMIN' ? 'Админ' : 'Юзер'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.isBanned
                      ? <Badge variant="destructive">Забанен</Badge>
                      : <Badge variant={u.isVerified ? 'success' : 'muted'}>{u.isVerified ? 'Активен' : 'Не верифицирован'}</Badge>
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {u.isBanned
                        ? <Button size="sm" variant="outline" onClick={() => ban(u.id, false)}>Разбанить</Button>
                        : <Button size="sm" variant="outline" className="text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300" onClick={() => ban(u.id, true)}>Бан</Button>
                      }
                      {u.role === 'USER'
                        ? <Button size="sm" variant="outline" className="text-violet-400 border-violet-500/20 hover:bg-violet-500/10" onClick={() => promote(u.id, 'ADMIN')}>→ Админ</Button>
                        : <Button size="sm" variant="outline" onClick={() => promote(u.id, 'USER')}>→ Юзер</Button>
                      }
                      <Button size="sm" variant="outline" className="text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300" onClick={() => remove(u.id, u.email)}>Удалить</Button>
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
    e.preventDefault()
    setErr(''); setNewSecret(''); setLoading(true)
    try {
      const uris = redirectUris.split(',').map(u => u.trim()).filter(Boolean)
      const r = await axios.post('/api/admin/clients', { name, redirectUris: uris, isTrusted })
      setNewSecret(r.data.clientSecret)
      setName(''); setRedirectUris(''); setIsTrusted(false)
      load()
    } catch (e: any) { setErr(e.response?.data?.error || 'Ошибка') }
    finally { setLoading(false) }
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
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-normal">
              Приложения ({clients.length})
            </p>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {['Название', 'Client ID', 'Redirect URIs', 'Тип'].map(h => (
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
                      <Badge variant={c.isTrusted ? 'success' : 'muted'}>
                        {c.isTrusted ? 'Доверенное' : 'Обычное'}
                      </Badge>
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
              <input
                id="is-trusted"
                type="checkbox"
                checked={isTrusted}
                onChange={e => setIsTrusted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input bg-background accent-foreground cursor-pointer"
              />
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

// ── Main ──────────────────────────────────────────────────

const Admin = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="h-14 sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6">
        <a href="/" className="font-display text-base text-foreground tracking-tight hover:opacity-75 transition-opacity">
          Arlist ID
        </a>
        <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
          <ArrowLeft size={14} />
          Профиль
        </Button>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 animate-fade-up">
        <div className="mb-8 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <ShieldCheck size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Панель управления</h1>
            <p className="text-sm text-muted-foreground">Arlist ID</p>
          </div>
        </div>

        <Tabs defaultValue="users">
          <Card className={cn("overflow-hidden")}>
            <TabsList className="rounded-none border-b border-border/60 bg-transparent px-2 gap-0">
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="clients">OIDC-клиенты</TabsTrigger>
            </TabsList>
            <TabsContent value="users"><UsersTab /></TabsContent>
            <TabsContent value="clients"><ClientsTab /></TabsContent>
          </Card>
        </Tabs>
      </main>
    </div>
  )
}

export default Admin
