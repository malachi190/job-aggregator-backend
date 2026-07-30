/*
  Warnings:

  - Added the required column `updated_at` to the `feed_matches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "feed_matches" ADD COLUMN     "details" JSONB,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
