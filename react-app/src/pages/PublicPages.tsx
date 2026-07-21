import { useEffect, type ReactNode } from 'react'
import { ArrowUpRight, Copy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHero, SectionLabel, SiteShell } from '@/components/SiteShell'

const usePageTitle = (title: string) => useEffect(() => { document.title = `${title} — Арлист Тех` }, [title])

const Panel = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-[24px] border border-[#171817]/14 bg-[#fafaf1]/78 p-6 backdrop-blur-md sm:p-8 ${className}`}>{children}</div>
)

const OutLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 border-b border-[#171817]/25 pb-1 font-mono text-[10px] uppercase tracking-[0.16em] hover:border-[#171817]">
    {children}<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
  </a>
)

export const ProductsPage = () => {
  usePageTitle('Продукты')
  const products = [
    { title: 'ЛитКот', description: 'Разминай лапки и мозги! Платформа для тех, кто хочет щёлкать алгоритмы как рыбку.', href: 'https://leetcot.ru', status: 'Работает' },
    { title: 'Гейт', description: 'Универсальный API-шлюз для ваших сервисов. Вход свободный, выход — по правилам.', status: 'В разработке' },
    { title: 'АналитиКит', description: 'Глубокая аналитика данных и котиков. Понимайте скрытые паттерны.', status: 'В разработке' },
  ]
  return <SiteShell>
    <PageHero eyebrow="Наши решения" title="Продукты, которые работают для вас." lead="Мы создаём экосистему спокойных цифровых сервисов без лишней бюрократии." />
    <section className="mx-auto max-w-[1540px] px-5 pb-32 sm:px-8 lg:px-12">
      <SectionLabel number="01 / Продукты">Наши решения</SectionLabel>
      <div className="space-y-3">{products.map((product) => {
        const content = <><div><div className="mb-5 flex items-center gap-3"><span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#171817]/42">{product.status}</span></div><h2 className="text-3xl font-semibold tracking-[-0.055em] sm:text-5xl">{product.title}</h2></div><p className="max-w-md leading-7 text-[#171817]/62">{product.description}</p><span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#171817]/25">{product.href ? <ArrowUpRight className="h-5 w-5" /> : '—'}</span></>
        const cls = "group grid min-h-40 items-center gap-7 rounded-[24px] border border-[#171817]/14 bg-[#fafaf1]/78 p-6 transition-all hover:-translate-y-1 hover:bg-[#fffdf4] sm:grid-cols-[1fr_1fr_auto] sm:p-8"
        return product.href ? <a key={product.title} href={product.href} target="_blank" rel="noreferrer" className={cls}>{content}</a> : <div key={product.title} className={cls}>{content}</div>
      })}</div>
    </section>
  </SiteShell>
}

export const EducationPage = () => {
  usePageTitle('Для людей')
  return <SiteShell>
    <PageHero eyebrow="Поддержка будущего" title={<>Инструменты профессионалов <span className="text-[#171817]/38">в руках студентов.</span></>} lead="Мы верим, что доступ к качественным инструментам разработки — это право, а не привилегия. Арлист помогает новому поколению инженеров создавать великое уже сегодня." />
    <section className="mx-auto max-w-[1540px] px-5 pb-32 sm:px-8 lg:px-12">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel><pre className="mb-7 font-mono text-xs text-[#171817]/35">{'  /\\_/\\\n ( ^.^ )\n  > ^ <'}</pre><h2 className="text-3xl font-semibold tracking-[-0.05em]">Платформа «ЛитКот»</h2><p className="mt-5 max-w-xl leading-7 text-[#171817]/62">Специальная песочница для будущих техлидов. Точим когти об сложные алгоритмы и готовимся к собесам в топовые компании. Никакой скуки, только чистый азарт охоты за оффером.</p><div className="mt-8"><OutLink href="https://leetcot.ru">Поймать мышку (задачу)</OutLink></div></Panel>
        <Panel><h2 className="text-3xl font-semibold tracking-[-0.05em]">Развитие экосистемы</h2><p className="mt-5 max-w-xl leading-7 text-[#171817]/62">В ближайшее время мы расширим программу на все наши сервисы, включая инструменты защиты данных и нейросетевые модели.</p></Panel>
      </div>
      <Panel className="mt-4"><h2 className="text-3xl font-semibold tracking-[-0.05em]">Хотите получить доступ?</h2><p className="mt-4 text-[#171817]/62">Напишите нам, расскажите о своём учебном заведении или проекте.</p><a href="mailto:hello@arlist.ru" className="mt-8 inline-block text-2xl font-semibold tracking-[-0.04em] hover:opacity-55">hello@arlist.ru</a></Panel>
    </section>
  </SiteShell>
}

