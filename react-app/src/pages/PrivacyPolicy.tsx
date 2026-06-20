import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-12 gap-8 animate-fade-up">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="font-display text-4xl text-foreground tracking-tight">Политика конфиденциальности сервиса Arlist ID</h1>
        <p className="text-muted-foreground text-sm">Редакция 1.0 от 20.06.2026</p>
      </div>

      {/* Card */}
      <Card className="w-full max-w-2xl shadow-2xl border-border/60" style={{ borderTopColor: 'rgba(255,255,255,0.12)' }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold tracking-tight">Политика обработки персональных данных</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 text-sm leading-relaxed">
          <p className="text-muted-foreground">
            Используя Платформу, вы подтверждаете, что ознакомились с условиями настоящей Политики конфиденциальности и принимаете их в полном объеме.
          </p>

          <div>
            <h3 className="font-semibold text-foreground mb-3">1. Оператор персональных данных</h3>
            <p className="text-muted-foreground">
              Оператором персональных данных (далее — "Оператор") является физическое лицо:
            </p>
            <p className="text-muted-foreground font-medium mt-2">
              Фамилия: Летуновский<br />
              Имя: Владимир<br />
              Отчество: Андреевич<br />
              Статус: Физическое лицо
            </p>
            <p className="text-muted-foreground mt-3">
              Оператор зарегистрирован в реестре операторов персональных данных Федеральной службы по надзору в сфере связи, информационных технологий и массовых коммуникаций (Роскомнадзор).
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">2. Собираемые данные</h3>
            <p className="text-muted-foreground mb-2"><strong>2.1. Данные, предоставляемые Пользователем:</strong></p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mb-3">
              <li>Регистрационные данные (имя, адрес электронной почты)</li>
              <li>Пароль (сохраняется в виде хэша)</li>
            </ul>
            <p className="text-muted-foreground mb-2"><strong>2.2. Данные, собираемые автоматически:</strong></p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mb-3">
              <li>Технические данные (IP-адрес, тип браузера, операционная система)</li>
              <li>Данные статистики посещений (файлы cookie, идентификаторы устройств)</li>
            </ul>
            <p className="text-muted-foreground"><strong>2.3. Обработка биометрических данных:</strong> Платформа не осуществляет сбор и обработку биометрических данных для идентификации личности.</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">3. Цели обработки данных</h3>
            <p className="text-muted-foreground mb-2">Оператор собирает и обрабатывает данные исключительно в следующих целях:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>3.1. Идентификация Пользователя для обеспечения доступа к функциям Платформы</li>
              <li>3.2. Обеспечение работы Платформы (аутентификация, верификация)</li>
              <li>3.3. Улучшение качества сервиса, анализ пользовательского опыта и исправление ошибок</li>
              <li>3.4. Коммуникация с Пользователем (отправка уведомлений)</li>
              <li>3.5. Обеспечение безопасности и предотвращение мошеннических действий</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">4. Передача данных третьим лицам</h3>
            <p className="text-muted-foreground mb-2"><strong>4.1.</strong> Оператор <strong>не продает</strong> персональные данные Пользователей.</p>
            <p className="text-muted-foreground"><strong>4.2.</strong> Передача данных третьим лицам допускается только в случаях:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Обработка данных (хостинг, аналитика)</li>
              <li>Законные требования (раскрытие строго в соответствии с законодательством РФ)</li>
              <li>Защита прав Оператора или третьих лиц</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">5. Права Пользователя</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li><strong>5.1. Право на доступ:</strong> Вы можете запросить информацию о своих данных</li>
              <li><strong>5.2. Право на уточнение:</strong> Вы можете требовать изменения или дополнения данных</li>
              <li><strong>5.3. Право на удаление:</strong> Вы можете инициировать удаление учетной записи</li>
              <li><strong>5.4. Отзыв согласия:</strong> Вы можете отозвать согласие на обработку персональных данных</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">6. Файлы cookie (Cookies)</h3>
            <p className="text-muted-foreground">
              Платформа использует файлы cookie для обеспечения работы и сбора статистики. Вы можете настроить отключение cookie в настройках браузера.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">7. Контактная информация</h3>
            <p className="text-muted-foreground">
              По всем вопросам, связанным с обработкой персональных данных:
            </p>
            <div className="text-muted-foreground space-y-1 mt-2">
              <div><strong>Email:</strong> letunovskiu2011@yandex.ru</div>
              <div><strong>Telegram:</strong> <a href="https://t.me/kompotomanya" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">@kompotomanya</a></div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-muted-foreground text-xs">
              Данная политика конфиденциальности разработана в соответствии с Федеральным законом от 27 июля 2006 г. № 152-ФЗ "О защите персональных данных" и требованиями Роскомнадзора.
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
