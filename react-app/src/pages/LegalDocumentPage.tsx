import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SiteShell } from '@/components/SiteShell'

const sections: Array<[string, ReactNode]> = [
  ['1. Собираемые данные', <>Регистрационные данные включают имя, email и логин; пользовательский контент — репозитории, комментарии, файлы и изображения. Автоматически могут собираться IP-адрес, тип браузера, операционная система, реферер, cookie и идентификаторы устройств. Биометрические данные не собираются, кроме отдельно согласованных функций.</>],
  ['2. Цели обработки данных', <>Данные используются для идентификации, работы платформы и совместной работы над проектами, улучшения сервиса, уведомлений, безопасности и предотвращения мошенничества.</>],
  ['3. Передача данных третьим лицам', <>Оператор <strong>не продаёт</strong> персональные данные. Передача допустима для инфраструктурной обработки, по законным требованиям и для защиты прав Оператора или третьих лиц.</>],
  ['4. Права пользователя', <>Пользователь вправе запросить доступ к данным, их уточнение, удаление учётной записи и отзыв согласия на обработку.</>],
  ['5. Файлы cookie (Cookies)', <>Платформа использует cookie для обеспечения работы и сбора статистики. Cookie можно отключить в настройках браузера.</>],
  ['6. Контактная информация', <>По вопросам обработки персональных данных: <a className="underline" href="mailto:hello@arlist.ru">hello@arlist.ru</a>.</>],
]

export const LegalDocumentPage = () => {
  useEffect(() => { document.title = 'Политика конфиденциальности Geotekt — Арлист Тех' }, [])
  return <SiteShell><article className="mx-auto max-w-[960px] px-5 py-20 sm:px-8 sm:py-28"><Link to="/legal" className="font-mono text-[10px] uppercase tracking-[.16em] text-[#171817]/48">← К документам</Link><div className="mt-10 rounded-[24px] border border-[#171817]/14 bg-[#fafaf1]/82 p-6 sm:p-12"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#171817]/42">Редакция 1.0 от 17.03.2026</p><h1 className="mt-6 text-4xl font-semibold leading-tight tracking-[-.055em] sm:text-6xl">Политика конфиденциальности сервиса Geotekt</h1><p className="mt-7 leading-7 text-[#171817]/65">Используя Платформу, вы подтверждаете, что ознакомились с условиями настоящей Политики конфиденциальности и принимаете их в полном объёме.</p>{sections.map(([title,text]) => <section key={title} className="mt-9 border-t border-[#171817]/12 pt-8"><h2 className="text-2xl font-semibold tracking-[-.04em]">{title}</h2><div className="mt-4 leading-7 text-[#171817]/65">{text}</div></section>)}</div></article></SiteShell>
}
