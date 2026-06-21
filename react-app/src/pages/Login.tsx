import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needs2fa, setNeeds2fa] = useState(false)
  const [code, setCode] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

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
      const r = await axios.post('/api/auth/login', { email, password })
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8 animate-fade-up">
      {/* Brand */}
      <div className="text-center space-y-1">
        <h1 className="font-display text-5xl text-foreground tracking-tight">Arlist ID</h1>
        <p className="text-muted-foreground text-sm">Arlist ID — единый ключ к вашим сервисам.</p>
      </div>

      {/* Card */}
      <Card className="w-full max-w-sm shadow-2xl border-border/60" style={{ borderTopColor: 'rgba(255,255,255,0.12)' }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">Вход</CardTitle>
          <CardDescription>Войдите в свой аккаунт</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {verified && (
            <Alert variant="success">
              <AlertDescription>Email подтверждён — можете войти.</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {needs2fa ? (
            <>
              <Alert variant="success">
                <AlertDescription>Код для входа отправлен на {email}</AlertDescription>
              </Alert>
              <form id="login-2fa-form" onSubmit={handleVerify2fa} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Код из письма</Label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                    required
                  />
                </div>
              </form>
            </>
          ) : (
            <form id="login-form" onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Пароль</Label>
                  <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-opacity">
                    Забыли пароль?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          {needs2fa ? (
            <Button form="login-2fa-form" type="submit" className="w-full" disabled={loading || code.length < 6}>
              {loading && <Loader2 className="animate-spin" size={15} />}
              {loading ? 'Проверяем...' : 'Подтвердить'}
            </Button>
          ) : (
            <>
              <Button form="login-form" type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="animate-spin" size={15} />}
                {loading ? 'Входим...' : 'Войти'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Нет аккаунта?{' '}
                <Link
                  to={searchParams.get('return_to') ? `/register?return_to=${encodeURIComponent(searchParams.get('return_to')!)}` : '/register'}
                  className="text-foreground font-medium hover:opacity-70 transition-opacity"
                >
                  Создать
                </Link>
              </p>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

export default Login
