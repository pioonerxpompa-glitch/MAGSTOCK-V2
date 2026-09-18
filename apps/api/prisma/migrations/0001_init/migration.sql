CREATE TYPE "Role" AS ENUM ('ADMIN', 'WORKER');
CREATE TYPE "TransactionType" AS ENUM ('RECEIPT', 'ISSUE', 'TRANSFER_IN', 'TRANSFER_OUT', 'STOCKTAKE');

CREATE TABLE "User" ("id" TEXT NOT NULL,"name" TEXT NOT NULL,"pinHash" TEXT NOT NULL,"role" "Role" NOT NULL DEFAULT 'WORKER',"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE TABLE "License" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"key" TEXT NOT NULL,"expiresAt" TIMESTAMP(3),"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "License_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Category" ("id" TEXT NOT NULL,"name" TEXT NOT NULL,"parentId" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Category_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Product" ("id" TEXT NOT NULL,"name" TEXT NOT NULL,"normalizedName" TEXT NOT NULL,"ean" TEXT,"eurocashIndex" TEXT,"aen" TEXT,"subgroup" TEXT,"unit" TEXT NOT NULL DEFAULT 'szt',"volume" TEXT,"active" BOOLEAN NOT NULL DEFAULT true,"minStock" DECIMAL(14,3) NOT NULL DEFAULT 0,"categoryId" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Product_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Warehouse" ("id" TEXT NOT NULL,"code" TEXT NOT NULL,"name" TEXT NOT NULL,"active" BOOLEAN NOT NULL DEFAULT true,CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Stock" ("id" TEXT NOT NULL,"productId" TEXT NOT NULL,"warehouseId" TEXT NOT NULL,"quantity" DECIMAL(14,3) NOT NULL DEFAULT 0,CONSTRAINT "Stock_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Transaction" ("id" TEXT NOT NULL,"productId" TEXT NOT NULL,"warehouseId" TEXT NOT NULL,"userId" TEXT NOT NULL,"type" "TransactionType" NOT NULL,"quantity" DECIMAL(14,3) NOT NULL,"note" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "License_userId_key" ON "License"("userId");
CREATE UNIQUE INDEX "License_key_key" ON "License"("key");
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Product_ean_key" ON "Product"("ean");
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");
CREATE UNIQUE INDEX "Warehouse_name_key" ON "Warehouse"("name");
CREATE UNIQUE INDEX "Stock_productId_warehouseId_key" ON "Stock"("productId","warehouseId");
CREATE INDEX "Product_normalizedName_idx" ON "Product"("normalizedName");
CREATE INDEX "Product_eurocashIndex_idx" ON "Product"("eurocashIndex");
CREATE INDEX "Product_aen_idx" ON "Product"("aen");
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

ALTER TABLE "License" ADD CONSTRAINT "License_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
