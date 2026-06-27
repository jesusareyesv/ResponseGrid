-- Replace the 3-column unique (user_id, emergency_id, role) with a 2-column unique
-- (user_id, emergency_id) so that the upsert in DrizzleMembershipRepository.save()
-- correctly updates the role instead of inserting a duplicate row.
--
-- Decision: a user holds exactly ONE role per emergency. If historical data contains
-- rows with two roles for the same user+emergency, the second INSERT that created them
-- was itself a bug (the old 3-col unique allowed it). The migration removes the old
-- constraint and adds the correct one. If duplicate (user, emergency) rows exist they
-- must be resolved before applying — run the diagnostic query below and verify it
-- returns 0 rows before deploying to production.
--
-- SELECT user_id, emergency_id, count(*) FROM memberships
-- GROUP BY user_id, emergency_id HAVING count(*) > 1;

ALTER TABLE "memberships"
  DROP CONSTRAINT IF EXISTS "memberships_user_emergency_role_unique";
--> statement-breakpoint
ALTER TABLE "memberships"
  ADD CONSTRAINT "memberships_user_emergency_unique" UNIQUE ("user_id", "emergency_id");
