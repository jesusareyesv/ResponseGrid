-- Create notifications table for in-app notifications (F5b)
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"emergency_id" uuid,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"read" boolean NOT NULL DEFAULT false,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" ("user_id", "read");