export const ContactsPage = () => {
  usePageTitle('Контакты')
  const contacts = [
    ['Общие вопросы', 'Общие вопросы, предложения о сотрудничестве и приветы.'],
    ['Правовые вопросы', 'Запросы по данным и официальная связь.'],
  ]
  return <SiteShell><PageHero eyebrow="Контакты" title="На связи." lead="Пишите напрямую — без форм и корпоративных лабиринтов." /><section className="mx-auto grid max-w-[1540px] gap-4 px-5 pb-32 sm:px-8 lg:grid-cols-2 lg:px-12">{contacts.map(([title, description]) => <Panel key={title}><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#171817]/42">{title}</p><a href="mailto:hello@arlist.ru" className="mt-7 block text-2xl font-semibold tracking-[-0.04em] sm:text-4xl">hello@arlist.ru</a><p className="mt-5 max-w-sm leading-7 text-[#171817]/58">{description}</p></Panel>)}</section></SiteShell>
}

const Code = ({ children }: { children: ReactNode }) => <pre className="my-5 overflow-x-auto rounded-2xl bg-[#171817] p-5 font-mono text-xs leading-6 text-[#eef2e3]"><code>{children}</code></pre>
const DocSection = ({ id, title, children }: { id: string; title: ReactNode; children: ReactNode }) => <section id={id} className="scroll-mt-28 border-t border-[#171817]/12 py-9 first:border-0 first:pt-0"><h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{title}</h2><div className="mt-5 space-y-4 leading-7 text-[#171817]/65">{children}</div></section>

export const DocsPage = () => {
  usePageTitle('API')
  return <SiteShell><PageHero eyebrow="Разработчикам" title="Arlist API" lead="Документация по серверному API партнёрских сервисов и по авторизации через Arlist ID (OpenID Connect)." />
    <div className="mx-auto grid max-w-[1540px] gap-8 px-5 pb-32 sm:px-8 lg:grid-cols-[250px_1fr] lg:px-12">
      <aside className="h-fit rounded-[20px] border border-[#171817]/12 bg-[#fafaf1]/65 p-5 lg:sticky lg:top-8"><p className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[#171817]/42">Содержание</p>{[['oidc-overview','Обзор OIDC'],['oidc-endpoints','Endpoints'],['oidc-flow','Code + PKCE'],['oidc-scopes','Scopes и claims'],['oidc-example','Пример Auth.js'],['api-overview','API'],['api-auth','Аутентификация'],['api-users-id','GET /users/:id'],['api-users-email','GET /users/by-email'],['api-errors','Ошибки']].map(([id,label]) => <a key={id} href={`#${id}`} className="block py-1.5 text-sm text-[#171817]/58 hover:text-[#171817]">{label}</a>)}</aside>
      <article className="rounded-[24px] border border-[#171817]/14 bg-[#fafaf1]/78 p-6 sm:p-10">
        <DocSection id="oidc-overview" title="Arlist ID — обзор"><p>Arlist ID — OpenID Connect провайдер. Партнёрские сервисы могут использовать его для единого входа без отдельной регистрации пользователей.</p><p>Discovery: <code>https://arlist.ru/.well-known/openid-configuration</code>. Настраивайте клиентов через issuer, а не через вручную заданные пути.</p></DocSection>
        <DocSection id="oidc-endpoints" title="Endpoints"><Code>{`Authorization  /auth\nToken          /token\nUserInfo       /me\nJWKS           /jwks`}</Code><p>Все пути указаны относительно <code>https://arlist.ru</code>.</p></DocSection>
        <DocSection id="oidc-flow" title="Authorization Code Flow + PKCE"><p>Поддерживается <code>response_type=code</code> с обязательным PKCE S256.</p><h3 className="font-semibold text-[#171817]">1. Редирект пользователя</h3><Code>{`GET https://arlist.ru/auth?\n  client_id=...&redirect_uri=...&\n  response_type=code&scope=openid%20profile%20email&\n  code_challenge=...&code_challenge_method=S256&state=...`}</Code><h3 className="font-semibold text-[#171817]">2. Обмен code на токены</h3><Code>{`POST https://arlist.ru/token\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=authorization_code&code=...&redirect_uri=...&code_verifier=...`}</Code><h3 className="font-semibold text-[#171817]">3. Получение профиля</h3><Code>{`GET https://arlist.ru/me\nAuthorization: Bearer <access_token>`}</Code></DocSection>
        <DocSection id="oidc-scopes" title="Scopes и claims"><p><code>openid</code> — идентификатор пользователя; <code>profile</code> — имя; <code>email</code> — email и статус подтверждения. Scope <code>internal</code> доступен только доверенным клиентам.</p></DocSection>
        <DocSection id="oidc-example" title="Пример подключения (Auth.js / NextAuth)"><Code>{`Arlist: {\n  id: "arlist",\n  name: "Arlist",\n  type: "oidc",\n  issuer: "https://arlist.ru",\n  clientId: process.env.ARLIST_CLIENT_ID,\n  clientSecret: process.env.ARLIST_CLIENT_SECRET,\n}`}</Code><p>Auth.js получает endpoint’ы из discovery-документа и выполняет PKCE автоматически.</p></DocSection>
        <DocSection id="api-overview" title="Arlist API — обзор"><p>Серверный API позволяет доверенным партнёрам получать данные пользователей.</p><p><strong>Base URL:</strong> <code>https://arlist.ru/api/v1</code></p></DocSection>
        <DocSection id="api-auth" title="Аутентификация"><p>Используйте Basic Auth с выданными <code>client_id</code> и <code>client_secret</code>.</p><Code>Authorization: Basic base64(client_id:client_secret)</Code></DocSection>
        <DocSection id="api-users-id" title="GET /users/:id"><p>Возвращает публичные данные пользователя по внутреннему ID.</p><Code>{`GET /api/v1/users/cuid123abc\nAuthorization: Basic ...\n\n{ "id": "cuid123abc", "name": "Имя", "email": "user@example.com" }`}</Code></DocSection>
        <DocSection id="api-users-email" title="GET /users/by-email/:email"><p>Поиск пользователя по email. Формат ответа совпадает с <code>/users/:id</code>.</p><Code>GET /api/v1/users/by-email/user%40example.com</Code></DocSection>
        <DocSection id="api-errors" title="Ошибки"><Code>{`400  Некорректный запрос\n401  Нет авторизации\n403  Недостаточно прав\n404  Пользователь не найден\n429  Превышен лимит`}</Code><p>Тело ошибки: <code>{'{ "error": "..." }'}</code>.</p></DocSection>
      </article>
    </div>
  </SiteShell>
}

export const LandingsPage = () => { usePageTitle('Лендинги'); return <SiteShell><PageHero eyebrow="Лаборатория" title="Предпросмотр лендингов" lead="Страницы продуктов, которые ещё находятся в разработке." /><section className="mx-auto max-w-[1540px] px-5 pb-32 sm:px-8 lg:px-12"><Panel><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#171817]/42">В разработке</p><h2 className="mt-6 text-4xl font-semibold tracking-[-.05em]">АналитиКит</h2><p className="mt-4 text-[#171817]/60">Страница аналитической платформы.</p></Panel></section></SiteShell> }

export const PromoPage = () => { usePageTitle('Промо'); return <SiteShell><PageHero eyebrow="Скоро" title="Промо-акции" lead="Мы готовим нечто особенное. Совсем скоро здесь появятся предложения, которые вам понравятся." /><div className="mx-auto max-w-[1540px] px-5 pb-32 sm:px-8 lg:px-12"><Link to="/" className="inline-flex rounded-full border border-[#171817]/30 px-6 py-3 text-sm hover:bg-[#171817] hover:text-white">На главную</Link></div></SiteShell> }

export const ManifestPage = () => { usePageTitle('Манифест'); return <SiteShell><PageHero eyebrow="Наш манифест" title="Против импортозамещения «для галочки»" lead="Мы верим, что технологии должны создаваться для людей и решения реальных задач, а не для красивых цифр в министерских отчётах." /><article className="mx-auto max-w-[960px] px-5 pb-32 sm:px-8">{[
    ['Суть проблемы', 'Сегодня мы всё чаще видим, как «импортозамещение» превращается в формальность. Переклеивание шильдиков на готовых зарубежных решениях и адаптация Open Source без внесения реального вклада не создают технологический суверенитет. Они создают иллюзию безопасности.'],
    ['Наш подход', 'Арлист выбирает другой путь. Мы не занимаемся «косметическим» замещением. Если мы создаём сервис — мы строим его архитектуру с нуля, понимая каждую строчку кода. Мы против бюрократии, которая душит инновации ради соблюдения формальных критериев «отечественности». Настоящее развитие — это когда продукт выбирают за качество и удобство, а не потому что всё остальное запрещено.'],
    ['Честные технологии', 'Мы создаём инструменты, которые уважают пользователя. Без скрытых метрик, без принудительной интеграции с государственными сервисами там, где это не нужно, и без компромиссов в вопросах безопасности данных.'],
  ].map(([title,text]) => <section key={title} className="border-t border-[#171817]/14 py-10"><h2 className="text-3xl font-semibold tracking-[-.045em]">{title}</h2><p className="mt-5 text-lg leading-8 text-[#171817]/64">{text}</p></section>)}</article></SiteShell> }

export const VspyshkaPage = () => { usePageTitle('Вспышка'); const features = [['Ничего не сломает без спроса','Все действия происходят в изолированной безопасной среде. Вы решаете, что подтверждать вручную.'],['Работает с MCP-серверами','Подключает внешние MCP-инструменты и сама может выступать MCP-сервером.'],['Ничего не теряется','Прерванную работу можно продолжить или вернуться к прошлому варианту.'],['Модели без своего ключа','Вход по коду с телефона. DeepSeek, GigaChat и YandexGPT — за счёт Арлист.']]; return <SiteShell><PageHero eyebrow="ИИ-агент для терминала" title="Вспышка пишет код. Вы держите всё под контролем." lead="Поставьте задачу обычными словами — Вспышка разберётся в проекте, предложит изменения и спросит подтверждение там, где это важно." /><section id="features" className="mx-auto max-w-[1540px] px-5 pb-20 sm:px-8 lg:px-12"><div className="grid gap-4 md:grid-cols-2">{features.map(([title,text]) => <Panel key={title}><h2 className="text-2xl font-semibold tracking-[-.04em]">{title}</h2><p className="mt-4 leading-7 text-[#171817]/60">{text}</p></Panel>)}</div></section><section id="install" className="mx-auto max-w-[1540px] px-5 pb-32 sm:px-8 lg:px-12"><SectionLabel number="02 / CLI">Установка</SectionLabel><div className="flex items-center justify-between gap-5 rounded-2xl bg-[#171817] p-5 text-[#eef2e3]"><code className="overflow-x-auto font-mono text-sm">npm install -g @arlist/vspyshka && vsp login</code><Copy className="h-4 w-4 shrink-0" /></div><p className="mt-5 font-mono text-[10px] uppercase tracking-[.14em] text-[#171817]/40">Страница пока доступна только по прямой ссылке.</p></section></SiteShell> }

export const GrusnubPage = () => { usePageTitle('Груснуб'); return <div className="flex min-h-screen flex-col justify-between bg-[#0d0d0d] p-6 text-[#eee] sm:p-12"><header className="flex justify-between"><Link to="/" className="font-brand lowercase">арлист тех</Link><Link to="/" className="text-sm text-white/55">На главную</Link></header><main className="max-w-4xl py-24"><p className="font-mono text-xs uppercase tracking-[.18em] text-white/35">Архив</p><h1 className="mt-7 text-[clamp(3rem,8vw,7rem)] font-semibold leading-[.92] tracking-[-.07em]">груснуб.обидняб.<br />сегодня без тыкдыков...</h1><p className="mt-10 text-xl text-white/55">Мы закрыли geotekt.arlist.tech.</p></main><a href="mailto:hello@arlist.ru" className="text-sm text-white/55">hello@arlist.ru</a></div> }

const privacySections = [
  ['1. Оператор персональных данных', <>Оператором персональных данных является физическое лицо. Для связи используйте <a className="underline" href="mailto:hello@arlist.ru">hello@arlist.ru</a>.</>],
  ['2. Собираемые данные', <>Регистрационные данные: имя и email. Пароль хранится как криптографический хэш. Автоматически могут собираться IP-адрес, тип браузера, операционная система, cookie и идентификаторы устройства. Платформа не собирает биометрические данные для идентификации личности.</>],
  ['3. Цели обработки данных', <>Идентификация пользователя, работа аутентификации и верификации, улучшение качества сервиса, системные уведомления, безопасность и предотвращение мошенничества.</>],
  ['4. Передача данных третьим лицам', <>Оператор не продаёт персональные данные. Передача возможна провайдерам инфраструктуры, по законному требованию или для защиты прав пользователей и Оператора.</>],
  ['5. Права пользователя', <>Вы можете запросить доступ и уточнение данных, инициировать удаление учётной записи или отозвать согласие на обработку.</>],
  ['6. Файлы cookie', <>Платформа использует cookie для работы и статистики. Их можно отключить в настройках браузера.</>],
  ['7. Контактная информация', <>По вопросам обработки данных: <a className="underline" href="mailto:hello@arlist.ru">hello@arlist.ru</a>.</>],
] as const

export const PrivacyPage = () => { usePageTitle('Политика конфиденциальности'); return <SiteShell><PageHero eyebrow="Arlist ID · редакция 20.06.2026" title="Политика конфиденциальности" lead="Используя Платформу, вы подтверждаете, что ознакомились с условиями настоящей Политики и принимаете их в полном объёме." /><article className="mx-auto max-w-[960px] px-5 pb-32 sm:px-8">{privacySections.map(([title,text]) => <section key={title} className="border-t border-[#171817]/14 py-8"><h2 className="text-2xl font-semibold tracking-[-.04em]">{title}</h2><div className="mt-4 leading-7 text-[#171817]/64">{text}</div></section>)}</article></SiteShell> }
