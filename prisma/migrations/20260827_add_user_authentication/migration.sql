-- Credentials are deliberately isolated so profile reads cannot accidentally expose sensitive values.
CREATE TABLE "UserCredentials" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "verificationTokenHash" VARCHAR(255),
    "verificationTokenExpiresAt" TIMESTAMPTZ,
    "refreshTokenHash" VARCHAR(255),
    "refreshTokenExpiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "UserCredentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserCredentials_userId_key" ON "UserCredentials"("userId");
CREATE UNIQUE INDEX "UserCredentials_verificationTokenHash_key" ON "UserCredentials"("verificationTokenHash");
CREATE UNIQUE INDEX "UserCredentials_refreshTokenHash_key" ON "UserCredentials"("refreshTokenHash");

ALTER TABLE "UserCredentials"
    ADD CONSTRAINT "UserCredentials_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;