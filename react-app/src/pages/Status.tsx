import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { Activity, ArrowLeft, CalendarClock, Check, ChevronDown, CircleAlert, Clock3, ExternalLink } from 'lucide-react'

const componentMeta: Record<string, { label: string; color: string; dot: string }> = {
  OPERATIONAL: { label: 'Работает', color: 'text-emerald-700', dot: 'bg-emerald-500' },
  DEGRADED: { label: 'Снижена производительность', color: 'text-amber-700', dot: 'bg-amber-400' },
  PARTIAL_OUTAGE: { label: 'Частичный сбой', color: 'text-orange-700', dot: 'bg-orange-500' },
  MAJOR_OUTAGE: { label: 'Недоступен', color: 'text-red-700', dot: 'bg-red-500' },
  MAINTENANCE: { label: 'Технические работы', color: 'text-sky-700', dot: 'bg-sky-500' },
}

const incidentStateLabels: Record<string, string> = {
  INVESTIGATING: 'Расследуем', IDENTIFIED: 'Причина найдена', MONITORING: 'Наблюдаем', RESOLVED: 'Устранён',
}

const impactLabels: Record<string, string> = { MINOR: 'Незначительное влияние', MAJOR: 'Серьёзное влияние', CRITICAL: 'Критическое влияние' }
const impactRank: Record<string, number> = { MINOR: 1, MAJOR: 2, CRITICAL: 3 }
const statusRank: Record<string, number> = { OPERATIONAL: 0, MAINTENANCE: 1, DEGRADED: 2, PARTIAL_OUTAGE: 3, MAJOR_OUTAGE: 4 }

const formatDate = (value: string, withTime = false) => new Date(value).toLocaleString('ru-RU', withTime
  ? { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }
  : { day: 'numeric', month: 'long', year: 'numeric' })

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

function historyForComponent(componentId: string, incidents: any[], maintenance: any[]) {
  const today = new Date()
  return Array.from({ length: 90 }, (_, index) => {
    const date = new Date(today)
    date.setHours(12, 0, 0, 0)
    date.setDate(today.getDate() - (89 - index))
    const end = new Date(date); end.setHours(23, 59, 59, 999)
    const start = new Date(date); start.setHours(0, 0, 0, 0)
    const dayIncidents = incidents.filter((incident) => incident.components.some((component: any) => component.id === componentId)
      && new Date(incident.publishedAt) <= end && (!incident.resolvedAt || new Date(incident.resolvedAt) >= start))
    const planned = maintenance.some((item) => item.components.some((component: any) => component.id === componentId)
      && item.status !== 'CANCELLED' && new Date(item.startsAt) <= end && new Date(item.endsAt) >= start)
    const impact = dayIncidents.sort((a, b) => impactRank[b.impact] - impactRank[a.impact])[0]?.impact
    return { key: dayKey(date), date, impact, planned }
  })
}

