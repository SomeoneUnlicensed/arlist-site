import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { PageHero, SectionLabel, SiteShell } from '@/components/SiteShell'

const usePageTitle = (title: string) => useEffect(() => { document.title = `${title} — Арлист Тех` }, [title])

const Panel = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-[24px] border border-[#171817]/14 bg-[#fafaf1]/78 p-6 backdrop-blur-md sm:p-8 ${className}`}>{children}</div>
)

/**
 * Простые узлы S¹ ⊂ S³ с ровно c пересечениями, с точностью до зеркального отражения.
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

const MIN_CROSSINGS = PRIME_KNOTS[0].c
const MAX_CROSSINGS = PRIME_KNOTS[PRIME_KNOTS.length - 1].c
const MAX_DIMENSION = 64

const numberFormat = new Intl.NumberFormat('ru-RU')
const fmt = (value: number) => numberFormat.format(value)

const SUPERSCRIPTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
const sup = (value: number) => String(value).split('').map((digit) => SUPERSCRIPTS[Number(digit)]).join('')

const KERVAIRE = 'Критерий Кервера (n ⩾ 3): группа G реализуется как группа n-узла тогда и только тогда, когда она конечно представима, H₁(G) = ℤ, H₂(G) = 0 и вес G равен 1.'
const LEVINE_AC = 'ℤ^∞ ⊕ (ℤ/2)^∞ ⊕ (ℤ/4)^∞'

type Fact = { label: string; text: string }
type Profile = { family: string; count: string; countNote: string; facts: Fact[] }

const profileFor = (n: number): Profile => {
  if (n === 0) return {
    family: 'Вырожденный случай: S⁰ ⊂ S²',
    count: '1',
    countNote: 'S⁰ — это пара точек. Любая пара точек на сфере переводится в любую другую объемлющей изотопией, поэтому тип ровно один. Содержательная теория начинается с n = 1.',
    facts: [
      { label: 'Конкордантность', text: 'Группа тривиальна по той же причине: заузливать нечего.' },
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
      { label: 'Классификация', text: 'Полной классификации нет, есть перечисление: простые узлы протабулированы до 20 пересечений. Узел определяется своим дополнением (Гордон–Люк, 1989), а простой узел — своей группой с точностью до зеркального отражения (Уиттен, 1987).' },
      { label: 'Что считает калькулятор', text: 'Точные табличные числа простых узлов — единственный случай, где «сколько» имеет конечный ответ при ограничении на сложность.' },
    ],
  }

  if (n === 2) return {
    family: '2-узлы: S² ⊂ S⁴',
    count: '∞',
    countNote: 'Счётно много, мощность ℵ₀. Вращение Артина (1925) переводит классический узел в 2-узел с той же группой узла, а различных групп бесконечно много — значит, различных 2-узлов тоже.',
    facts: [
      { label: 'Конкордантность', text: 'C₂ = 0: любой чётномерный узел срезан (Кервер, 1965, Théorème III.6; 1971, Theorem 1). Конкордантность здесь не различает ничего.' },
      { label: 'Группы узлов', text: 'Условия Кервера необходимы, но их достаточность доказана лишь при n ⩾ 3; случай n = 2 остаётся отдельным.' },
      { label: 'Классификация', text: 'Классификации нет. Основные источники примеров — вращение Артина, кручёное вращение Зимана (1965) и ленточные 2-узлы.' },
      { label: 'Осторожно', text: 'Вращение не инъективно: вращения бабьего и прямого узлов совпадают (Роузман, 1975). Поэтому нижняя оценка ниже строится только по простым узлам, которые различаются группами.' },
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
      { label: 'Что считает калькулятор', text: 'Нижнюю оценку числа узлов: каждый простой классический узел даёт свой n-узел с той же группой.' },
    ],
  }
}

export const KnotCalculatorPage = () => {
  usePageTitle('Калькулятор узлов')
  const [dimension, setDimension] = useState(2)
  const [crossings, setCrossings] = useState(10)

  const profile = useMemo(() => profileFor(dimension), [dimension])
  const rows = useMemo(() => {
    let running = 0
    return PRIME_KNOTS.map((row) => { running += row.total; return { ...row, cumulative: running } })
  }, [])
  const stats = useMemo(() => {
    const inRange = rows.filter((row) => row.c <= crossings)
    const exact = rows.find((row) => row.c === crossings)
    const cumulative = inRange.reduce((sum, row) => sum + row.total, 0)
    const alternating = inRange.reduce((sum, row) => sum + row.alternating, 0)
    return { exact, cumulative, alternating, nonAlternating: cumulative - alternating }
  }, [rows, crossings])

  const clampDimension = (value: number) => Math.max(0, Math.min(MAX_DIMENSION, Math.round(value || 0)))

  return <SiteShell>
    <PageHero
      eyebrow="Расширенная теория узлов"
      title={<>Сколько существует узлов <span className="text-[#171817]/38">Sⁿ ⊂ Sⁿ⁺²?</span></>}
      lead="Калькулятор отвечает на вопрос честно: в коразмерности 2 узлов бесконечно много при любом n ⩾ 1, но при ограничении на сложность ответ становится конечным числом. Здесь оно и считается — по таблицам перечисления и по теоремам о высших размерностях."
    />

    <section className="mx-auto max-w-[1540px] px-5 pb-16 sm:px-8 lg:px-12">
      <SectionLabel number="01 / Ввод">Параметры</SectionLabel>
      <Panel>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <label htmlFor="dimension" className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#171817]/42">Размерность узла n</label>
            <div className="mt-4 flex items-center gap-4">
              <input id="dimension" type="number" min={0} max={MAX_DIMENSION} value={dimension}
                onChange={(event) => setDimension(clampDimension(Number(event.target.value)))}
                className="w-28 rounded-2xl border border-[#171817]/20 bg-transparent px-4 py-3 font-mono text-lg" />
              <input type="range" min={0} max={12} value={Math.min(dimension, 12)}
                onChange={(event) => setDimension(Number(event.target.value))}
                className="h-1 w-full accent-[#171817]" aria-label="Размерность узла, ползунок" />
            </div>
            <p className="mt-4 text-sm leading-6 text-[#171817]/58">Сфера S<sup>{dimension}</sup> вкладывается в S<sup>{dimension + 2}</sup>. Ползунок покрывает n ⩽ 12, поле — до {MAX_DIMENSION}.</p>
          </div>
          <div>
            <label htmlFor="crossings" className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#171817]/42">Бюджет пересечений c</label>
            <div className="mt-4 flex items-center gap-4">
              <input id="crossings" type="number" min={MIN_CROSSINGS} max={MAX_CROSSINGS} value={crossings}
                onChange={(event) => setCrossings(Math.max(MIN_CROSSINGS, Math.min(MAX_CROSSINGS, Math.round(Number(event.target.value) || MIN_CROSSINGS))))}
                className="w-28 rounded-2xl border border-[#171817]/20 bg-transparent px-4 py-3 font-mono text-lg" />
              <input type="range" min={MIN_CROSSINGS} max={MAX_CROSSINGS} value={crossings}
                onChange={(event) => setCrossings(Number(event.target.value))}
                className="h-1 w-full accent-[#171817]" aria-label="Бюджет пересечений, ползунок" />
            </div>
            <p className="mt-4 text-sm leading-6 text-[#171817]/58">Ограничение сложности исходного классического узла: перечисление доведено до {MAX_CROSSINGS} пересечений.</p>
          </div>
        </div>
      </Panel>
    </section>

    <section className="mx-auto max-w-[1540px] px-5 pb-16 sm:px-8 lg:px-12">
      <SectionLabel number="02 / Ответ">Узлы размерности {dimension} в S<sup>{dimension + 2}</sup></SectionLabel>
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#171817]/42">Всего типов узлов</p>
          <p className="mt-6 text-[clamp(3.5rem,9vw,7rem)] font-semibold leading-none tracking-[-0.07em]">{profile.count}</p>
          <p className="mt-6 text-sm uppercase tracking-[0.12em] text-[#171817]/45">{profile.family}</p>
          <p className="mt-5 leading-7 text-[#171817]/62">{profile.countNote}</p>
        </Panel>
        <Panel>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#171817]/42">Конечный счёт при c ⩽ {crossings}</p>
          {dimension === 0 && <>
            <p className="mt-6 text-5xl font-semibold tracking-[-0.06em]">1</p>
            <p className="mt-5 leading-7 text-[#171817]/62">Единственный класс, сложность роли не играет.</p>
          </>}
          {dimension === 1 && <>
            <p className="mt-6 text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-none tracking-[-0.06em]">{fmt(stats.cumulative)}</p>
            <p className="mt-4 leading-7 text-[#171817]/62">простых узлов не более чем с {crossings} пересечениями — точное число, а не оценка.</p>
            <dl className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ['Ровно c пересечений', fmt(stats.exact?.total ?? 0)],
                ['Альтернированных', fmt(stats.alternating)],
                ['Неальтернированных', fmt(stats.nonAlternating)],
              ].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#171817]/12 p-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#171817]/42">{label}</dt>
                <dd className="mt-2 font-mono text-lg">{value}</dd>
              </div>)}
            </dl>
            <p className="mt-6 text-sm leading-6 text-[#171817]/50">Считаются простые узлы с точностью до зеркального отражения; составные узлы в таблицу перечисления не входят.</p>
          </>}
          {dimension >= 2 && <>
            <p className="mt-6 text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-none tracking-[-0.06em]">⩾ {fmt(stats.cumulative)}</p>
            <p className="mt-4 leading-7 text-[#171817]/62">
              различных узлов S<sup>{dimension}</sup> ⊂ S<sup>{dimension + 2}</sup>. Оценка снизу: {dimension - 1}-кратное вращение переводит каждый простой классический узел
              с не более чем {crossings} пересечениями в узел размерности {dimension} с той же группой, а простые узлы различаются своими группами (Уиттен, 1987 + Гордон–Люк, 1989).
            </p>
            <p className="mt-6 text-sm leading-6 text-[#171817]/50">Это нижняя граница, а не подсчёт: полного перечисления узлов размерности n ⩾ 2 не существует.</p>
          </>}
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {profile.facts.map((fact) => <Panel key={fact.label}>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#171817]/42">{fact.label}</p>
          <p className="mt-5 leading-7 text-[#171817]/68">{fact.text}</p>
        </Panel>)}
      </div>
    </section>

    <section className="mx-auto max-w-[1540px] px-5 pb-16 sm:px-8 lg:px-12">
      <SectionLabel number="03 / Данные">Перечисление простых классических узлов</SectionLabel>
      <Panel className="overflow-x-auto">
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
            {rows.map((row) => <tr key={row.c} className={`border-b border-[#171817]/8 ${row.c === crossings ? 'bg-[#171817]/[0.05]' : ''} ${row.c > crossings ? 'text-[#171817]/30' : ''}`}>
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
        </p>
      </Panel>
    </section>

    <section className="mx-auto max-w-[1540px] px-5 pb-16 sm:px-8 lg:px-12">
      <SectionLabel number="04 / Контекст">Почему именно коразмерность 2</SectionLabel>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Коразмерность 1', 'Локально плоское вложение Sⁿ ⊂ Sⁿ⁺¹ ограничивает шар — обобщённая теорема Шёнфлиса (Браун, 1960, топологическая категория). Заузливаться нечему.'],
          ['Коразмерность 2', 'Единственная зона, где заузливание есть при любом n ⩾ 1 и в PL-, и в гладкой категории. Именно её описывают группы узлов, формы Зейферта и конкордантность.'],
          ['Коразмерность ⩾ 3', 'Зиман: в PL- и TOP-категориях все сферы незаузлены. В гладкой категории заузливание возвращается: Хефлигер (1962) построил бесконечно много классов вложений S³ ⊂ S⁶.'],
        ].map(([title, text]) => <Panel key={title}>
          <h3 className="text-2xl font-semibold tracking-[-0.04em]">{title}</h3>
          <p className="mt-4 leading-7 text-[#171817]/62">{text}</p>
        </Panel>)}
      </div>
    </section>

    <section className="mx-auto max-w-[1540px] px-5 pb-32 sm:px-8 lg:px-12">
      <SectionLabel number="05 / Ссылки">Источники</SectionLabel>
      <Panel>
        <ul className="grid gap-3 text-sm leading-6 text-[#171817]/62 md:grid-cols-2">
          {[
            ['M. Kervaire. Les nœuds de dimensions supérieures. Bull. SMF 93 (1965); Knot cobordism in codimension two (1971).', ''],
            ['J. Levine. Knot cobordism groups in codimension two. Comment. Math. Helv. 44 (1969).', ''],
            ['A. Ray. Slice knots and knot concordance — обзор, замечание 3.10 о высших размерностях.', 'https://arxiv.org/abs/2311.12168'],
            ['G. Friedman. Knot spinning (Handbook of Knot Theory).', 'https://arxiv.org/abs/math/0410606'],
            ['J. Hoste, M. Thistlethwaite, J. Weeks. The first 1 701 936 knots. Math. Intelligencer 20 (1998).', ''],
            ['B. Burton. The Next 350 Million Knots. SoCG 2020.', 'https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.SoCG.2020.25'],
            ['M. Thistlethwaite. The enumeration and classification of prime 20-crossing knots. Algebr. Geom. Topol. 25 (2025).', 'https://msp.org/agt/2025/25-1/agt-v25-n1-p12-p.pdf'],
            ['C. Gordon, J. Luecke. Knots are determined by their complements. JAMS 2 (1989); W. Whitten. Knot complements and groups. Topology 26 (1987).', ''],
            ['E. C. Zeeman. Unknotting spheres. Ann. of Math. (1960); A. Haefliger. Knotted (4k−1)-spheres in 6k-space. Ann. of Math. 75 (1962).', ''],
            ['OEIS A002863 (простые узлы) и A002864 (альтернированные простые узлы).', 'https://oeis.org/A002863'],
          ].map(([text, href]) => <li key={text} className="border-t border-[#171817]/10 pt-3">
            {href ? <a href={href} target="_blank" rel="noreferrer" className="border-b border-[#171817]/25 hover:border-[#171817]">{text}</a> : text}
          </li>)}
        </ul>
      </Panel>
    </section>
  </SiteShell>
}
