-- CreateTable
CREATE TABLE "GameGroup" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "GameGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreEntry" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameGroupUuid" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "ScoreEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameGroup_uuid_key" ON "GameGroup"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "GameGroup_name_key" ON "GameGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GameGroup_email_key" ON "GameGroup"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreEntry_uuid_key" ON "ScoreEntry"("uuid");

-- AddForeignKey
ALTER TABLE "ScoreEntry" ADD CONSTRAINT "ScoreEntry_gameGroupUuid_fkey" FOREIGN KEY ("gameGroupUuid") REFERENCES "GameGroup"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
