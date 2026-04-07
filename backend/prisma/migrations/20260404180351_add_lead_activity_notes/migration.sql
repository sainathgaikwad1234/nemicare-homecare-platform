-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('LEAD_CREATED', 'STATUS_CHANGED', 'NOTE_ADDED', 'CALL_MADE', 'SMS_SENT', 'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'DOCUMENT_SENT', 'RATE_CARD_SENT', 'LEAD_REJECTED', 'LEAD_CONVERTED');

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "leadId" INTEGER NOT NULL,
    "activityType" "LeadActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "leadId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER NOT NULL,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "LeadActivity_activityType_idx" ON "LeadActivity"("activityType");

-- CreateIndex
CREATE INDEX "LeadActivity_createdAt_idx" ON "LeadActivity"("createdAt");

-- CreateIndex
CREATE INDEX "LeadNote_leadId_idx" ON "LeadNote"("leadId");

-- CreateIndex
CREATE INDEX "LeadNote_createdById_idx" ON "LeadNote"("createdById");

-- CreateIndex
CREATE INDEX "LeadNote_isPrivate_idx" ON "LeadNote"("isPrivate");

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
