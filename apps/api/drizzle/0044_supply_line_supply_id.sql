-- Soft link de cada línea de material al catálogo maestro (#223): columna
-- `supply_id` opcional (FK a supplies(id) ON DELETE SET NULL) en las 4 tablas
-- de líneas. `name` se conserva (legacy + "Otro"). Las líneas en jsonb
-- (containers.lines, shipments.items) heredan el campo vía SupplyLineSnapshot,
-- sin columna.
--
-- Idempotente: ADD COLUMN IF NOT EXISTS + DROP CONSTRAINT IF EXISTS antes de
-- ADD CONSTRAINT (patrón del repo, p.ej. 0011), para reaplicar sin error.

ALTER TABLE "need_items" ADD COLUMN IF NOT EXISTS "supply_id" uuid;
--> statement-breakpoint
ALTER TABLE "need_items" DROP CONSTRAINT IF EXISTS "need_items_supply_id_fkey";
--> statement-breakpoint
ALTER TABLE "need_items" ADD CONSTRAINT "need_items_supply_id_fkey"
  FOREIGN KEY ("supply_id") REFERENCES "supplies"("id") ON DELETE SET NULL;
--> statement-breakpoint

ALTER TABLE "offer_items" ADD COLUMN IF NOT EXISTS "supply_id" uuid;
--> statement-breakpoint
ALTER TABLE "offer_items" DROP CONSTRAINT IF EXISTS "offer_items_supply_id_fkey";
--> statement-breakpoint
ALTER TABLE "offer_items" ADD CONSTRAINT "offer_items_supply_id_fkey"
  FOREIGN KEY ("supply_id") REFERENCES "supplies"("id") ON DELETE SET NULL;
--> statement-breakpoint

ALTER TABLE "resource_items" ADD COLUMN IF NOT EXISTS "supply_id" uuid;
--> statement-breakpoint
ALTER TABLE "resource_items" DROP CONSTRAINT IF EXISTS "resource_items_supply_id_fkey";
--> statement-breakpoint
ALTER TABLE "resource_items" ADD CONSTRAINT "resource_items_supply_id_fkey"
  FOREIGN KEY ("supply_id") REFERENCES "supplies"("id") ON DELETE SET NULL;
--> statement-breakpoint

ALTER TABLE "donation_intake_lines" ADD COLUMN IF NOT EXISTS "supply_id" uuid;
--> statement-breakpoint
ALTER TABLE "donation_intake_lines" DROP CONSTRAINT IF EXISTS "donation_intake_lines_supply_id_fkey";
--> statement-breakpoint
ALTER TABLE "donation_intake_lines" ADD CONSTRAINT "donation_intake_lines_supply_id_fkey"
  FOREIGN KEY ("supply_id") REFERENCES "supplies"("id") ON DELETE SET NULL;
