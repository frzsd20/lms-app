/*
  Warnings:

  - A unique constraint covering the columns `[courseId,order]` on the table `modules` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "modules_courseId_order_key" ON "modules"("courseId", "order");
