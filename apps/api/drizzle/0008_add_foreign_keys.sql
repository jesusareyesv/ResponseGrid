-- Add missing foreign keys for referential integrity
-- Skipped: memberships.emergency_id → emergencies.id because e2e tests insert
-- memberships with emergency UUIDs that do not exist in the emergencies table.

--> statement-breakpoint
ALTER TABLE "need_items" ADD CONSTRAINT "need_items_need_id_needs_id_fk"
  FOREIGN KEY ("need_id") REFERENCES "public"."needs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

--> statement-breakpoint
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
