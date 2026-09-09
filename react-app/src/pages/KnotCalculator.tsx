import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { PageHero, SectionLabel, SiteShell } from '@/components/SiteShell'

const usePageTitle = (title: string) => useEffect(() => { document.title = `${title} — Арлист Тех` }, [title])

const Panel = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-[24px] border border-[#171817]/14 bg-[#fafaf1]/78 p-6 backdrop-blur-md sm:p-8 ${className}`}>{children}</div>
)

const Label = ({ children }: { children: ReactNode }) => (
  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#171817]/42">{children}</p>
)

/**
 * n = 1. Простые узлы S¹ ⊂ S³ с ровно c пересечениями, с точностью до зеркального отражения.
 * total: c = 3…16 — Hoste–Thistlethwaite–Weeks (1998), 17…19 — Burton (2020), 20 — Thistlethwaite (2025).
 * alternating: из них альтернированных (OEIS A002864).
 */
const PRIME_KNOTS: Array<{ c: number; total: number; alternating: number }> = [
  { c: 3, total: 1, alternating: 1 },
  { c: 4, total: 1, alternating: 1 },
  { c: 5, total: 2, alternating: 2 },
  { c: 6, total: 3, alternating: 3 },
  { c: 7, total: 7, alternating: 7 },
  { c: 8, total: 21, alternating: 18 },
  { c: 9, total: 49, alternating: 41 },
  { c: 10, total: 165, alternating: 123 },
  { c: 11, total: 552, alternating: 367 },
  { c: 12, total: 2176, alternating: 1288 },
  { c: 13, total: 9988, alternating: 4878 },
  { c: 14, total: 46972, alternating: 19536 },
  { c: 15, total: 253293, alternating: 85263 },
  { c: 16, total: 1388705, alternating: 379799 },
  { c: 17, total: 8053393, alternating: 1769979 },
  { c: 18, total: 48266466, alternating: 8400285 },
  { c: 19, total: 294130458, alternating: 40619385 },
  { c: 20, total: 1847319428, alternating: 199631989 },
]

/**
 * n = 2. Таблица Ёсикавы: слабо простые поверхности-зацепления в R⁴ с ch-индексом ⩽ 10
 * (K. Yoshikawa, An enumeration of surfaces in four-space, Osaka J. Math. 31 (1994), 497–522).
 * Обозначение I^{g₁,…,g_c}_k: I — ch-индекс, g_i — роды компонент (отрицательный род = неориентируемая).
 * triple — число тройных точек t(F) по сводке N. Cazet, arXiv:2205.11120 (таблица 1).
 */
type Surface = { base: number; sup?: string; sub: number; ch: number; type: string; sphere: boolean; triple: string; note?: string }

const YOSHIKAWA: Surface[] = [
  { base: 0, sub: 1, ch: 0, type: 'сфера', sphere: true, triple: '0', note: 'тривиальная' },
  { base: 2, sup: '1', sub: 1, ch: 2, type: 'тор', sphere: false, triple: '0', note: 'тривиальный' },
  { base: 2, sup: '−1', sub: 1, ch: 2, type: 'проективная плоскость', sphere: false, triple: '0' },
  { base: 6, sup: '0,1', sub: 1, ch: 6, type: 'сфера + тор', sphere: false, triple: '0' },
  { base: 7, sup: '0,−2', sub: 1, ch: 7, type: 'сфера + бутылка Клейна', sphere: false, triple: '0' },
  { base: 8, sub: 1, ch: 8, type: 'сфера', sphere: true, triple: '0', note: 'вращение трилистника' },
  { base: 8, sup: '1,1', sub: 1, ch: 8, type: 'два тора', sphere: false, triple: '0' },
  { base: 8, sup: '−1,−1', sub: 1, ch: 8, type: 'две проективные плоскости', sphere: false, triple: '2' },
  { base: 9, sub: 1, ch: 9, type: 'сфера', sphere: true, triple: '0' },
  { base: 9, sup: '0,1', sub: 1, ch: 9, type: 'сфера + тор', sphere: false, triple: '0' },
  { base: 9, sup: '1,−2', sub: 1, ch: 9, type: 'тор + бутылка Клейна', sphere: false, triple: '0' },
  { base: 10, sub: 1, ch: 10, type: 'сфера', sphere: true, triple: '0' },
  { base: 10, sub: 2, ch: 10, type: 'сфера', sphere: true, triple: '4', note: '2-кручёное вращение трилистника' },
  { base: 10, sub: 3, ch: 10, type: 'сфера', sphere: true, triple: '6', note: '3-кручёное вращение трилистника' },
  { base: 10, sup: '1', sub: 1, ch: 10, type: 'тор', sphere: false, triple: '0' },
  { base: 10, sup: '0,1', sub: 1, ch: 10, type: 'сфера + тор', sphere: false, triple: '0' },
  { base: 10, sup: '0,1', sub: 2, ch: 10, type: 'сфера + тор', sphere: false, triple: '0' },
  { base: 10, sup: '1,1', sub: 1, ch: 10, type: 'два тора', sphere: false, triple: '0' },
  { base: 10, sup: '0,0,1', sub: 1, ch: 10, type: 'две сферы + тор', sphere: false, triple: '0' },
  { base: 10, sup: '0,−2', sub: 1, ch: 10, type: 'сфера + бутылка Клейна', sphere: false, triple: '0' },
  { base: 10, sup: '0,−2', sub: 2, ch: 10, type: 'сфера + бутылка Клейна', sphere: false, triple: '⩽ 10' },
  { base: 10, sup: '−1,−1', sub: 1, ch: 10, type: 'две проективные плоскости', sphere: false, triple: '2 … 12' },
  { base: 10, sup: '−2,−2', sub: 1, ch: 10, type: 'две бутылки Клейна', sphere: false, triple: '0' },
]

