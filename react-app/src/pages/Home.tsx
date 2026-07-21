import { useEffect } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PublicHeader } from '@/components/SiteShell'

const ArrowButton = () => (
  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#171817]/35 transition-all duration-300 group-hover:-rotate-12 group-hover:bg-[#171817] group-hover:text-white sm:h-14 sm:w-14">
    <ArrowUpRight className="h-5 w-5" strokeWidth={1.5} />
  </span>
)

const Home = () => {
  useEffect(() => {
    document.title = 'Арлист Тех — сервисы для людей'
  }, [])

  return (
    <div className="arlist-home min-h-screen overflow-hidden bg-[#edf3df] text-[#171817]">
      <div className="arlist-home__glow" aria-hidden="true" />

      <PublicHeader />

      <main className="relative z-10">
        <section className="mx-auto max-w-[1540px] px-5 pb-16 pt-20 sm:px-8 sm:pb-16 sm:pt-20 lg:px-12">
          <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.2em] text-[#171817]/48">Честные технологии</p>
          <h1 className="max-w-[1450px] text-[clamp(2.65rem,8vw,8.7rem)] font-semibold leading-[0.9] tracking-[-0.075em]">
            Сервисы для людей,
            <span className="block">а не ради лозунгов.</span>
          </h1>
          <p className="mt-9 max-w-md text-lg leading-7 tracking-[-0.025em] text-[#171817]/70 sm:mt-12 sm:text-xl sm:leading-8">
            Мы создаём программное обеспечение, которое уважает пользователя.
          </p>
        </section>

        <section id="companies" className="mx-auto max-w-[1540px] scroll-mt-10 px-5 pb-6 sm:px-8 lg:px-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-[-0.04em] sm:text-xl">Наши компании</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#171817]/40">01 / Группа</span>
          </div>
          <a href="https://zbr.arlist.ru" target="_blank" rel="noreferrer" className="group grid min-h-28 items-center gap-5 rounded-[22px] border border-[#171817]/15 bg-[#fafaf1]/80 px-5 py-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#d5683f]/45 hover:bg-[#fffdf4] sm:grid-cols-[1fr_1fr_auto] sm:px-8">
            <div className="flex items-center gap-5">
              <span className="h-5 w-5 rounded-full bg-[#ef6a28] shadow-[0_0_24px_rgba(239,106,40,0.28)]" />
              <span className="text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">Зебра</span>
            </div>
            <p className="max-w-xs text-sm leading-5 text-[#171817]/65 sm:text-base sm:leading-6">Дизайн и разработка<br className="hidden sm:block" /> полного цикла</p>
            <ArrowButton />
          </a>
        </section>

        <section id="products" className="mx-auto max-w-[1540px] scroll-mt-10 px-5 pb-24 pt-6 sm:px-8 sm:pb-32 lg:px-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-[-0.04em] sm:text-xl">Продукты</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#171817]/40">02 / Решения</span>
          </div>
          <div className="space-y-3">
            <a href="https://leetcot.ru" target="_blank" rel="noreferrer" className="group grid min-h-28 items-center gap-5 rounded-[22px] border border-[#171817]/15 bg-[#fafaf1]/80 px-5 py-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#171817]/35 hover:bg-[#fffdf4] sm:grid-cols-[1fr_1fr_auto] sm:px-8">
              <span className="text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">ЛитКот</span>
              <p className="max-w-sm text-sm leading-5 text-[#171817]/65 sm:text-base sm:leading-6">Разминай лапки и мозги! Платформа для тех, кто хочет щелкать алгоритмы как рыбку и готовиться к интервью с кошачьей грацией.</p>
              <ArrowButton />
            </a>
            <div className="group grid min-h-28 items-center gap-5 rounded-[22px] border border-[#171817]/10 bg-[#fafaf1]/45 px-5 py-6 sm:grid-cols-[1fr_1fr_auto] sm:px-8">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">АналитиКит</span>
                <span className="rounded-full border border-[#171817]/15 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#171817]/45">В разработке</span>
              </div>
              <p className="max-w-sm text-sm leading-5 text-[#171817]/55 sm:text-base sm:leading-6">Глубокая аналитика данных и китов. Понимайте скрытые паттерны в огромных массивах информации.</p>
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#171817]/15 text-[#171817]/35 sm:h-14 sm:w-14">—</span>
            </div>
          </div>
        </section>

      </main>

      <footer className="relative z-10 mx-auto grid max-w-[1540px] gap-12 border-t border-[#171817]/12 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:px-12">
        <div>
          <p className="font-brand text-sm font-semibold lowercase tracking-[-0.07em]">арлист тех</p>
          <pre className="mt-10 font-mono text-[10px] leading-[1.25] text-[#171817]/28">{`  _._     _,-'""\`-._
 (,-.\`._,'(       |\\\`-/|
     \`-.-' \\ )-\`( , o o)
           \`-    \\\`_\`"'-`}</pre>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#171817]/38">Сервисы</span><a href="https://leetcot.ru" className="hover:opacity-50">ЛитКот</a></div>
          <div className="flex flex-col gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#171817]/38">Компания</span><Link to="/forEdu" className="hover:opacity-50">Для людей</Link><Link to="/contacts" className="hover:opacity-50">Контакты</Link><Link to="/docs" className="hover:opacity-50">API</Link></div>
          <div className="flex flex-col gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#171817]/38">Право</span><Link to="/legal" className="hover:opacity-50">Документы</Link><Link to="/privacy-policy" className="hover:opacity-50">Приватность</Link><Link to="/transparency" className="hover:opacity-50">Прозрачность</Link></div>
        </div>
        <p className="text-xs text-[#171817]/40 lg:col-span-2">© 2026 АРЛИСТ ТЕХ. Все права защищены.</p>
      </footer>
    </div>
  )
}

export default Home
