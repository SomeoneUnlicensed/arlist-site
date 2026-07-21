import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { Check, Terminal, Loader2, ArrowRight, Copy, CheckCheck, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const Steps = [
  { num: 1, label: 'Введи код' },
  { num: 2, label: 'Подтверди' },
  { num: 3, label: 'Начни работу' },
]

const CliAuth = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const codeFromUrl = searchParams.get('code') || ''

  const [step, setStep] = useState<'code' | 'login' | 'confirm' | 'done'>(codeFromUrl ? 'login' : 'code')
  const [userCode, setUserCode] = useState(codeFromUrl)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    axios.get('/api/auth/profile').then(r => {
      setUser(r.data)
      if (codeFromUrl) setStep('confirm')
    }).catch(() => {})
  }, [])

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userCode.length < 9) return
    if (user) {
      setStep('confirm')
    } else {
      setStep('login')
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      await axios.post('/api/cli/auth/confirm', { code: userCode })
      setStep('done')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка подтверждения')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(userCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'code') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8 animate-fade-up">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-700 to-blue-500 flex items-center justify-center shadow-lg shadow-lime-700/20 mb-4">
            <Terminal size={28} className="text-white" />
          </div>
          <h1 className="font-display text-4xl text-foreground tracking-tight">Подключение CLI</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Введи код, который отобразился в терминале, чтобы авторизовать устройство
          </p>
        </div>

        <Card className="w-full max-w-sm shadow-2xl border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">Код из терминала</CardTitle>
            <CardDescription>Формат: XXXX-XXXX</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={userCode}
                  onChange={e => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
                    if (val.length <= 9) setUserCode(val)
                  }}
                  placeholder="XXXX-XXXX"
                  className="text-center text-xl font-mono tracking-[0.3em] h-14"
                  maxLength={9}
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={userCode.length < 9}>
                <ArrowRight size={16} className="mr-2" />
                Продолжить
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-4">
            <p className="text-xs text-muted-foreground">
              Нет кода? Запусти <code className="text-foreground bg-accent px-1.5 py-0.5 rounded text-[11px]">arlist</code> в терминале
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (step === 'login') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8 animate-fade-up">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-700 to-blue-500 flex items-center justify-center shadow-lg shadow-lime-700/20 mb-4">
            <Terminal size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl text-foreground tracking-tight">Войди в аккаунт</h1>
          <p className="text-muted-foreground text-sm">
            Чтобы продолжить, войди или создай аккаунт
          </p>
        </div>

        <Card className="w-full max-w-sm shadow-2xl border-border/60">
          <CardContent className="pt-6 space-y-3">
            <Alert className="border-lime-700/20 bg-lime-900/10">
              <AlertDescription className="flex items-center gap-2 text-sm">
                <Check size={14} className="text-lime-700 shrink-0" />
                Код <span className="font-mono text-foreground font-medium">{userCode}</span>
              </AlertDescription>
            </Alert>
            <Link to={`/login?return_to=${encodeURIComponent('/cli/auth?code=' + userCode)}`}>
              <Button className="w-full h-11">
                <LogIn size={16} className="mr-2" />
                Войти
              </Button>
            </Link>
            <Link to={`/register?return_to=${encodeURIComponent('/cli/auth?code=' + userCode)}`}>
              <Button variant="outline" className="w-full h-11">
                Создать аккаунт
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8 animate-fade-up">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-700 to-blue-500 flex items-center justify-center shadow-lg shadow-lime-700/20 mb-4">
            <Terminal size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl text-foreground tracking-tight">Подтверди устройство</h1>
          <p className="text-muted-foreground text-sm">
            Ты сейчас авторизуешь CLI-устройство
          </p>
        </div>

        <Card className="w-full max-w-sm shadow-2xl border-border/60">
          <CardContent className="pt-6 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Alert className="border-lime-700/20 bg-lime-900/10">
              <AlertDescription className="flex items-center gap-2 text-sm">
                <Check size={14} className="text-lime-700 shrink-0" />
                Код: <span className="font-mono text-foreground font-medium">{userCode}</span>
              </AlertDescription>
            </Alert>
            <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Аккаунт</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <Button onClick={handleConfirm} className="w-full h-11" disabled={loading}>
              {loading && <Loader2 className="animate-spin mr-2" size={16} />}
              {loading ? 'Подтверждаем...' : 'Подтвердить устройство'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8 animate-fade-up">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-4">
          <CheckCheck size={32} className="text-emerald-400" />
        </div>
        <h1 className="font-display text-3xl text-foreground tracking-tight">Устройство подключено!</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Можешь вернуться в терминал — CLI уже получил API ключ
        </p>
      </div>

      <Card className="w-full max-w-sm shadow-2xl border-border/60">
        <CardContent className="pt-6 space-y-4">
          <div className="rounded-xl border border-border/50 bg-card/60 p-5 text-center space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Шаги</p>
            <div className="flex justify-center gap-3">
              {Steps.map((s, i) => (
                <div key={s.num} className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < 3 ? 'bg-lime-700 text-white' : 'bg-accent text-muted-foreground'
                  }`}>
                    {i < 3 ? <Check size={14} /> : s.num}
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:inline">{s.label}</span>
                  {i < 2 && <ArrowRight size={12} className="text-muted-foreground/40" />}
                </div>
              ))}
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => navigate('/profile')}>
            Перейти в профиль
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default CliAuth
