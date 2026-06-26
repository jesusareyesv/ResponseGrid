CREATE TABLE "volunteers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"emergency_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"municipality" text NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"availability" text NOT NULL,
	"vehicle" text NOT NULL,
	"status" text NOT NULL,
	"consent_accepted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "volunteers_user_emergency_uniq" UNIQUE("emergency_id","user_id")
);
--> statement-breakpoint
CREATE INDEX "volunteers_emergency_status_idx" ON "volunteers" ("emergency_id","status");
