CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"emergency_id" uuid NOT NULL,
	"type" text NOT NULL,
	"side" text NOT NULL,
	"name" text NOT NULL,
	"verification_level" text NOT NULL,
	"public_status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
