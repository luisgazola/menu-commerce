-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "whatsappMessageTemplate" TEXT;
