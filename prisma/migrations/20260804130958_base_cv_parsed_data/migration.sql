/*
  Warnings:

  - You are about to drop the column `parsed_text` on the `base_cvs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "base_cvs" DROP COLUMN "parsed_text",
ADD COLUMN     "parsed_data" JSONB;