const MIN_CROSSINGS = PRIME_KNOTS[0].c
const MAX_CROSSINGS = PRIME_KNOTS[PRIME_KNOTS.length - 1].c
const MAX_CH = 10
const MAX_DIMENSION = 64

const numberFormat = new Intl.NumberFormat('ru-RU')
const fmt = (value: number) => numberFormat.format(value)

const SUPERSCRIPTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
const sup = (value: number) => String(value).split('').map((digit) => SUPERSCRIPTS[Number(digit)]).join('')

const SurfaceName = ({ item }: { item: Surface }) => (
  <span className="whitespace-nowrap">{item.base}{item.sup && <sup>{item.sup}</sup>}<sub>{item.sub}</sub></span>
)

/** Шкала сложности: чем в размерности n измеряется «число пересечений». */
type Scale = { title: string; status: string; text: string }

const multipleName = (n: number) => n === 1 ? 'двойные точки — обычные перекрёстки' : n === 2 ? 'тройные точки' : n === 3 ? 'четверные точки' : `${n + 1}-кратные точки`

const projectionText = (n: number) =>
  `Узел S${sup(n)} ⊂ S${sup(n + 2)} проецируется в R${sup(n + 1)}. У проекции общего положения k-кратные точки образуют множество размерности ${n + 1} − k, поэтому изолированы ровно ${n + 1}-кратные: ${multipleName(n)}. Их минимальное число по всем диаграммам и есть прямой аналог числа пересечений.`

const diagramText = (n: number) => {
  if (n === 1) return 'Мостовое разбиение S³ на два тела: узел задаётся парой тривиальных танглов — это и есть обычная плоская диаграмма.'
  if (n === 2) return 'Мостовая трисекция Майера–Зупана: 2-узел задаётся тремя тривиальными танглами (три-плоскостная диаграмма), число пересечений диаграммы — сумма по трём танглам.'
  if (n === 3) return 'Мостовая квадрисекция (Аранда, Блэквелл, Ким, Нейлор, Понгтанапайсан, 2026): всякое 3-многообразие в S⁵ задаётся четырьмя тривиальными танглами — 4-плоскостной диаграммой.'
  return `Схема продолжается: n-узел в S${sup(n + 2)} должен кодироваться ${n + 1} танглами (мультисекция S${sup(n + 2)} на ${n + 1} частей). Для n ⩾ 4 такое исчисление не построено.`
}

