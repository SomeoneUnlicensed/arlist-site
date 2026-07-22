import { useEffect, useState } from 'react'
import axios from 'axios'
import { Activity, CalendarClock, Eye, Globe, Loader2, Plus, Send, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const componentStatuses: Record<string, string> = {
  OPERATIONAL: 'Работает', DEGRADED: 'Деградация', PARTIAL_OUTAGE: 'Частичный сбой', MAJOR_OUTAGE: 'Недоступен', MAINTENANCE: 'Обслуживание',
}
const incidentStates: Record<string, string> = {
  INVESTIGATING: 'Расследуем', IDENTIFIED: 'Причина найдена', MONITORING: 'Наблюдаем', RESOLVED: 'Устранён',
}
const impactLabels: Record<string, string> = { MINOR: 'Незначительное', MAJOR: 'Серьёзное', CRITICAL: 'Критическое' }
const maintenanceStates: Record<string, string> = { SCHEDULED: 'Запланировано', IN_PROGRESS: 'Идёт сейчас', COMPLETED: 'Завершено', CANCELLED: 'Отменено' }
const fieldClass = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring'

const emptyIncident = { title: '', summary: '', impact: 'MINOR', message: '', componentIds: [] as string[], isPublished: true }
const emptyComponent = { slug: '', name: '', description: '', group: 'Сервисы', order: '0' }
const emptyMaintenance = { title: '', description: '', startsAt: '', endsAt: '', componentIds: [] as string[], isPublished: true }

const ComponentPicker = ({ components, selected, onChange }: { components: any[]; selected: string[]; onChange: (value: string[]) => void }) => {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])
  return <div className="flex flex-wrap gap-2">{components.map((component) => <button key={component.id} type="button" onClick={() => toggle(component.id)} className={cn('rounded-full border px-3 py-1.5 text-xs transition-colors', selected.includes(component.id) ? 'border-lime-700/40 bg-lime-700/10 text-lime-800' : 'border-border text-muted-foreground hover:text-foreground')}>{component.name}</button>)}</div>
}

