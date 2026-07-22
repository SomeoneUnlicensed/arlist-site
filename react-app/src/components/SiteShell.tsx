import { useState, type ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const publicLinks = [
  { to: '/products', label: 'Продукты' },
  { to: '/forEdu', label: 'Для людей' },
  { to: '/docs', label: 'API' },
  { to: '/contacts', label: 'Контакты' },
  { to: '/status', label: 'Статус' },
  { to: '/login', label: 'Вход' },
]

export const PublicHeader = () => {
  const [open, setOpen] = useState(false)

  return <header className="relative z-30 border-b border-[#171817]/[0.06] md:border-0">
    <div className="mx-auto flex h-20 max-w-[1540px] items-center justify-between px-5 sm:h-24 sm:px-8 lg:px-12">
      <Link to="/" className="font-brand text-sm font-semibold lowercase tracking-[-0.07em] sm:text-base">арлист тех</Link>
      <nav className="hidden items-center gap-7 text-[11px] font-medium uppercase tracking-[0.1em] md:flex lg:gap-10 xl:gap-14">
        {publicLinks.map((item) => <Link key={item.to} to={item.to} className="transition-opacity hover:opacity-50">{item.label}</Link>)}
      </nav>
      <button type="button" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 py-2 font-mono text-[10px] uppercase tracking-[0.14em] md:hidden">
        {open ? 'Закрыть' : 'Меню'}
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>
    </div>
    {open && <nav id="mobile-navigation" className="absolute left-0 right-0 top-full border-y border-[#171817]/10 bg-[#f5f7e9]/95 px-5 py-3 shadow-[0_24px_60px_rgba(23,24,23,0.12)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-[1540px] flex-col divide-y divide-[#171817]/10">
        {publicLinks.map((item, index) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className={`flex items-center justify-between py-4 text-sm font-medium uppercase tracking-[0.08em] ${index === publicLinks.length - 1 ? 'font-semibold' : ''}`}><span>{item.label}</span><span className="font-mono text-[10px] text-[#171817]/35">0{index + 1}</span></Link>)}
      </div>
    </nav>}
  </header>
}

export const SiteShell = ({ children }: { children: ReactNode }) => (
  <div className="public-page min-h-screen overflow-hidden bg-[#edf3df] text-[#171817]">
    <div className="public-page__glow" aria-hidden="true" />
    <PublicHeader />
    <main className="relative z-10">{children}</main>
    <footer className="relative z-10 border-t border-[#171817]/12 bg-[#f8f6e9]/55">
      <div className="mx-auto grid max-w-[1540px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:px-12">
        <div>
          <Link to="/" className="font-brand text-sm font-semibold lowercase tracking-[-0.07em]">арлист тех</Link>
          <p className="mt-4 text-sm text-[#171817]/45">© 2026 АРЛИСТ ТЕХ. Все права защищены.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#171817]/38">Сервисы</span><a href="https://leetcot.ru" className="hover:opacity-50">ЛитКот</a></div>
          <div className="flex flex-col gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#171817]/38">Компания</span><Link to="/forEdu" className="hover:opacity-50">Для людей</Link><Link to="/contacts" className="hover:opacity-50">Контакты</Link><Link to="/docs" className="hover:opacity-50">API</Link></div>
          <div className="flex flex-col gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#171817]/38">Право</span><Link to="/legal" className="hover:opacity-50">Документы</Link><Link to="/privacy-policy" className="hover:opacity-50">Приватность</Link><Link to="/status" className="hover:opacity-50">Статус</Link></div>
        </div>
      </div>
    </footer>
  </div>
)

export const PageHero = ({ eyebrow, title, lead }: { eyebrow: string; title: ReactNode; lead: string }) => (
  <section className="mx-auto max-w-[1540px] px-5 pb-16 pt-20 sm:px-8 sm:pb-24 sm:pt-28 lg:px-12">
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#171817]/45">{eyebrow}</p>
    <h1 className="mt-7 max-w-6xl text-[clamp(2.65rem,7vw,7.7rem)] font-semibold leading-[0.91] tracking-[-0.075em]">{title}</h1>
    <p className="mt-8 max-w-2xl text-lg leading-8 text-[#171817]/62 sm:text-xl">{lead}</p>
  </section>
)

export const SectionLabel = ({ number, children }: { number: string; children: ReactNode }) => (
  <div className="mb-6 flex items-center justify-between">
    <h2 className="text-xl font-semibold tracking-[-0.04em] sm:text-2xl">{children}</h2>
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#171817]/40">{number}</span>
  </div>
)
