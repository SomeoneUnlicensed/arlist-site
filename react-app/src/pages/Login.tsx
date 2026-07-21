import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InvisibleAltcha, useAltchaPayload } from '@/hooks/useAltchaPayload'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needs2fa, setNeeds2fa] = useState(false)
  const [code, setCode] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { getPayload: getCaptchaPayload, widgetRef: captchaWidgetRef } = useAltchaPayload()

  const verified = searchParams.get('verified')

  useEffect(() => {
    axios.get('/api/auth/profile').then(() => {
      const returnTo = searchParams.get('return_to')
      window.location.href = returnTo || '/profile'
    }).catch(() => {})
  }, [])

  const goToReturnTo = () => {
    const returnTo = searchParams.get('return_to')
    if (returnTo) {
      window.location.href = returnTo
    } else {
      navigate('/profile')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const captcha = await getCaptchaPayload()
      if (!captcha) {
        setError('Не удалось пройти антибот-проверку. Обновите страницу и попробуйте снова.')
        return
      }

      const r = await axios.post('/api/auth/login', { email, password, captcha })
      if (r.data?.requires2fa) {
        setNeeds2fa(true)
      } else {
        goToReturnTo()
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await axios.post('/api/auth/verify-login-2fa', { email, code })
      goToReturnTo()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Неверный или истёкший код')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-landing relative min-h-screen overflow-hidden bg-[#edf3df] text-[#171817] animate-fade-up">
      <InvisibleAltcha widgetRef={captchaWidgetRef} />
      <div className="auth-landing__glow" aria-hidden="true" />

      <header className="relative z-10 mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:h-24 sm:px-8 lg:px-12">
        <Link to="/" className="font-brand text-sm font-semibold lowercase tracking-[-0.07em] sm:text-base">арлист тех</Link>
        <Link to="/" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#171817]/55 transition-colors hover:text-[#171817]"><ArrowLeft className="h-3.5 w-3.5" /> На главную</Link>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-6rem)] max-w-[1440px] items-center gap-14 px-5 pb-16 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-12">
        <section className="hidden max-w-2xl lg:block">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#171817]/45">Единый аккаунт Арлист</p>
          <h1 className="mt-8 text-[clamp(4.5rem,7vw,7.5rem)] font-semibold leading-[0.88] tracking-[-0.075em]">Один вход.<br />Все сервисы.</h1>
          <p className="mt-9 max-w-md text-lg leading-8 text-[#171817]/60">Без лишних профилей и повторных регистраций. Управляйте безопасностью и доступом в одном месте.</p>
          <div className="mt-14 flex items-center gap-3 text-sm text-[#171817]/58"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#171817]/16 bg-[#fafaf1]/60"><ShieldCheck className="h-4 w-4" /></span> Защищённый вход и двухфакторная проверка</div>
        </section>

        <section className="mx-auto w-full max-w-[480px]">
          <div className="mb-7 lg:hidden"><p className="font-brand text-3xl font-semibold lowercase tracking-[-0.07em]">арлист id</p><p className="mt-2 text-sm text-[#171817]/55">Единый ключ к вашим сервисам.</p></div>
          <Card className="rounded-[28px] border-[#171817]/14 bg-[#fafaf1]/88 shadow-[0_30px_100px_rgba(68,78,45,0.16)] backdrop-blur-xl">
            <CardHeader className="px-6 pb-5 pt-7 sm:px-9 sm:pt-9">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#171817]/40">Арлист ID</p>
              <CardTitle className="mt-5 text-3xl font-semibold tracking-[-0.055em]">Добро пожаловать</CardTitle>
              <CardDescription className="text-[#171817]/52">Войдите в свой аккаунт</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 px-6 sm:px-9">
              {verified && <Alert variant="success"><AlertDescription>Email подтверждён — можете войти.</AlertDescription></Alert>}
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              {needs2fa ? <>
                <Alert variant="success"><AlertDescription>Код для входа отправлен на {email}</AlertDescription></Alert>
                <form id="login-2fa-form" onSubmit={handleVerify2fa} className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="code">Код из письма</Label><Input id="code" name="code" type="text" inputMode="numeric" value={code} onChange={e => setCode(e.target.value)} placeholder="123456" maxLength={6} autoFocus required className="h-12 bg-white/35" /></div>
                </form>
              </> : <form id="login-form" onSubmit={handleSubmit} autoComplete="on" className="space-y-5">
                <div className="space-y-2"><Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.13em]">Email</Label><Input id="email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required className="h-12 bg-white/35" /></div>
                <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.13em]">Пароль</Label><Link to="/forgot-password" className="text-xs text-[#171817]/48 hover:text-[#171817]">Забыли пароль?</Link></div><Input id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required className="h-12 bg-white/35" /></div>
              </form>}
            </CardContent>

            <CardFooter className="flex flex-col gap-4 px-6 pb-7 pt-3 sm:px-9 sm:pb-9">
              {needs2fa ? <Button form="login-2fa-form" type="submit" className="h-12 w-full rounded-xl" disabled={loading || code.length < 6}>{loading && <Loader2 className="animate-spin" size={15} />}{loading ? 'Проверяем...' : 'Подтвердить'}</Button> : <>
                <Button form="login-form" type="submit" className="group h-12 w-full rounded-xl" disabled={loading}>{loading && <Loader2 className="animate-spin" size={15} />}<span>{loading ? 'Входим...' : 'Войти'}</span>{!loading && <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />}</Button>
                <p className="text-center text-sm text-[#171817]/52">Нет аккаунта?{' '}<Link to={searchParams.get('return_to') ? `/register?return_to=${encodeURIComponent(searchParams.get('return_to')!)}` : '/register'} className="font-medium text-[#171817] hover:opacity-60">Создать</Link></p>
              </>}
            </CardFooter>
          </Card>
        </section>
      </main>
    </div>
  )
}

export default Login
