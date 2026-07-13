-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Work" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "thumbUrl" TEXT NOT NULL,
    "blurDataUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'live',
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "heroEyebrow" TEXT NOT NULL DEFAULT 'Brand & Graphic Design Studio',
    "heroHeadingLine1" TEXT NOT NULL DEFAULT 'Precision by law.',
    "heroHeadingLine2" TEXT NOT NULL DEFAULT 'Instinct by design.',
    "heroSubtext" TEXT NOT NULL DEFAULT 'THE LEX CONCEPT is the design practice of Alexandra Fajemirokun — a 500-level law student and graphic designer building brand identities, logos, and print work with the same discipline she brings to the books.',
    "heroToolsLabel" TEXT NOT NULL DEFAULT 'Photoshop, CorelDraw',
    "heroFocusLabel" TEXT NOT NULL DEFAULT 'Brand · Logo · Print',
    "heroBasedLabel" TEXT NOT NULL DEFAULT 'Lagos, Nigeria',
    "aboutHeadingLine1" TEXT NOT NULL DEFAULT '500-level law student by day.',
    "aboutHeadingLine2" TEXT NOT NULL DEFAULT 'Graphic designer by craft.',
    "aboutParagraph1" TEXT NOT NULL DEFAULT 'Alexandra Fajemirokun founded THE LEX CONCEPT while balancing law school with a growing design practice — building brand identities, logos, and print work for clients who want the same precision she brings to legal argument.',
    "aboutParagraph2" TEXT NOT NULL DEFAULT 'Working primarily in Photoshop and CorelDraw, Alexandra''s approach treats every brief like a case: understand it fully, then argue it visually.',
    "aboutImageUrl" TEXT,
    "aboutImageBlurDataUrl" TEXT,
    "statProjects" INTEGER NOT NULL DEFAULT 40,
    "statYears" INTEGER NOT NULL DEFAULT 3,
    "statSatisfaction" INTEGER NOT NULL DEFAULT 100,
    "contactHeadingLine1" TEXT NOT NULL DEFAULT 'Have a brief?',
    "contactHeadingLine2" TEXT NOT NULL DEFAULT 'Let''s argue it visually.',
    "contactSubtext" TEXT NOT NULL DEFAULT 'Open for brand identity, logo, flyer, poster, and print projects. Fill out the form or reach out directly — response within 24–48 hours.',
    "contactEmail" TEXT NOT NULL DEFAULT 'hello@thelexconcept.com',
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "tiktokUrl" TEXT,
    "linkedinUrl" TEXT,
    "upworkUrl" TEXT,
    "whatsappUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proof" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "clientName" TEXT,
    "clientEmail" TEXT,
    "token" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofImage" (
    "id" SERIAL NOT NULL,
    "proofId" INTEGER NOT NULL,
    "title" TEXT,
    "imageUrl" TEXT NOT NULL,
    "blurDataUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofComment" (
    "id" SERIAL NOT NULL,
    "proofImageId" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "message" TEXT NOT NULL,
    "authorName" TEXT,
    "authorType" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Work_status_category_idx" ON "Work"("status", "category");

-- CreateIndex
CREATE INDEX "Work_createdAt_idx" ON "Work"("createdAt");

-- CreateIndex
CREATE INDEX "Activity_type_createdAt_idx" ON "Activity"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Proof_token_key" ON "Proof"("token");

-- CreateIndex
CREATE INDEX "Proof_token_idx" ON "Proof"("token");

-- AddForeignKey
ALTER TABLE "ProofImage" ADD CONSTRAINT "ProofImage_proofId_fkey" FOREIGN KEY ("proofId") REFERENCES "Proof"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofComment" ADD CONSTRAINT "ProofComment_proofImageId_fkey" FOREIGN KEY ("proofImageId") REFERENCES "ProofImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
