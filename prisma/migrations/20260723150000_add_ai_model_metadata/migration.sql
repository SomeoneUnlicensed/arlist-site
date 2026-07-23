-- AlterTable
ALTER TABLE "AiModel" ADD COLUMN     "description" TEXT,
ADD COLUMN     "contextWindow" INTEGER,
ADD COLUMN     "maxOutputTokens" INTEGER,
ADD COLUMN     "supportsReasoning" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supportsFunctionCalling" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "extraRequestParams" JSONB,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;
