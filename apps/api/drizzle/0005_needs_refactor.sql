-- Truncate demo data before schema change
TRUNCATE TABLE "needs" CASCADE;
--> statement-breakpoint

-- Drop old columns (category, requested_quantity, unit)
ALTER TABLE "needs" DROP COLUMN IF EXISTS "category";
--> statement-breakpoint
ALTER TABLE "needs" DROP COLUMN IF EXISTS "requested_quantity";
--> statement-breakpoint
ALTER TABLE "needs" DROP COLUMN IF EXISTS "unit";
--> statement-breakpoint

-- Add new columns to needs
ALTER TABLE "needs" ADD COLUMN "description" text;
--> statement-breakpoint
ALTER TABLE "needs" ADD COLUMN "address" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "needs" ADD COLUMN "latitude" double precision NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "needs" ADD COLUMN "longitude" double precision NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "needs" ADD COLUMN "requester_user_id" uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000000';
--> statement-breakpoint
ALTER TABLE "needs" ADD COLUMN "requester_organization_id" uuid;
--> statement-breakpoint
ALTER TABLE "needs" ADD COLUMN "managing_organization_id" uuid;
--> statement-breakpoint

-- Remove column defaults (now that table is empty they are only needed for the ALTER)
ALTER TABLE "needs" ALTER COLUMN "address" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "needs" ALTER COLUMN "latitude" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "needs" ALTER COLUMN "longitude" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "needs" ALTER COLUMN "requester_user_id" DROP DEFAULT;
--> statement-breakpoint

-- Create need_items table
CREATE TABLE "need_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"need_id" uuid NOT NULL,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit" text,
	"category" text NOT NULL
);