const Status = () => {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    document.title = 'Статус сервисов — Арлист'
    axios.get('/api/status').then((response) => setData(response.data)).catch(() => setError(true))
  }, [])

  const overall = useMemo(() => {
    if (!data) return { status: 'OPERATIONAL', title: 'Проверяем состояние сервисов' }
    const worst = [...data.components].sort((a, b) => statusRank[b.status] - statusRank[a.status])[0]?.status ?? 'OPERATIONAL'
    const titles: Record<string, string> = {
      OPERATIONAL: 'Все системы работают', MAINTENANCE: 'Проводятся технические работы', DEGRADED: 'Некоторые системы работают медленнее',
      PARTIAL_OUTAGE: 'Наблюдается частичный сбой', MAJOR_OUTAGE: 'Наблюдается серьёзный сбой',
    }
    return { status: worst, title: titles[worst] }
  }, [data])

  if (error) return <div className="flex min-h-screen items-center justify-center bg-[#f3f4ed] px-5 text-center"><div><CircleAlert className="mx-auto h-7 w-7 text-red-500" /><h1 className="mt-5 text-2xl font-semibold">Статус временно недоступен</h1><p className="mt-2 text-sm text-black/50">Мы уже проверяем соединение. Попробуйте обновить страницу позже.</p></div></div>
  if (!data) return <div className="flex min-h-screen items-center justify-center bg-[#f3f4ed]"><Activity className="h-6 w-6 animate-pulse text-black/35" /></div>

  const grouped = data.components.reduce((acc: Record<string, any[]>, component: any) => {
    (acc[component.group] ??= []).push(component)
    return acc
  }, {})
  const allIncidents = [...data.activeIncidents, ...data.incidentHistory]
  const upcomingMaintenance = data.maintenance.filter((item: any) => ['SCHEDULED', 'IN_PROGRESS'].includes(item.status))

  return <div className="status-page min-h-screen bg-[#f3f4ed] text-[#161815]">
    <header className="border-b border-black/10 bg-[#f3f4ed]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between px-5 sm:px-8">
        <Link to="/" className="font-brand text-base font-semibold lowercase tracking-[-0.07em]">арлист статус</Link>
        <Link to="/" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-black/45 hover:text-black"><ArrowLeft className="h-3.5 w-3.5" /> arlist.ru</Link>
      </div>
    </header>

    <main className="mx-auto max-w-[1120px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
      <section className={`rounded-[28px] border p-6 sm:p-9 ${overall.status === 'OPERATIONAL' ? 'border-emerald-800/15 bg-[#e6f3d8]' : overall.status === 'MAINTENANCE' ? 'border-sky-700/15 bg-sky-50' : 'border-amber-700/20 bg-amber-50'}`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${componentMeta[overall.status].dot} text-white`}>{overall.status === 'OPERATIONAL' ? <Check className="h-5 w-5" /> : overall.status === 'MAINTENANCE' ? <CalendarClock className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}</span>
            <div><h1 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{overall.title}</h1><p className="mt-2 text-sm text-black/50">Актуальное состояние сервисов Арлист</p></div>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">Обновлено {formatDate(data.updatedAt, true)}</p>
        </div>
      </section>

      {data.activeIncidents.length > 0 && <section className="mt-12">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold tracking-[-0.03em]">Активные инциденты</h2><span className="rounded-full bg-red-500/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-red-700">{data.activeIncidents.length} активных</span></div>
        <div className="space-y-4">{data.activeIncidents.map((incident: any) => <article key={incident.id} className="rounded-[22px] border border-red-900/15 bg-white/65 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.13em]"><span className="text-red-700">{impactLabels[incident.impact]}</span><span className="text-black/30">•</span><span className="text-black/45">{incidentStateLabels[incident.status]}</span></div>
          <h3 className="mt-4 text-xl font-semibold tracking-[-0.035em]">{incident.title}</h3><p className="mt-3 max-w-3xl text-sm leading-6 text-black/55">{incident.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">{incident.components.map((component: any) => <span key={component.id} className="rounded-full border border-black/10 px-2.5 py-1 text-xs text-black/50">{component.name}</span>)}</div>
          <div className="mt-7 border-l border-black/12 pl-5">{incident.updates.map((update: any) => <div key={update.id} className="relative pb-6 last:pb-0"><span className="absolute -left-[23px] top-1.5 h-1.5 w-1.5 rounded-full bg-black/35" /><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-medium">{incidentStateLabels[update.status]}</span><span className="text-xs text-black/35">{formatDate(update.createdAt, true)}</span></div><p className="mt-2 text-sm leading-6 text-black/55">{update.message}</p></div>)}</div>
        </article>)}</div>
      </section>}

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between"><div><h2 className="text-xl font-semibold tracking-[-0.03em]">Компоненты</h2><p className="mt-1 text-sm text-black/45">Состояние и история за последние 90 дней</p></div><div className="hidden items-center gap-2 text-xs text-black/40 sm:flex"><span>90 дней назад</span><span className="h-px w-12 bg-black/15" /><span>Сегодня</span></div></div>
        <div className="overflow-hidden rounded-[22px] border border-black/10 bg-white/55">{Object.entries(grouped).map(([group, components]: [string, any]) => <div key={group} className="border-b border-black/10 last:border-0">
          <div className="bg-black/[0.025] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-black/38 sm:px-7">{group}</div>
          {components.map((component: any) => {
            const days = historyForComponent(component.id, allIncidents, data.maintenance)
            return <div key={component.id} className="border-t border-black/[0.07] px-5 py-5 first:border-0 sm:px-7">
              <div className="flex items-start justify-between gap-5"><div><h3 className="text-sm font-medium">{component.name}</h3>{component.description && <p className="mt-1 text-xs text-black/38">{component.description}</p>}</div><div className={`flex shrink-0 items-center gap-2 text-xs ${componentMeta[component.status].color}`}><span className={`h-2 w-2 rounded-full ${componentMeta[component.status].dot}`} />{componentMeta[component.status].label}</div></div>
              <div className="uptime-grid mt-4">{days.map((day) => <span key={day.key} title={`${formatDate(day.date.toISOString())}: ${day.impact ? impactLabels[day.impact] : day.planned ? 'Технические работы' : 'Работал штатно'}`} className={day.impact === 'CRITICAL' ? 'bg-red-500' : day.impact === 'MAJOR' ? 'bg-orange-400' : day.impact === 'MINOR' ? 'bg-amber-300' : day.planned ? 'bg-sky-300' : 'bg-emerald-400'} />)}</div>
            </div>
          })}
        </div>)}</div>
      </section>

      {upcomingMaintenance.length > 0 && <section className="mt-12"><div className="mb-5 flex items-center gap-3"><CalendarClock className="h-5 w-5 text-sky-700" /><h2 className="text-xl font-semibold tracking-[-0.03em]">Плановые работы</h2></div><div className="space-y-3">{upcomingMaintenance.map((item: any) => <article key={item.id} className="rounded-[20px] border border-sky-800/15 bg-sky-50/70 p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.14em] text-sky-700">{item.status === 'IN_PROGRESS' ? 'Идут сейчас' : 'Запланировано'}</p><h3 className="mt-2 font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-black/50">{item.description}</p></div><div className="shrink-0 text-xs leading-5 text-black/45"><p>{formatDate(item.startsAt, true)}</p><p>до {formatDate(item.endsAt, true)}</p></div></div></article>)}</div></section>}

      <section className="mt-12"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold tracking-[-0.03em]">История инцидентов</h2><span className="font-mono text-[9px] uppercase tracking-[.14em] text-black/35">Последние 90 дней</span></div>
        {data.incidentHistory.length === 0 ? <div className="rounded-[20px] border border-dashed border-black/15 p-8 text-center"><Check className="mx-auto h-5 w-5 text-emerald-600" /><p className="mt-3 text-sm font-medium">Инцидентов не было</p><p className="mt-1 text-xs text-black/40">За последние 90 дней опубликованных сбоев нет.</p></div> : <div className="divide-y divide-black/10 overflow-hidden rounded-[20px] border border-black/10 bg-white/50">{data.incidentHistory.map((incident: any) => <details key={incident.id} className="group p-5 sm:p-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2 text-xs text-black/38"><span>{formatDate(incident.publishedAt)}</span><span>•</span><span>{impactLabels[incident.impact]}</span></div><h3 className="mt-2 text-sm font-medium">{incident.title}</h3></div><ChevronDown className="h-4 w-4 shrink-0 text-black/35 transition-transform group-open:rotate-180" /></summary><p className="mt-4 text-sm leading-6 text-black/50">{incident.summary}</p><div className="mt-4 flex flex-wrap gap-2">{incident.components.map((component: any) => <span key={component.id} className="text-xs text-black/40">{component.name}</span>)}</div></details>)}</div>}
      </section>
    </main>

    <footer className="border-t border-black/10"><div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-5 py-8 text-xs text-black/38 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p>© 2026 Арлист Тех</p><div className="flex items-center gap-5"><a href="mailto:hello@arlist.ru" className="flex items-center gap-1 hover:text-black">Сообщить о проблеме <ExternalLink className="h-3 w-3" /></a><span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> Europe/Moscow</span></div></div></footer>
  </div>
}

export default Status
