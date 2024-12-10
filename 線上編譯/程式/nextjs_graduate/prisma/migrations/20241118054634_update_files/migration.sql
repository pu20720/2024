/*
  Warnings:

  - You are about to drop the column `folder_id` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `root_folder_id` on the `User` table. All the data in the column will be lost.
  - Added the required column `github_id` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `File_label_folder_id_user_id_key` ON `File`;

-- AlterTable
ALTER TABLE `File` DROP COLUMN `folder_id`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `root_folder_id`,
    ADD COLUMN `github_id` VARCHAR(191) NOT NULL;