const scalesFor = (n: number): Scale[] => {
  if (n === 1) return [
    { title: 'Число пересечений', status: 'Таблицы до 20 пересечений', text: 'Классическая шкала: минимум двойных точек плоской диаграммы. Перечисление доведено до 20 пересечений и остаётся единственным полным перечислением по сложности во всей теории узлов.' },
  ]
  if (n === 2) return [
    { title: 'Тройные точки t(F)', status: 'Значения известны точечно', text: 'Прямой аналог числа пересечений. Если у 2-узла есть диаграмма не более чем с тремя тройными точками, то есть и диаграмма совсем без них (Сато, 2005), а t = 0 равносильно ленточности (Ядзима, 1964). Первое нетривиальное значение t = 4 — 2-кручёное вращение трилистника, t = 6 — 3-кручёное (Сато и Сима, 2004, 2005).' },
    { title: 'ch-индекс Ёсикавы', status: 'Полная таблица до 10', text: 'Число перекрёстков плюс число помеченных вершин марк-графовой диаграммы. По этой шкале Ёсикава в 1994 году перечислил все слабо простые поверхности с ch ⩽ 10 — 23 штуки, включая 6 сфер. Это ближайший аналог таблицы простых узлов.' },
    { title: 'Пересечения три-плоскостной диаграммы', status: 'Первое значение — 2026 год', text: 'Сумма перекрёстков трёх танглов мостовой трисекции. Всякий 2-узел с диаграммой не более чем в 5 пересечений ленточный, а у 2-кручёного вращения трилистника число пересечений ровно 6 — первое вычисленное значение для нетривиальной заузлённой поверхности (Гонг, Льюис-Монкман, Оснес, 2026).' },
  ]
  if (n === 3) return [
    { title: 'Пересечения 4-плоскостной диаграммы', status: 'Открытый вопрос', text: 'Диаграмма без перекрёстков означает, что 3-многообразие вкладывается уже в S⁴, то есть незаузлено. Наименьшее число пересечений нетривиального 3-узла неизвестно — это вопрос 5.4 работы 2026 года, вводящей эти диаграммы.' },
    { title: 'Мостовое число', status: 'Малые значения разобраны', text: 'Квадрисекции с 2 мостами дают только незаузлённую S³ и расщеплённое объединение двух S³; всякая квадрисекция с 3 мостами разлагается в сумму более простых. Перечисления по числу мостов дальше этого нет.' },
  ]
  return [
    { title: 'Диаграммного исчисления нет', status: 'Открытая область', text: `Ни таблиц, ни даже общепринятого определения диаграммы n-узла при n ⩾ 4 не построено: мостовые мультисекции доведены до 3-многообразий в S⁵. Шкала сложности определена — минимальное число ${n + 1}-кратных точек проекции в R${sup(n + 1)} — но не вычислена ни для одного нетривиального примера.` },
  ]
}

const KERVAIRE = 'Критерий Кервера (n ⩾ 3): группа G реализуется как группа n-узла тогда и только тогда, когда она конечно представима, H₁(G) = ℤ, H₂(G) = 0 и вес G равен 1.'
const LEVINE_AC = 'ℤ^∞ ⊕ (ℤ/2)^∞ ⊕ (ℤ/4)^∞'

type Fact = { label: string; text: string }
type Profile = { family: string; count: string; countNote: string; facts: Fact[] }

