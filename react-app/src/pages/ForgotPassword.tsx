import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await axios.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось отправить письмо')
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
          <CardTitle className="text-lg font-semibold tracking-tight">Восстановление пароля</CardTitle>
          <CardDescription>Укажите email, и мы отправим ссылку для сброса пароля</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {sent ? (
            <Alert variant="success">
              <AlertDescription>Если такой email зарегистрирован, на него отправлена ссылка для сброса пароля. Проверьте почту.</AlertDescription>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form id="forgot-form" onSubmit={handleSubmit} className="space-y-4">
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
              </form>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          {!sent && (
            <Button form="forgot-form" type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" size={15} />}
              {loading ? 'Отправляем...' : 'Отправить ссылку'}
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

export default ForgotPassword
