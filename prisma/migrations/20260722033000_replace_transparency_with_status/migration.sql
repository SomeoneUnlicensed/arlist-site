-- CreateEnum
CREATE TYPE "IncidentImpact" AS ENUM ('CRITICAL', 'MAJOR', 'MINOR');

-- CreateEnum
CREATE TYPE "StatusIncidentState" AS ENUM ('INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ComponentStatus" AS ENUM ('OPERATIONAL', 'DEGRADED', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "MaintenanceState" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- DropTable
DROP TABLE IF EXISTS "TransparencyEntry";

-- DropEnum
DROP TYPE IF EXISTS "TransparencyEntryType";

-- DropEnum
DROP TYPE IF EXISTS "IncidentSeverity";

-- DropEnum
DROP TYPE IF EXISTS "IncidentStatus";

-- CreateTable
CREATE TABLE "StatusComponent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "group" TEXT NOT NULL DEFAULT 'Сервисы',
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ComponentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusIncident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "impact" "IncidentImpact" NOT NULL,
    "status" "StatusIncidentState" NOT NULL DEFAULT 'INVESTIGATING',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentUpdate" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "status" "StatusIncidentState" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledMaintenance" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "MaintenanceState" NOT NULL DEFAULT 'SCHEDULED',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StatusComponentToStatusIncident" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ScheduledMaintenanceToStatusComponent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "StatusComponent_slug_key" ON "StatusComponent"("slug");

-- CreateIndex
CREATE INDEX "StatusComponent_isVisible_order_idx" ON "StatusComponent"("isVisible", "order");

-- CreateIndex
CREATE INDEX "StatusIncident_isPublished_status_publishedAt_idx" ON "StatusIncident"("isPublished", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "IncidentUpdate_incidentId_createdAt_idx" ON "IncidentUpdate"("incidentId", "createdAt");

-- CreateIndex
CREATE INDEX "ScheduledMaintenance_isPublished_startsAt_idx" ON "ScheduledMaintenance"("isPublished", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "_StatusComponentToStatusIncident_AB_unique" ON "_StatusComponentToStatusIncident"("A", "B");

-- CreateIndex
CREATE INDEX "_StatusComponentToStatusIncident_B_index" ON "_StatusComponentToStatusIncident"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ScheduledMaintenanceToStatusComponent_AB_unique" ON "_ScheduledMaintenanceToStatusComponent"("A", "B");

-- CreateIndex
CREATE INDEX "_ScheduledMaintenanceToStatusComponent_B_index" ON "_ScheduledMaintenanceToStatusComponent"("B");

-- AddForeignKey
ALTER TABLE "IncidentUpdate" ADD CONSTRAINT "IncidentUpdate_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "StatusIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StatusComponentToStatusIncident" ADD CONSTRAINT "_StatusComponentToStatusIncident_A_fkey" FOREIGN KEY ("A") REFERENCES "StatusComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StatusComponentToStatusIncident" ADD CONSTRAINT "_StatusComponentToStatusIncident_B_fkey" FOREIGN KEY ("B") REFERENCES "StatusIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ScheduledMaintenanceToStatusComponent" ADD CONSTRAINT "_ScheduledMaintenanceToStatusComponent_A_fkey" FOREIGN KEY ("A") REFERENCES "ScheduledMaintenance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ScheduledMaintenanceToStatusComponent" ADD CONSTRAINT "_ScheduledMaintenanceToStatusComponent_B_fkey" FOREIGN KEY ("B") REFERENCES "StatusComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
