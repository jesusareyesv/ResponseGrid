CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"emergency_id" uuid NOT NULL,
	"resource_id" uuid,
	"reporter_user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"note" text NOT NULL,
	"photo_urls" text[] NOT NULL DEFAULT '{}',
	"priority" text NOT NULL,
	"status" text NOT NULL,
	"location_address" text,
	"location_latitude" double precision,
	"location_longitude" double precision,
	"created_at" timestamp with time zone NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "reports_emergency_id_status_idx" ON "reports" ("emergency_id", "status");
--> statement-breakpoint
CREATE INDEX "reports_emergency_id_priority_idx" ON "reports" ("emergency_id", "priority");
--> statement-breakpoint
CREATE INDEX "reports_reporter_user_id_idx" ON "reports" ("reporter_user_id");