const profileFor = (n: number): Profile => {
  if (n === 0) return {
    family: 'Вырожденный случай: S⁰ ⊂ S²',
    count: '1',
    countNote: 'S⁰ — это пара точек. Любая пара точек на сфере переводится в любую другую объемлющей изотопией, поэтому тип ровно один, и никакой диаграммы здесь не нужно.',
    facts: [
      { label: 'Сложность', text: 'Проекция пары точек на прямую двойных точек не имеет: шкала пуста.' },
      { label: 'Классификация', text: 'Полная и мгновенная — единственный класс.' },
    ],
  }

  if (n === 1) return {
    family: 'Классические узлы: S¹ ⊂ S³',
    count: '∞',
    countNote: 'Счётное бесконечное множество мощности ℵ₀. Счётность — потому что PL-вложений с точностью до изотопии счётно много; бесконечность видна уже на торических узлах T(2, 2k+1).',
    facts: [
      { label: 'Конкордантность', text: `Группа C не вычислена. Есть сюръекция C ↠ AC на алгебраическую группу конкордантности AC ≅ ${LEVINE_AC} (Левин, 1969; Штольцфус, 1977), и её ядро нетривиально (Кэссон–Гордон, 1978).` },
      { label: 'Группы узлов', text: 'Условия Кервера необходимы, но при n = 1 недостаточны: не всякая группа с H₁ = ℤ, H₂ = 0 и весом 1 является группой классического узла.' },
      { label: 'Классификация', text: 'Узел определяется своим дополнением (Гордон–Люк, 1989), а простой узел — своей группой с точностью до зеркального отражения (Уиттен, 1987).' },
    ],
  }

  if (n === 2) return {
    family: '2-узлы: S² ⊂ S⁴',
    count: '∞',
    countNote: 'Счётно много, мощность ℵ₀. Вращение Артина (1925) переводит классический узел в 2-узел с той же группой узла, а различных групп бесконечно много.',
    facts: [
      { label: 'Конкордантность', text: 'C₂ = 0: любой чётномерный узел срезан (Кервер, 1965, Théorème III.6; 1971, Theorem 1). Конкордантность здесь не различает ничего.' },
      { label: 'Группы узлов', text: 'Условия Кервера необходимы, но их достаточность доказана лишь при n ⩾ 3; случай n = 2 остаётся отдельным.' },
      { label: 'Осторожно', text: 'Вращение не инъективно: вращения бабьего и прямого узлов совпадают (Роузман, 1975). Различать 2-узлы приходится группами и кокциклическими инвариантами, а не конструкцией.' },
    ],
  }

  const odd = n % 2 === 1
  const concordance = odd
    ? (n === 3
      ? `PL- и TOP-группа конкордантности отличается от алгебраической AC ≅ ${LEVINE_AC} на ℤ/2 — след теоремы Рохлина.`
      : `C_n ≅ AC ≅ ${LEVINE_AC} в PL- и TOP-категориях (Левин, 1969; Кервер, 1971). В гладкой категории — поправка, связанная с экзотическими сферами.`)
    : 'C_n = 0: любой чётномерный узел срезан (Кервер, 1965; 1971). Бесконечность множества узлов при этом сохраняется — конкордантность их просто не различает.'

  const classification = odd
    ? 'Простые (2q−1)-узлы описываются формой Зейферта с точностью до S-эквивалентности (Левин; Кёртон — эквивалентно, через спаривание Бланчфилда).'
    : 'Изотопической классификации нет. Тривиальность конкордантности её не заменяет: узлов по-прежнему бесконечно много.'

  return {
    family: `${odd ? 'Нечётномерные' : 'Чётномерные'} узлы: S${sup(n)} ⊂ S${sup(n + 2)}`,
    count: '∞',
    countNote: 'Счётно много, мощность ℵ₀. Итерированное вращение сохраняет группу узла и даёт бесконечно много попарно неэквивалентных узлов в каждой размерности (Артин; см. обзор Фридмана «Knot spinning»).',
    facts: [
      { label: 'Конкордантность', text: concordance },
      { label: 'Группы узлов', text: KERVAIRE },
      { label: 'Классификация', text: classification },
    ],
  }
}

const budgetFor = (n: number) => {
  if (n === 1) return { min: MIN_CROSSINGS, max: MAX_CROSSINGS, label: 'Число пересечений c', hint: `Перечисление доведено до ${MAX_CROSSINGS} пересечений.` }
  if (n === 2) return { min: 0, max: MAX_CH, label: 'ch-индекс c', hint: 'Таблица Ёсикавы обрывается на ch = 10.' }
  if (n === 3) return { min: 0, max: 12, label: 'Пересечений 4-плоскостной диаграммы c', hint: 'Перечисления нет: осмысленно только c = 0.' }
  return { min: 0, max: 12, label: 'Сложность c', hint: 'Шкала определена, данных нет.' }
}

