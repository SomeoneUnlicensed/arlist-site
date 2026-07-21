import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { transparencyMeta } from '@/content/transparency'

const severityLabels: Record<string, string> = {
  CRITICAL: 'Критический',
  HIGH: 'Высокий',
  MEDIUM: 'Средний',
  LOW: 'Низкий',
}

const statusLabels: Record<string, string> = {
  INVESTIGATING: 'Расследуем',
  IDENTIFIED: 'Причина найдена',
  MONITORING: 'Наблюдаем',
  RESOLVED: 'Устранён',
}

const formatDate = (value: string) => new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

const Transparency = () => {
  const [entries, setEntries] = useState<any[]>([])

  useEffect(() => {
    document.title = 'Центр прозрачности — Арлист'
    axios.get('/api/transparency').then((response) => setEntries(response.data)).catch(() => setEntries([]))
  }, [])

  const incidents = entries.filter((entry) => entry.type === 'INCIDENT')
  const securityAdvisories = entries.filter((entry) => entry.type === 'ADVISORY')
  const hasActiveIncidents = incidents.some((incident) => incident.status !== 'RESOLVED')
  const lastUpdated = entries.length ? formatDate(entries[0].updatedAt) : transparencyMeta.lastUpdated
  const reportHref = useMemo(() => {
    const subject = encodeURIComponent('Сообщение о безопасности Arlist')
    const body = encodeURIComponent('Сервис:\n\nВремя обнаружения:\n\nЧто произошло:\n\nКак воспроизвести:\n\nКонтакт для ответа:\n')
    return `mailto:${transparencyMeta.contactEmail}?subject=${subject}&body=${body}`
  }, [])

  return (
    <div className="transparency-page min-h-screen bg-[#030303] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/75 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-[1540px] items-center justify-between gap-6 px-5 sm:px-8 lg:h-24 lg:px-12">
          <Link to="/" className="shrink-0 font-brand text-sm font-semibold lowercase tracking-[-0.07em] text-white sm:text-base">
            арлист тех
          </Link>
          <nav className="ml-auto flex min-w-0 shrink items-center justify-end gap-5 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.16em] text-white/55 sm:gap-8">
            <a href="#reports" className="hidden transition-colors hover:text-white md:block">Отчёты</a>
            <a href="#principles" className="hidden transition-colors hover:text-white lg:block">Принципы</a>
            <a href={reportHref} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-2 transition-colors hover:text-white">
              <span className="hidden sm:inline">Сообщить о проблеме</span>
              <span className="sm:hidden">Сообщить</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="transparency-glow" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
            <div className="mb-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-300/80">
              <ShieldCheck className="h-4 w-4" />
              Центр прозрачности
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.065em] sm:text-7xl lg:text-[92px]">
              Доверие требует
              <span className="block bg-gradient-to-r from-white via-sky-200 to-emerald-200 bg-clip-text text-transparent">честного отчёта.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
              Здесь мы публикуем подтверждённые инциденты, их влияние на сервисы Арлист,
              ход устранения и рекомендации по безопасности. Без маркетинговых формулировок.
            </p>

            <div className={`mt-12 flex max-w-2xl items-start gap-4 border p-5 ${hasActiveIncidents ? 'border-amber-300/25 bg-amber-300/[0.06]' : 'border-emerald-300/20 bg-emerald-300/[0.05]'}`}>
              {hasActiveIncidents ? <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />}
              <div>
                <p className="text-sm font-medium">{hasActiveIncidents ? 'Есть активные инциденты' : 'Активных инцидентов не опубликовано'}</p>
                <p className="mt-1 text-sm leading-6 text-white/45">Последнее обновление реестра: {lastUpdated}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="reports" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.6fr]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">01 / Публикации</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Инциденты и предупреждения</h2>
              <p className="mt-5 text-sm leading-6 text-white/45">Новые записи появляются сверху. У каждой есть дата, затронутые сервисы, влияние и принятые меры.</p>
            </div>

            <div className="space-y-5">
              {incidents.map((incident) => (
                <article key={incident.id} className="group border border-white/10 bg-white/[0.025] p-6 transition-colors hover:border-white/20 sm:p-8">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em]">
                    <span className="text-white/35">{formatDate(incident.publishedAt)}</span>
                    <span className="border border-white/10 px-2 py-1 text-white/55">{severityLabels[incident.severity]}</span>
                    <span className="text-emerald-300/80">{statusLabels[incident.status]}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-medium tracking-tight">{incident.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/50">{incident.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {incident.affectedServices.map((service: string) => <span key={service} className="bg-white/[0.06] px-2.5 py-1 font-mono text-[10px] text-white/50">{service}</span>)}
                  </div>
                </article>
              ))}

              {securityAdvisories.map((advisory) => (
                <article key={advisory.id} className="border border-sky-300/15 bg-sky-300/[0.035] p-6 sm:p-8">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-sky-200/70">
                    <CircleAlert className="h-4 w-4" /> Предупреждение · {formatDate(advisory.publishedAt)}
                  </div>
                  <h3 className="mt-5 text-xl font-medium tracking-tight">{advisory.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/50">{advisory.summary}</p>
                  <p className="mt-5 border-l border-sky-200/30 pl-4 text-sm leading-6 text-white/70">{advisory.recommendation}</p>
                </article>
              ))}

              {incidents.length === 0 && securityAdvisories.length === 0 && (
                <div className="flex min-h-64 flex-col justify-between border border-dashed border-white/15 bg-white/[0.015] p-6 sm:p-8">
                  <div className="flex h-11 w-11 items-center justify-center border border-white/10 bg-white/[0.04]">
                    <FileCheck2 className="h-5 w-5 text-white/50" />
                  </div>
                  <div className="mt-16">
                    <h3 className="text-xl font-medium tracking-tight">Реестр пока пуст</h3>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-white/45">Подтверждённых инцидентов и актуальных предупреждений для публикации сейчас нет. История будущих записей останется доступна после их устранения.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="principles" className="border-y border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">02 / Наш стандарт</p>
            <div className="mt-10 grid divide-y divide-white/10 border-y border-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
              {[
                { icon: Clock3, number: '01', title: 'Сообщаем вовремя', text: 'Публикуем подтверждённую информацию по мере развития ситуации и отмечаем время обновлений.' },
                { icon: FileCheck2, number: '02', title: 'Фиксируем факты', text: 'Описываем реальное влияние, затронутые сервисы и действия команды без догадок и преуменьшения.' },
                { icon: ShieldCheck, number: '03', title: 'Разбираем причины', text: 'После устранения добавляем итог, причины и меры, которые снижают риск повторения.' },
              ].map(({ icon: Icon, number, title, text }) => (
                <div key={number} className="p-7 first:pl-0 last:pr-0 md:px-8">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-white/55" />
                    <span className="font-mono text-[10px] text-white/25">{number}</span>
                  </div>
                  <h3 className="mt-12 text-lg font-medium">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/45">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid gap-10 border border-white/10 bg-gradient-to-br from-white/[0.055] to-transparent p-7 sm:p-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div>
              <Mail className="h-6 w-6 text-emerald-200/70" />
              <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">Заметили проблему безопасности?</h2>
              <p className="mt-5 max-w-xl text-sm leading-6 text-white/50">Опишите сервис, ожидаемое и фактическое поведение, время обнаружения и способ воспроизведения. Не публикуйте уязвимость до нашего ответа.</p>
              <p className="mt-4 font-mono text-xs text-emerald-200/70">Напишите на {transparencyMeta.contactEmail}</p>
            </div>
            <a href={reportHref} target="_blank" rel="noreferrer" className="flex items-center justify-between border border-white/15 bg-white px-5 py-4 text-sm font-medium text-black transition-transform hover:-translate-y-0.5">
              Написать письмо
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 Арлист Тех</p>
          <Link to="/privacy-policy" className="flex items-center gap-1 transition-colors hover:text-white">Политика конфиденциальности <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </footer>
    </div>
  )
}

export default Transparency
