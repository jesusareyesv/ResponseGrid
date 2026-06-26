CREATE TABLE "accreditations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"scope_emergency_id" uuid,
	"granted_by_user_id" uuid NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	"evidence" text
);
