-- Make password_hash nullable (social-only accounts have no password)
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
--> statement-breakpoint

-- Create user_identities table for linked social accounts
CREATE TABLE "user_identities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_user_id" text NOT NULL
);
--> statement-breakpoint

ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_provider_provider_user_id_unique" UNIQUE("provider","provider_user_id");
