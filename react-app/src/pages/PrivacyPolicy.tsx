import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-12 gap-8 animate-fade-up">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="font-display text-5xl text-foreground tracking-tight">Политика конфиденциальности</h1>
        <p className="text-muted-foreground text-sm">Arlist ID — единый ключ к вашим сервисам.</p>
      </div>

      {/* Card */}
      <Card className="w-full max-w-2xl shadow-2xl border-border/60" style={{ borderTopColor: 'rgba(255,255,255,0.12)' }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">Политика обработки персональных данных</CardTitle>
          <CardDescription>Arlist ID - служба аутентификации</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 prose prose-invert text-sm leading-relaxed">
          <div>
            <h3 className="font-semibold text-foreground mb-3">1. Оператор персональных данных</h3>
            <p className="text-muted-foreground">
              Оператором персональных данных (далее — "Оператор") является физическое лицо:
            </p>
            <p className="text-muted-foreground font-medium mt-2">
              Фамилия: Летуновский<br />
              Имя: Владимир<br />
              Статус: Физическое лицо
            </p>
            <p className="text-muted-foreground mt-3">
              Оператор зарегистрирован в реестре операторов персональных данных Федеральной службы по надзору в сфере образования и науки (РКН).
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">2. Цели обработки персональных данных</h3>
            <p className="text-muted-foreground">
              Персональные данные обрабатываются в следующих целях:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Создание и ведение пользовательского аккаунта</li>
              <li>Предоставление доступа к сервисам Arlist ID</li>
              <li>Аутентификация пользователя</li>
              <li>Коммуникация с пользователем</li>
              <li>Обеспечение безопасности и защиты от злоупотреблений</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">3. Обрабатываемые персональные данные</h3>
            <p className="text-muted-foreground">
              При регистрации и использовании Arlist ID обрабатываются следующие персональные данные:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Имя пользователя</li>
              <li>Адрес электронной почты</li>
              <li>Хэш пароля</li>
              <li>IP-адрес при подключении</li>
              <li>Информация об устройстве и браузере</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">4. Правовые основания обработки</h3>
            <p className="text-muted-foreground">
              Обработка персональных данных осуществляется на основании:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Согласия субъекта персональных данных</li>
              <li>Исполнения договора с субъектом персональных данных</li>
              <li>Законодательства Российской Федерации о защите персональных данных</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">5. Хранение данных</h3>
            <p className="text-muted-foreground">
              Персональные данные хранятся на защищённых серверах. Сроки хранения персональных данных определяются целью обработки и требованиями законодательства Российской Федерации.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">6. Права субъектов персональных данных</h3>
            <p className="text-muted-foreground">
              Вы имеете право:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Требовать подтверждение обработки ваших персональных данных</li>
              <li>Получать информацию об обработке ваших данных</li>
              <li>Требовать исправление неточных данных</li>
              <li>Требовать удаление данных (право быть забытым)</li>
              <li>Требовать ограничение обработки данных</li>
              <li>Отозвать согласие на обработку данных</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">7. Контактная информация</h3>
            <p className="text-muted-foreground">
              По вопросам обработки персональных данных вы можете обратиться к оператору через форму обратной связи на сайте Arlist ID или направить письмо на адрес электронной почты поддержки.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">8. Изменения в политике</h3>
            <p className="text-muted-foreground">
              Оператор имеет право в одностороннем порядке изменять условия политики конфиденциальности. Изменения вступают в силу с момента их опубликования на сайте.
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-muted-foreground text-xs">
              Данная политика конфиденциальности разработана в соответствии с Федеральным законом от 27 июля 2006 г. № 152-ФЗ "О защите персональных данных".
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Back Link */}
      <div className="w-full max-w-2xl">
        <Link
          to="/register"
          className="text-foreground font-medium hover:opacity-70 transition-opacity text-sm"
        >
          ← Вернуться к регистрации
        </Link>
      </div>
    </div>
  )
}

export default PrivacyPolicy
