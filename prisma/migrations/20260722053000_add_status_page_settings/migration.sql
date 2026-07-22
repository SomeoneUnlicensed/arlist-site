-- CreateTable
CREATE TABLE "StatusPageSetting" (
    "id" TEXT NOT NULL DEFAULT 'status',
    "productName" TEXT NOT NULL DEFAULT 'Поток.Статус',
    "pageTitle" TEXT NOT NULL DEFAULT 'Статус сервисов Арлист',
    "description" TEXT NOT NULL DEFAULT 'Актуальное состояние сервисов, история инцидентов и плановые работы.',
    "supportEmail" TEXT NOT NULL DEFAULT 'hello@arlist.ru',
    "customDomain" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
    "historyDays" INTEGER NOT NULL DEFAULT 90,
    "refreshSeconds" INTEGER NOT NULL DEFAULT 60,
    "showUptimePercent" BOOLEAN NOT NULL DEFAULT true,
    "showHistory" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPageSetting_pkey" PRIMARY KEY ("id")
);
