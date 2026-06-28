-- CreateTable
CREATE TABLE "user_theme_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "themeFamily" TEXT NOT NULL DEFAULT 'lara',
    "themeName" TEXT NOT NULL DEFAULT 'indigo',
    "colorScheme" TEXT NOT NULL DEFAULT 'light',
    "inputStyle" TEXT NOT NULL DEFAULT 'outlined',
    "ripple" BOOLEAN NOT NULL DEFAULT true,
    "scale" INTEGER NOT NULL DEFAULT 14,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_theme_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_theme_preferences_userId_key" ON "user_theme_preferences"("userId");

-- AddForeignKey
ALTER TABLE "user_theme_preferences" ADD CONSTRAINT "user_theme_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
