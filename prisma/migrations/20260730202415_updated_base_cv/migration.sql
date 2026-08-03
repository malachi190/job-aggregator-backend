/*
  Warnings:

  - Added the required column `name` to the `base_cvs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storage_key` to the `base_cvs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "base_cvs" ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "file_type" TEXT,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "storage_key" TEXT NOT NULL;