export const KnotCalculatorPage = () => {
  usePageTitle('Калькулятор узлов')
  const [dimension, setDimension] = useState(2)
  const [budget, setBudget] = useState(10)

  const profile = useMemo(() => profileFor(dimension), [dimension])
  const scales = useMemo(() => scalesFor(dimension), [dimension])
  const range = useMemo(() => budgetFor(dimension), [dimension])
  const c = Math.max(range.min, Math.min(range.max, budget))

  const knotRows = useMemo(() => {
    let running = 0
    return PRIME_KNOTS.map((row) => { running += row.total; return { ...row, cumulative: running } })
  }, [])

  const classical = useMemo(() => {
    const inRange = knotRows.filter((row) => row.c <= c)
    return {
      exact: knotRows.find((row) => row.c === c),
      cumulative: inRange.reduce((sum, row) => sum + row.total, 0),
      alternating: inRange.reduce((sum, row) => sum + row.alternating, 0),
    }
  }, [knotRows, c])

  const surfaces = useMemo(() => {
    const inRange = YOSHIKAWA.filter((item) => item.ch <= c)
    return {
      exact: YOSHIKAWA.filter((item) => item.ch === c),
      total: inRange.length,
      spheres: inRange.filter((item) => item.sphere).length,
      knotted: inRange.filter((item) => item.sphere && item.ch > 0).length,
    }
  }, [c])

  const setDimensionSafely = (value: number) => {
    const next = Math.max(0, Math.min(MAX_DIMENSION, Math.round(value || 0)))
    const nextRange = budgetFor(next)
    setDimension(next)
    setBudget(Math.max(nextRange.min, Math.min(nextRange.max, budget)))
  }

  return <SiteShell>
    <PageHero
      eyebrow="Расширенная теория узлов"
      title={<>Узлы S<sup>n</sup> ⊂ S<sup>n+2</sup> <span className="text-[#171817]/38">по числу пересечений.</span></>}
      lead="Обычная таблица узлов сортирует их по количеству перекрёстков на диаграмме. Калькулятор переносит эту классификацию на любую размерность: что играет роль перекрёстка при вложении n-мерной сферы в (n+2)-мерную, сколько узлов данной сложности перечислено и где перечисление заканчивается."
    />

    <section className="mx-auto max-w-[1540px] px-5 pb-16 sm:px-8 lg:px-12">
      <SectionLabel number="01 / Ввод">Параметры</SectionLabel>
      <Panel>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <label htmlFor="dimension" className="block"><Label>Размерность узла n</Label></label>
            <div className="mt-4 flex items-center gap-4">
              <input id="dimension" type="number" min={0} max={MAX_DIMENSION} value={dimension}
                onChange={(event) => setDimensionSafely(Number(event.target.value))}
                className="w-28 rounded-2xl border border-[#171817]/20 bg-transparent px-4 py-3 font-mono text-lg" />
              <input type="range" min={0} max={12} value={Math.min(dimension, 12)}
                onChange={(event) => setDimensionSafely(Number(event.target.value))}
                className="h-1 w-full accent-[#171817]" aria-label="Размерность узла, ползунок" />
            </div>
            <p className="mt-4 text-sm leading-6 text-[#171817]/58">Сфера S<sup>{dimension}</sup> вкладывается в S<sup>{dimension + 2}</sup>. Ползунок покрывает n ⩽ 12, поле — до {MAX_DIMENSION}.</p>
          </div>
          <div>
            <label htmlFor="budget" className="block"><Label>{range.label}</Label></label>
            <div className="mt-4 flex items-center gap-4">
              <input id="budget" type="number" min={range.min} max={range.max} value={c}
                onChange={(event) => setBudget(Math.max(range.min, Math.min(range.max, Math.round(Number(event.target.value) || range.min))))}
                className="w-28 rounded-2xl border border-[#171817]/20 bg-transparent px-4 py-3 font-mono text-lg" />
              <input type="range" min={range.min} max={range.max} value={c}
                onChange={(event) => setBudget(Number(event.target.value))}
                className="h-1 w-full accent-[#171817]" aria-label="Сложность, ползунок" />
            </div>
            <p className="mt-4 text-sm leading-6 text-[#171817]/58">Шкала меняется вместе с размерностью. {range.hint}</p>
          </div>
        </div>
      </Panel>
    </section>

    <section className="mx-auto max-w-[1540px] px-5 pb-16 sm:px-8 lg:px-12">
      <SectionLabel number="02 / Ответ">Узлы размерности {dimension} сложности {c}</SectionLabel>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <Label>Сколько узлов такой сложности</Label>
          {dimension === 0 && <>
            <p className="mt-6 text-[clamp(2.4rem,5vw,3.8rem)] font-semibold leading-none tracking-[-0.06em]">1</p>
            <p className="mt-5 leading-7 text-[#171817]/62">Единственный класс; шкалы сложности здесь нет.</p>
          </>}
          {dimension === 1 && <>
            <p className="mt-6 text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-none tracking-[-0.06em]">{fmt(classical.exact?.total ?? 0)}</p>
            <p className="mt-4 leading-7 text-[#171817]/62">простых узлов ровно с {c} пересечениями. Числа точные: это результат полного перечисления, а не оценка.</p>
            <dl className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ['Не более c пересечений', fmt(classical.cumulative)],
                ['Из них альтернированных', fmt(classical.alternating)],
                ['Неальтернированных', fmt(classical.cumulative - classical.alternating)],
              ].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#171817]/12 p-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#171817]/42">{label}</dt>
                <dd className="mt-2 font-mono text-lg">{value}</dd>
              </div>)}
            </dl>
            <p className="mt-6 text-sm leading-6 text-[#171817]/50">Считаются простые узлы с точностью до зеркального отражения; составные в таблицу перечисления не входят.</p>
          </>}
          {dimension === 2 && <>
            <p className="mt-6 text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-none tracking-[-0.06em]">{surfaces.exact.length}</p>
            <p className="mt-4 leading-7 text-[#171817]/62">
              слабо простых поверхностей с ch-индексом ровно {c} в таблице Ёсикавы{surfaces.exact.length > 0 && <>: {surfaces.exact.map((item, index) => <span key={`${item.base}-${item.sup ?? ''}-${item.sub}`}>{index > 0 && ', '}<SurfaceName item={item} /></span>)}</>}.
            </p>
            <dl className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ['Всего при ch ⩽ c', String(surfaces.total)],
                ['Из них 2-узлов (сфер)', String(surfaces.spheres)],
                ['Нетривиальных сфер', String(surfaces.knotted)],
              ].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#171817]/12 p-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#171817]/42">{label}</dt>
                <dd className="mt-2 font-mono text-lg">{value}</dd>
              </div>)}
            </dl>
            <p className="mt-6 text-sm leading-6 text-[#171817]/50">Таблица перечисляет слабо простые поверхности с точностью до ориентации и зеркала и обрывается на ch = 10: что дальше — неизвестно.</p>
          </>}
          {dimension === 3 && <>
            <p className="mt-6 text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-none tracking-[-0.06em]">{c === 0 ? '0' : '?'}</p>
            <p className="mt-4 leading-7 text-[#171817]/62">
              {c === 0
                ? 'Нетривиальных 3-узлов с диаграммой без перекрёстков нет: бескрестовая 4-плоскостная диаграмма означает, что многообразие изотопно вложенному в S⁴ (Аранда и др., 2026, предложение 5.3).'
                : 'Неизвестно. Даже наименьшее число пересечений нетривиального 3-узла — открытый вопрос 5.4 той же работы 2026 года; ни одной таблицы по этой шкале не построено.'}
            </p>
            <p className="mt-6 text-sm leading-6 text-[#171817]/50">Диаграммы для 3-узлов появились только в 2026 году, перечисление по сложности ещё не начиналось.</p>
          </>}
          {dimension >= 4 && <>
            <p className="mt-6 text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-none tracking-[-0.06em]">—</p>
            <p className="mt-4 leading-7 text-[#171817]/62">
              Данных нет. Шкала сложности определяется — минимум {dimension + 1}-кратных точек проекции в R<sup>{dimension + 1}</sup> — но ни одного её значения для нетривиального узла размерности {dimension} не вычислено, а диаграммного исчисления для n ⩾ 4 не построено.
            </p>
          </>}
        </Panel>
        <Panel>
          <Label>Что здесь считается пересечением</Label>
          <p className="mt-6 leading-7 text-[#171817]/68">{projectionText(dimension)}</p>
          <div className="mt-6 border-t border-[#171817]/12 pt-6">
            <Label>Диаграммы</Label>
            <p className="mt-4 leading-7 text-[#171817]/62">{diagramText(dimension)}</p>
          </div>
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {scales.map((scale) => <Panel key={scale.title}>
          <Label>{scale.status}</Label>
          <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">{scale.title}</h3>
          <p className="mt-4 leading-7 text-[#171817]/62">{scale.text}</p>
        </Panel>)}
      </div>
    </section>

    <section className="mx-auto max-w-[1540px] px-5 pb-16 sm:px-8 lg:px-12">
      <SectionLabel number="03 / Таблица">{dimension === 2 ? 'Таблица Ёсикавы: поверхности в R⁴' : 'Перечисление простых классических узлов'}</SectionLabel>
      <Panel className="overflow-x-auto">
        {dimension === 2 ? <>
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#171817]/14 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-[#171817]/42">
                <th className="py-3 pr-4 font-normal">Обозначение</th>
                <th className="py-3 pr-4 font-normal">ch</th>
                <th className="py-3 pr-4 font-normal">Поверхность</th>
                <th className="py-3 pr-4 font-normal">Тройных точек</th>
                <th className="py-3 font-normal">Что это</th>
              </tr>
            </thead>
            <tbody>
              {YOSHIKAWA.map((item) => <tr key={`${item.base}-${item.sup ?? ''}-${item.sub}`} className={`border-b border-[#171817]/8 ${item.ch === c ? 'bg-[#171817]/[0.05]' : ''} ${item.ch > c ? 'text-[#171817]/30' : ''}`}>
                <td className="py-2.5 pr-4 font-mono"><SurfaceName item={item} /></td>
                <td className="py-2.5 pr-4 font-mono">{item.ch}</td>
                <td className="py-2.5 pr-4">{item.type}</td>
                <td className="py-2.5 pr-4 font-mono">{item.triple}</td>
                <td className="py-2.5 text-[#171817]/60">{item.note ?? (item.sphere ? '2-узел' : '—')}</td>
              </tr>)}
            </tbody>
          </table>
          <p className="mt-6 text-sm leading-6 text-[#171817]/55">
            Ёсикава (1994) перечислил слабо простые поверхности с ch ⩽ 10 — 23 штуки, из них 6 сфер. Верхние индексы — роды компонент, отрицательные означают неориентируемые компоненты
            (−1 — проективная плоскость, −2 — бутылка Клейна). Числа тройных точек собраны Казе (2022): у большинства поверхностей таблицы t = 0, то есть диаграмму можно сделать вовсе без тройных точек.
          </p>
        </> : <>
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#171817]/14 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-[#171817]/42">
                <th className="py-3 pr-4 font-normal">Пересечений</th>
                <th className="py-3 pr-4 font-normal">Простых узлов</th>
                <th className="py-3 pr-4 font-normal">Альтернированных</th>
                <th className="py-3 pr-4 font-normal">Неальтернированных</th>
                <th className="py-3 font-normal">Накопленным итогом</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {knotRows.map((row) => <tr key={row.c} className={`border-b border-[#171817]/8 ${dimension === 1 && row.c === c ? 'bg-[#171817]/[0.05]' : ''}`}>
                <td className="py-2.5 pr-4">{row.c}</td>
                <td className="py-2.5 pr-4">{fmt(row.total)}</td>
                <td className="py-2.5 pr-4">{fmt(row.alternating)}</td>
                <td className="py-2.5 pr-4">{fmt(row.total - row.alternating)}</td>
                <td className="py-2.5">{fmt(row.cumulative)}</td>
              </tr>)}
            </tbody>
          </table>
          <p className="mt-6 text-sm leading-6 text-[#171817]/55">
            Источники чисел: 3–16 пересечений — Хосте, Тистлтуэйт и Уикс (1998): {fmt(1701935)} простых узлов, вместе с тривиальным — те самые 1 701 936;
            17–19 — Бёртон (2020), суммарно {fmt(352152252)} узлов; 20 — Тистлтуэйт (2025). Доли альтернированных узлов — последовательность OEIS A002864.
            {dimension !== 1 && ' Таблица показана для сравнения: при выбранной размерности она не применяется.'}
          </p>
        </>}
      </Panel>
    </section>

    <section className="mx-auto max-w-[1540px] px-5 pb-16 sm:px-8 lg:px-12">
      <SectionLabel number="04 / Контекст">Всё множество узлов размерности {dimension}</SectionLabel>
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <Label>Всего типов узлов</Label>
          <p className="mt-6 text-[clamp(3.5rem,9vw,7rem)] font-semibold leading-none tracking-[-0.07em]">{profile.count}</p>
          <p className="mt-6 text-sm uppercase tracking-[0.12em] text-[#171817]/45">{profile.family}</p>
          <p className="mt-5 leading-7 text-[#171817]/62">{profile.countNote}</p>
        </Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          {profile.facts.map((fact) => <Panel key={fact.label}>
            <Label>{fact.label}</Label>
            <p className="mt-5 leading-7 text-[#171817]/68">{fact.text}</p>
          </Panel>)}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-[1540px] px-5 pb-16 sm:px-8 lg:px-12">
      <SectionLabel number="05 / Контекст">Почему именно коразмерность 2</SectionLabel>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Коразмерность 1', 'Локально плоское вложение Sⁿ ⊂ Sⁿ⁺¹ ограничивает шар — обобщённая теорема Шёнфлиса (Браун, 1960, топологическая категория). Заузливаться нечему.'],
          ['Коразмерность 2', 'Единственная зона, где заузливание есть при любом n ⩾ 1 и в PL-, и в гладкой категории. Здесь же работает проекция с изолированными (n+1)-кратными точками, дающая шкалу сложности.'],
          ['Коразмерность ⩾ 3', 'Зиман: в PL- и TOP-категориях все сферы незаузлены. В гладкой категории заузливание возвращается: Хефлигер (1962) построил бесконечно много классов вложений S³ ⊂ S⁶.'],
        ].map(([title, text]) => <Panel key={title}>
          <h3 className="text-2xl font-semibold tracking-[-0.04em]">{title}</h3>
          <p className="mt-4 leading-7 text-[#171817]/62">{text}</p>
        </Panel>)}
      </div>
    </section>

    <section className="mx-auto max-w-[1540px] px-5 pb-32 sm:px-8 lg:px-12">
      <SectionLabel number="06 / Ссылки">Источники</SectionLabel>
      <Panel>
        <ul className="grid gap-3 text-sm leading-6 text-[#171817]/62 md:grid-cols-2">
          {[
            ['K. Yoshikawa. An enumeration of surfaces in four-space. Osaka J. Math. 31 (1994), 497–522 — таблица по ch-индексу.', ''],
            ['N. Cazet. On the triple point number of surface-links in Yoshikawa’s table (2022) — сводка чисел тройных точек.', 'https://arxiv.org/abs/2205.11120'],
            ['S. Satoh, A. Shima. The 2-twist-spun trefoil has the triple point number four. Trans. AMS 356 (2004); S. Satoh. No 2-knot has triple point number two or three. Osaka J. Math. 42 (2005).', ''],
            ['S. Gong, S. Lewis-Monkman, J. Osnes. The 2-twist spun trefoil has crossing number six (2026).', 'https://arxiv.org/abs/2606.03799'],
            ['J. Meier, A. Zupan. Bridge trisections of knotted surfaces in S⁴. Trans. AMS 369 (2017).', ''],
            ['R. Aranda, S. Blackwell, G. Kim, P. Naylor, P. Pongtanapaisan. Bridge position of 3-manifolds embedded in the 5-sphere (2026).', 'https://arxiv.org/abs/2604.12182'],
            ['J. Hoste, M. Thistlethwaite, J. Weeks. The first 1 701 936 knots. Math. Intelligencer 20 (1998); B. Burton. The Next 350 Million Knots. SoCG 2020; M. Thistlethwaite. Prime 20-crossing knots. AGT 25 (2025).', ''],
            ['M. Kervaire. Les nœuds de dimensions supérieures. Bull. SMF 93 (1965); J. Levine. Knot cobordism groups in codimension two. Comment. Math. Helv. 44 (1969).', ''],
            ['A. Ray. Slice knots and knot concordance — обзор, замечание 3.10 о высших размерностях; G. Friedman. Knot spinning.', 'https://arxiv.org/abs/2311.12168'],
            ['E. C. Zeeman. Unknotting spheres. Ann. of Math. (1960); A. Haefliger. Knotted (4k−1)-spheres in 6k-space. Ann. of Math. 75 (1962); OEIS A002863, A002864.', 'https://oeis.org/A002863'],
          ].map(([text, href]) => <li key={text} className="border-t border-[#171817]/10 pt-3">
            {href ? <a href={href} target="_blank" rel="noreferrer" className="border-b border-[#171817]/25 hover:border-[#171817]">{text}</a> : text}
          </li>)}
        </ul>
      </Panel>
    </section>
  </SiteShell>
}
