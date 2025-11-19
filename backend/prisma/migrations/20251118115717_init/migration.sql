-- CreateTable
CREATE TABLE "Poem" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "dynasty" TEXT,

    CONSTRAINT "Poem_pkey" PRIMARY KEY ("id")
);
