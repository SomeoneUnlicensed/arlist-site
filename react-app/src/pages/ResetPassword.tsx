import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const ResetPassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/auth/reset-password', { token, newPassword: password })
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось сбросить пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8 animate-fade-up">
      <div className="text-center space-y-1">
        <h1 className="font-display text-5xl text-foreground tracking-tight">Arlist ID</h1>
        <p className="text-muted-foreground text-sm">Arlist ID — единый ключ к вашим сервисам.</p>
      </div>

      <Card className="w-full max-w-sm shadow-2xl border-border/60" style={{ borderTopColor: 'rgba(255,255,255,0.12)' }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">Новый пароль</CardTitle>
          <CardDescription>Придумайте новый пароль для входа</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!token && (
            <Alert variant="destructive">
              <AlertDescription>Ссылка повреждена: отсутствует токен сброса пароля.</AlertDescription>
            </Alert>
          )}
          {done ? (
            <Alert variant="success">
              <AlertDescription>Пароль изменён. Сейчас перенаправим на страницу входа...</AlertDescription>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form id="reset-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Новый пароль</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Повторите пароль</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </form>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          {!done && (
            <Button form="reset-form" type="submit" className="w-full" disabled={loading || !token}>
              {loading && <Loader2 className="animate-spin" size={15} />}
              {loading ? 'Сохраняем...' : 'Сохранить пароль'}
            </Button>
          )}
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-foreground font-medium hover:opacity-70 transition-opacity">
              ← Назад ко входу
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ResetPassword
