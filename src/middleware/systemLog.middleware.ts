import type { NextFunction, Request, Response } from 'express'
import type { SystemLogCategory, SystemLogLevel } from '@prisma/client'
import { writeSystemLog } from '../services/systemLog.service.js'

type AuthenticatedRequest = Request & { user?: { userId?: string; role?: string } }

const ignoredPaths = new Set(['/api/health', '/api/admin/logs', '/api/status', '/api/auth/registration-status'])

function cleanIp(value: string | undefined): string | null {
  if (!value) return null
  return value.replace(/^::ffff:/, '').slice(0, 128)
}

function subjectFor(req: Request): string | null {
  if (!req.path.startsWith('/api/auth/')) return null
  const email = req.body?.email
  return typeof email === 'string' ? email.trim().toLowerCase().slice(0, 320) : null
}

function describe(method: string, path: string, status: number): { category: SystemLogCategory; event: string } {
  const failed = status >= 400
  if (path === '/api/auth/login' || path === '/api/auth/verify-login-2fa') return { category: 'AUTH', event: failed ? 'Неудачная попытка входа' : 'Успешный вход' }
  if (path === '/api/auth/logout') return { category: 'AUTH', event: 'Выход из аккаунта' }
  if (path === '/api/auth/register') return { category: 'AUTH', event: failed ? 'Неудачная регистрация аккаунта' : 'Регистрация нового аккаунта' }
  if (path === '/api/auth/profile') return { category: 'AUTH', event: failed ? 'Ошибка доступа к профилю' : method === 'GET' ? 'Профиль пользователя открыт' : 'Профиль пользователя изменён' }
  if (path === '/api/auth/forgot-password') return { category: 'SECURITY', event: 'Запрос восстановления пароля' }
  if (path === '/api/auth/reset-password') return { category: 'SECURITY', event: failed ? 'Неудачный сброс пароля' : 'Пароль изменён' }
  if (path === '/api/auth/change-password') return { category: 'SECURITY', event: failed ? 'Неудачная смена пароля' : 'Пароль изменён в профиле' }
  if (path.startsWith('/api/admin/status')) return { category: 'STATUS', event: failed ? `Ошибка status page: ${method} ${path}` : method === 'GET' ? 'Данные status page загружены' : `Status page изменена: ${method} ${path}` }
  if (path.startsWith('/api/admin/users')) return { category: 'ADMIN', event: failed ? `Ошибка управления пользователем: ${method} ${path}` : method === 'GET' ? 'Список пользователей загружен' : `Пользователь изменён: ${method} ${path}` }
  if (path.startsWith('/api/admin/models')) return { category: 'ADMIN', event: failed ? `Ошибка управления моделью ИИ: ${method} ${path}` : method === 'GET' ? 'Список моделей ИИ загружен' : `Модель ИИ изменена: ${method} ${path}` }
  if (path.startsWith('/api/admin/settings')) return { category: 'ADMIN', event: failed ? 'Ошибка системных настроек' : method === 'GET' ? 'Системные настройки загружены' : 'Системные настройки изменены' }
  if (path.startsWith('/api/admin/broadcast')) return { category: 'MAIL', event: failed ? 'Ошибка запуска рассылки' : 'Запущена почтовая рассылка' }
  if (path.startsWith('/api/admin')) return { category: 'ADMIN', event: `Административный запрос: ${method} ${path}` }
  if (path.startsWith('/api/v1/chat')) return { category: 'API', event: failed ? 'Ошибка запроса к модели' : 'Запрос к модели выполнен' }
  if (path.startsWith('/interaction') || path.startsWith('/auth') || path.startsWith('/token')) return { category: 'OIDC', event: `${failed ? 'Ошибка OIDC' : 'OIDC-запрос'}: ${method} ${path}` }
  return { category: 'API', event: `${failed ? 'Ошибка запроса' : 'HTTP-запрос'}: ${method} ${path}` }
}

export function systemLogMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const path = req.path
  const isRelevant = path.startsWith('/api/') || path.startsWith('/interaction') || path.startsWith('/auth') || path.startsWith('/token')
  if (!isRelevant || ignoredPaths.has(path) || path.startsWith('/api/captcha')) return next()

  const startedAt = performance.now()
  const subject = subjectFor(req)
  res.on('finish', () => {
    const statusCode = res.statusCode
    const level: SystemLogLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO'
    const { category, event } = describe(req.method, path, statusCode)
    void writeSystemLog({
      level,
      category,
      event,
      userId: req.user?.userId ?? null,
      subject,
      ipAddress: cleanIp(req.ip),
      userAgent: req.get('user-agent')?.slice(0, 500) ?? null,
      method: req.method,
      path,
      statusCode,
      durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
      metadata: req.user?.role ? { role: req.user.role } : undefined,
    })
  })
  next()
}
