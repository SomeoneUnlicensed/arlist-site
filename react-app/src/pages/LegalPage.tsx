import { useEffect } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHero, SiteShell } from '@/components/SiteShell'

export const LegalPage = () => {
  useEffect(() => { document.title = 'Документы — Арлист Тех' }, [])

  const documents = [
    { title: 'Политика конфиденциальности Arlist ID', description: 'Политика обработки персональных данных', date: '20.06.2026', href: '/privacy-policy' },
    { title: 'Политика конфиденциальности (Geotekt)', description: 'Защита ваших данных в сервисе Geotekt', date: '17.03.2026', href: '/legal/geotekt-policies' },
    { title: 'Манифест Арлист', description: 'Против импортозамещения «для галочки»', date: '2026', href: '/promo/manifest' },
  ]

  return <SiteShell>
    <PageHero eyebrow="Правовая информация" title="Документация и соглашения" lead="Политики обработки данных, правила сервисов и архив редакций." />
    <section className="mx-auto max-w-[1540px] space-y-3 px-5 pb-32 sm:px-8 lg:px-12">
      {documents.map((document) => <Link key={document.title} to={document.href} className="group grid items-center gap-5 rounded-[22px] border border-[#171817]/14 bg-[#fafaf1]/78 p-6 transition-transform hover:-translate-y-1 sm:grid-cols-[1fr_auto_auto] sm:p-8">
        <div><h2 className="text-xl font-semibold tracking-[-0.04em]">{document.title}</h2><p className="mt-2 text-sm text-[#171817]/55">{document.description}</p></div>
        <span className="font-mono text-[10px] text-[#171817]/38">{document.date}</span>
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#171817]/25 group-hover:bg-[#171817] group-hover:text-white"><ArrowUpRight className="h-4 w-4" /></span>
      </Link>)}
    </section>
  </SiteShell>
}