export const StatusAdminTab = () => {
  const [data, setData] = useState<any>({ components: [], incidents: [], maintenance: [] })
  const [creating, setCreating] = useState<'component' | 'incident' | 'maintenance' | null>(null)
  const [componentForm, setComponentForm] = useState(emptyComponent)
  const [incidentForm, setIncidentForm] = useState(emptyIncident)
  const [maintenanceForm, setMaintenanceForm] = useState(emptyMaintenance)
  const [updateDrafts, setUpdateDrafts] = useState<Record<string, { status: string; message: string }>>({})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    try {
      const response = await axios.get('/api/admin/status')
      setData(response.data)
    } catch { setErr('Не удалось загрузить status page') }
  }

  useEffect(() => { load() }, [])

  const fail = (error: any, fallback: string) => setErr(error.response?.data?.error || fallback)

  const patchComponent = async (id: string, patch: Record<string, unknown>) => {
    setErr('')
    try { await axios.patch(`/api/admin/status/components/${id}`, patch); await load() } catch (error: any) { fail(error, 'Не удалось обновить компонент') }
  }

  const createComponent = async () => {
    setSaving(true); setErr('')
    try {
      await axios.post('/api/admin/status/components', { ...componentForm, order: Number(componentForm.order) })
      setComponentForm(emptyComponent); setCreating(null); await load()
    } catch (error: any) { fail(error, 'Не удалось создать компонент') } finally { setSaving(false) }
  }

  const createIncident = async () => {
    setSaving(true); setErr('')
    try {
      await axios.post('/api/admin/status/incidents', incidentForm)
      setIncidentForm(emptyIncident); setCreating(null); await load()
    } catch (error: any) { fail(error, 'Не удалось создать инцидент') } finally { setSaving(false) }
  }

  const patchIncident = async (id: string, patch: Record<string, unknown>) => {
    try { await axios.patch(`/api/admin/status/incidents/${id}`, patch); await load() } catch (error: any) { fail(error, 'Не удалось обновить инцидент') }
  }

  const addUpdate = async (incident: any) => {
    const draft = updateDrafts[incident.id] ?? { status: incident.status, message: '' }
    if (!draft.message.trim()) return
    setSaving(true); setErr('')
    try {
      await axios.post(`/api/admin/status/incidents/${incident.id}/updates`, draft)
      setUpdateDrafts((current) => ({ ...current, [incident.id]: { status: draft.status, message: '' } })); await load()
    } catch (error: any) { fail(error, 'Не удалось опубликовать обновление') } finally { setSaving(false) }
  }

  const removeIncident = async (id: string) => {
    if (!confirm('Удалить инцидент и всю историю его обновлений?')) return
    try { await axios.delete(`/api/admin/status/incidents/${id}`); await load() } catch (error: any) { fail(error, 'Не удалось удалить инцидент') }
  }

  const createMaintenance = async () => {
    setSaving(true); setErr('')
    try {
      await axios.post('/api/admin/status/maintenance', maintenanceForm)
      setMaintenanceForm(emptyMaintenance); setCreating(null); await load()
    } catch (error: any) { fail(error, 'Не удалось запланировать работы') } finally { setSaving(false) }
  }

  const patchMaintenance = async (id: string, patch: Record<string, unknown>) => {
    try { await axios.patch(`/api/admin/status/maintenance/${id}`, patch); await load() } catch (error: any) { fail(error, 'Не удалось обновить работы') }
  }

  const removeMaintenance = async (id: string) => {
    if (!confirm('Удалить плановые работы?')) return
    try { await axios.delete(`/api/admin/status/maintenance/${id}`); await load() } catch (error: any) { fail(error, 'Не удалось удалить работы') }
  }

  return <div className="space-y-8 p-4 sm:p-5">
    {err && <Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert>}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold">Управление status page</p><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Компоненты, оперативные обновления инцидентов и плановые работы. Публичная страница доступна по адресу <a className="underline" href="/status" target="_blank" rel="noreferrer">/status</a>.</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setCreating('component')}><Plus size={13} />Компонент</Button><Button size="sm" onClick={() => setCreating('incident')}><Plus size={13} />Инцидент</Button><Button size="sm" variant="outline" onClick={() => setCreating('maintenance')}><CalendarClock size={13} />Работы</Button></div></div>

    {creating === 'component' && <Card><CardHeader className="flex flex-row items-center justify-between border-b border-border/40 px-5 py-3"><p className="text-sm font-medium">Новый компонент</p><Button size="sm" variant="ghost" onClick={() => setCreating(null)}>Отмена</Button></CardHeader><CardContent className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Название</Label><Input value={componentForm.name} onChange={(event) => setComponentForm({ ...componentForm, name: event.target.value })} placeholder="Arlist ID" /></div><div className="space-y-2"><Label>Slug</Label><Input value={componentForm.slug} onChange={(event) => setComponentForm({ ...componentForm, slug: event.target.value })} placeholder="arlist-id" /></div><div className="space-y-2"><Label>Группа</Label><Input value={componentForm.group} onChange={(event) => setComponentForm({ ...componentForm, group: event.target.value })} /></div><div className="space-y-2"><Label>Порядок</Label><Input type="number" value={componentForm.order} onChange={(event) => setComponentForm({ ...componentForm, order: event.target.value })} /></div></div><div className="space-y-2"><Label>Описание</Label><Input value={componentForm.description} onChange={(event) => setComponentForm({ ...componentForm, description: event.target.value })} /></div><Button disabled={saving || !componentForm.name.trim() || !componentForm.slug.trim()} onClick={createComponent}>{saving && <Loader2 className="animate-spin" size={13} />}Создать компонент</Button></CardContent></Card>}

    {creating === 'incident' && <Card><CardHeader className="flex flex-row items-center justify-between border-b border-border/40 px-5 py-3"><p className="text-sm font-medium">Новый инцидент</p><Button size="sm" variant="ghost" onClick={() => setCreating(null)}>Отмена</Button></CardHeader><CardContent className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-[1fr_220px]"><div className="space-y-2"><Label>Заголовок</Label><Input value={incidentForm.title} onChange={(event) => setIncidentForm({ ...incidentForm, title: event.target.value })} placeholder="Проблемы со входом" /></div><div className="space-y-2"><Label>Влияние</Label><select className={fieldClass} value={incidentForm.impact} onChange={(event) => setIncidentForm({ ...incidentForm, impact: event.target.value })}>{Object.entries(impactLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div><div className="space-y-2"><Label>Описание</Label><textarea className={`${fieldClass} min-h-24 resize-y`} value={incidentForm.summary} onChange={(event) => setIncidentForm({ ...incidentForm, summary: event.target.value })} /></div><div className="space-y-2"><Label>Первое обновление таймлайна</Label><textarea className={`${fieldClass} min-h-20 resize-y`} value={incidentForm.message} onChange={(event) => setIncidentForm({ ...incidentForm, message: event.target.value })} placeholder="Мы видим проблему и начали расследование." /></div><div className="space-y-2"><Label>Затронутые компоненты</Label><ComponentPicker components={data.components} selected={incidentForm.componentIds} onChange={(componentIds) => setIncidentForm({ ...incidentForm, componentIds })} /></div><div className="flex flex-wrap items-center justify-between gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={incidentForm.isPublished} onChange={(event) => setIncidentForm({ ...incidentForm, isPublished: event.target.checked })} />Опубликовать сразу</label><Button disabled={saving || !incidentForm.title.trim() || !incidentForm.summary.trim() || !incidentForm.componentIds.length} onClick={createIncident}>{saving && <Loader2 className="animate-spin" size={13} />}Опубликовать инцидент</Button></div></CardContent></Card>}

    {creating === 'maintenance' && <Card><CardHeader className="flex flex-row items-center justify-between border-b border-border/40 px-5 py-3"><p className="text-sm font-medium">Плановые работы</p><Button size="sm" variant="ghost" onClick={() => setCreating(null)}>Отмена</Button></CardHeader><CardContent className="space-y-4 p-5"><div className="space-y-2"><Label>Название</Label><Input value={maintenanceForm.title} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, title: event.target.value })} /></div><div className="space-y-2"><Label>Описание</Label><textarea className={`${fieldClass} min-h-20 resize-y`} value={maintenanceForm.description} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, description: event.target.value })} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Начало</Label><Input type="datetime-local" value={maintenanceForm.startsAt} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, startsAt: event.target.value })} /></div><div className="space-y-2"><Label>Окончание</Label><Input type="datetime-local" value={maintenanceForm.endsAt} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, endsAt: event.target.value })} /></div></div><div className="space-y-2"><Label>Компоненты</Label><ComponentPicker components={data.components} selected={maintenanceForm.componentIds} onChange={(componentIds) => setMaintenanceForm({ ...maintenanceForm, componentIds })} /></div><div className="flex justify-end"><Button disabled={saving || !maintenanceForm.title.trim() || !maintenanceForm.description.trim() || !maintenanceForm.startsAt || !maintenanceForm.endsAt || !maintenanceForm.componentIds.length} onClick={createMaintenance}>{saving && <Loader2 className="animate-spin" size={13} />}Запланировать</Button></div></CardContent></Card>}

    <section><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-semibold">Компоненты</h3></div><span className="text-xs text-muted-foreground">{data.components.length}</span></div><div className="grid gap-3 md:grid-cols-2">{data.components.map((component: any) => <Card key={component.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{component.name}</p><p className="mt-1 text-xs text-muted-foreground">{component.group} · {component.slug}</p></div><button type="button" title={component.isVisible ? 'Скрыть компонент' : 'Показать компонент'} onClick={() => patchComponent(component.id, { isVisible: !component.isVisible })}><Eye className={cn('h-4 w-4', component.isVisible ? 'text-lime-700' : 'text-muted-foreground/35')} /></button></div><select className={`${fieldClass} mt-4`} value={component.status} onChange={(event) => patchComponent(component.id, { status: event.target.value })}>{Object.entries(componentStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></CardContent></Card>)}</div></section>

    <section><div className="mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-semibold">Инциденты</h3></div>{data.incidents.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Инцидентов пока нет</div> : <div className="space-y-4">{data.incidents.map((incident: any) => {
      const draft = updateDrafts[incident.id] ?? { status: incident.status, message: '' }
      return <Card key={incident.id}><CardHeader className="flex flex-col gap-3 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge variant={incident.status === 'RESOLVED' ? 'success' : incident.impact === 'CRITICAL' ? 'destructive' : 'warning'}>{incidentStates[incident.status]}</Badge><Badge variant={incident.isPublished ? 'outline' : 'muted'}>{incident.isPublished ? 'Публичный' : 'Черновик'}</Badge><span className="text-xs text-muted-foreground">{impactLabels[incident.impact]}</span></div><h4 className="mt-3 text-sm font-semibold">{incident.title}</h4><p className="mt-2 text-xs leading-5 text-muted-foreground">{incident.summary}</p></div><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => patchIncident(incident.id, { isPublished: !incident.isPublished })}><Eye size={13} />{incident.isPublished ? 'Скрыть' : 'Показать'}</Button><Button size="sm" variant="ghost" onClick={() => removeIncident(incident.id)}><Trash2 size={13} /></Button></div></CardHeader><CardContent className="space-y-5 p-5"><div className="flex flex-wrap gap-2">{incident.components.map((component: any) => <Badge key={component.id} variant="muted">{component.name}</Badge>)}</div><div className="border-l border-border pl-4">{incident.updates.map((update: any) => <div key={update.id} className="pb-4 last:pb-0"><div className="flex items-center gap-2"><span className="text-xs font-medium">{incidentStates[update.status]}</span><span className="text-[10px] text-muted-foreground">{new Date(update.createdAt).toLocaleString('ru-RU')}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{update.message}</p></div>)}</div>{incident.status !== 'RESOLVED' && <div className="grid gap-3 rounded-xl border border-border/50 bg-card/30 p-4 sm:grid-cols-[180px_1fr_auto] sm:items-end"><div className="space-y-2"><Label>Новый статус</Label><select className={fieldClass} value={draft.status} onChange={(event) => setUpdateDrafts((current) => ({ ...current, [incident.id]: { ...draft, status: event.target.value } }))}>{Object.entries(incidentStates).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="space-y-2"><Label>Обновление</Label><Input value={draft.message} onChange={(event) => setUpdateDrafts((current) => ({ ...current, [incident.id]: { ...draft, message: event.target.value } }))} placeholder="Что изменилось для пользователей" /></div><Button disabled={saving || !draft.message.trim()} onClick={() => addUpdate(incident)}><Send size={13} />Опубликовать</Button></div>}</CardContent></Card>
    })}</div>}</section>

    <section><div className="mb-3 flex items-center gap-2"><CalendarClock className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-semibold">Плановые работы</h3></div>{data.maintenance.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Работы не запланированы</div> : <div className="space-y-3">{data.maintenance.map((item: any) => <Card key={item.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge variant={item.status === 'IN_PROGRESS' ? 'warning' : item.status === 'COMPLETED' ? 'success' : 'muted'}>{maintenanceStates[item.status]}</Badge><span className="text-xs text-muted-foreground">{new Date(item.startsAt).toLocaleString('ru-RU')} — {new Date(item.endsAt).toLocaleString('ru-RU')}</span></div><h4 className="mt-3 text-sm font-semibold">{item.title}</h4><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.description}</p></div><div className="flex items-center gap-2"><select className={fieldClass} value={item.status} onChange={(event) => patchMaintenance(item.id, { status: event.target.value })}>{Object.entries(maintenanceStates).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Button size="sm" variant="ghost" onClick={() => removeMaintenance(item.id)}><Trash2 size={13} /></Button></div></CardContent></Card>)}</div>}</section>
  </div>
}
