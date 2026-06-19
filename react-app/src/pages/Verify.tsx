import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const OTP_LENGTH = 6

const Verify = () => {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMsg, setResendMsg] = useState('')
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const returnTo = searchParams.get('return_to')
  const navigate = useNavigate()
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { refs.current[0]?.focus() }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const v = value.slice(-1)
    const next = [...digits]; next[index] = v; setDigits(next)
    if (v && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < text.length; i++) next[i] = text[i]
    setDigits(next)
    refs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < OTP_LENGTH) return
    setError(''); setLoading(true)
    try {
      await axios.post('/api/auth/verify', { email, code })
      const params = new URLSearchParams({ verified: 'true' })
      if (returnTo) params.set('return_to', returnTo)
      navigate(`/login?${params.toString()}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Неверный или истёкший код')
      setDigits(Array(OTP_LENGTH).fill(''))
      setTimeout(() => refs.current[0]?.focus(), 50)
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return
    setResendMsg(''); setError('')
    try {
      await axios.post('/api/auth/resend-verification', { email })
      setResendMsg('Новый код отправлен')
      setResendCooldown(60)
      setDigits(Array(OTP_LENGTH).fill(''))
      setTimeout(() => refs.current[0]?.focus(), 50)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка отправки')
    }
  }

  const isComplete = digits.every(d => d !== '')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8 animate-fade-up">
      <div className="text-center space-y-1">
        <h1 className="font-display text-5xl text-foreground tracking-tight">Arlist ID</h1>
        <p className="text-muted-foreground text-sm">Arlist ID — единый ключ к вашим сервисам.</p>
      </div>

      <Card className="w-full max-w-sm shadow-2xl border-border/60" style={{ borderTopColor: 'rgba(255,255,255,0.12)' }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">Подтверждение</CardTitle>
          <CardDescription>
            {email
              ? <>Код отправлен на <span className="text-foreground font-medium">{email}</span></>
              : 'Введите код из письма.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {resendMsg && <Alert variant="success"><AlertDescription>{resendMsg}</AlertDescription></Alert>}

          <form id="verify-form" onSubmit={handleSubmit}>
            <div className="flex gap-2 mb-4" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { refs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  className={`otp-input${d ? ' filled' : ''}`}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                />
              ))}
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button form="verify-form" type="submit" className="w-full" disabled={loading || !isComplete}>
            {loading && <Loader2 className="animate-spin" size={15} />}
            {loading ? 'Проверяем...' : 'Подтвердить'}
          </Button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || !email}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Отправить повторно через ${resendCooldown}с` : 'Отправить код повторно'}
          </button>
          <p className="text-center text-sm">
            <Link
              to={returnTo ? `/register?return_to=${encodeURIComponent(returnTo)}` : '/register'}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Назад к регистрации
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Verify
