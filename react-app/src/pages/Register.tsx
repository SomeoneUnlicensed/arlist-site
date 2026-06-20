import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [agreedToPolicy, setAgreedToPolicy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('return_to')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!agreedToPolicy) {
      setError('Вы должны согласиться с политикой конфиденциальности')
      return
    }
    
    setLoading(true)
    try {
      await axios.post('/api/auth/register', { email, password, name, agreedToPolicy })
      const params = new URLSearchParams({ email })
      if (returnTo) params.set('return_to', returnTo)
      navigate(`/verify?${params.toString()}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка регистрации')
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
          <CardTitle className="text-lg font-semibold tracking-tight">Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт Arlist ID</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form id="register-form" onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Как вас зовут?"
                autoComplete="name"
              />
            </div>
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
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                autoComplete="new-password"
                required
              />
            </div>
            
            <div className="flex items-start space-x-2 pt-2">
              <input
                id="policy-agreement"
                name="policy-agreement"
                type="checkbox"
                checked={agreedToPolicy}
                onChange={e => setAgreedToPolicy(e.target.checked)}
                className="mt-1 cursor-pointer"
              />
              <Label htmlFor="policy-agreement" className="cursor-pointer text-sm font-normal">
                Я согласен с{' '}
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  className="text-foreground font-medium hover:opacity-70 transition-opacity underline"
                >
                  политикой конфиденциальности
                </Link>
              </Label>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button form="register-form" type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" size={15} />}
            {loading ? 'Создаём...' : 'Создать аккаунт'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link
              to={returnTo ? `/login?return_to=${encodeURIComponent(returnTo)}` : '/login'}
              className="text-foreground font-medium hover:opacity-70 transition-opacity"
            >
              Войти
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Register
