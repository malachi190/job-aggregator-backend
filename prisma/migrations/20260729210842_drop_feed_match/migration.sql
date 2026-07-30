/*
  Warnings:

  - You are about to drop the `feed_matches` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "feed_matches" DROP CONSTRAINT "feed_matches_job_id_fkey";

-- DropForeignKey
ALTER TABLE "feed_matches" DROP CONSTRAINT "feed_matches_user_id_fkey";

-- DropTable
DROP TABLE "feed_matches";
