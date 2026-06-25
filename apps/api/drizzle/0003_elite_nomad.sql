CREATE TABLE "needs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"emergency_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"priority" text NOT NULL,
	"requested_quantity" integer,
	"unit" text,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
