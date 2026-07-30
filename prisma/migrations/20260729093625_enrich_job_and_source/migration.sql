/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `job_sources` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "JobRegion" AS ENUM ('INTERNATIONAL', 'LOCAL');

-- AlterTable
ALTER TABLE "job_sources" ADD COLUMN     "region" "JobRegion" NOT NULL DEFAULT 'INTERNATIONAL';

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "employment_type" TEXT,
ADD COLUMN     "is_remote" BOOLEAN,
ADD COLUMN     "region" "JobRegion" NOT NULL DEFAULT 'INTERNATIONAL',
ADD COLUMN     "salary_max" INTEGER,
ADD COLUMN     "salary_min" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "job_sources_name_key" ON "job_sources"("name");
