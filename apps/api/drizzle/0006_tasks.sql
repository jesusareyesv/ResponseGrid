CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"emergency_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location_address" text,
	"location_latitude" double precision,
	"location_longitude" double precision,
	"required_skill" text,
	"status" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_assignments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"task_id" uuid NOT NULL,
	"volunteer_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone NOT NULL,
	"checked_in_at" timestamp with time zone,
	"checked_out_at" timestamp with time zone,
	"status" text NOT NULL,
	CONSTRAINT "task_assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "tasks_emergency_status_idx" ON "tasks" ("emergency_id", "status");
--> statement-breakpoint
CREATE INDEX "task_assignments_task_id_idx" ON "task_assignments" ("task_id");
--> statement-breakpoint
CREATE INDEX "task_assignments_volunteer_id_idx" ON "task_assignments" ("volunteer_id");
