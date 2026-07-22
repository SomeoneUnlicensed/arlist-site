import prisma from './prisma.service.js'

const DEFAULT_COMPONENTS = [
  { slug: 'website', name: 'Сайт Арлист', description: 'Публичные страницы arlist.ru', group: 'Арлист Тех', order: 10 },
  { slug: 'arlist-id', name: 'Arlist ID', description: 'Авторизация, профиль и OIDC', group: 'Платформа', order: 20 },
  { slug: 'api', name: 'Arlist API', description: 'API и шлюз моделей', group: 'Платформа', order: 30 },
  { slug: 'litkot', name: 'ЛитКот', description: 'Образовательная платформа', group: 'Продукты', order: 40 },
  { slug: 'vspyshka', name: 'Вспышка', description: 'ИИ-агент и CLI-авторизация', group: 'Продукты', order: 50 },
]

export async function ensureDefaultStatusComponents(): Promise<number> {
  const result = await prisma.statusComponent.createMany({ data: DEFAULT_COMPONENTS, skipDuplicates: true })
  return result.count
}
