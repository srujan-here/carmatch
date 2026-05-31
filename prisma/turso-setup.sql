-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "bodyType" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "priceInr" INTEGER NOT NULL,
    "mileageKmpl" REAL NOT NULL,
    "seating" INTEGER NOT NULL,
    "safetyRating" REAL NOT NULL,
    "powerBhp" REAL NOT NULL,
    "bootLitres" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "features" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "imageUrl" TEXT
);

-- CreateTable
CREATE TABLE "RecommendationSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferences" TEXT NOT NULL,
    "freeText" TEXT,
    "results" TEXT NOT NULL,
    "aiEnhanced" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE INDEX "Car_bodyType_idx" ON "Car"("bodyType");

-- CreateIndex
CREATE INDEX "Car_fuelType_idx" ON "Car"("fuelType");

-- CreateIndex
CREATE INDEX "Car_priceInr_idx" ON "Car"("priceInr");

