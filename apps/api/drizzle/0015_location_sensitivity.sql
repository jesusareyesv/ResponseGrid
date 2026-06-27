-- F09 — Privacy: location sensitivity field on needs
-- Adds location_sensitivity column to the needs table.
-- Default 'public' for existing rows; then backfills 'approximate' for
-- needs created by individual requesters (requester_organization_id IS NULL).
-- The domain aggregate always stores exact coordinates; approximation is
-- applied at serialisation time in the public API response.

ALTER TABLE needs
  ADD COLUMN location_sensitivity text NOT NULL DEFAULT 'public';

-- Backfill: individual requesters get approximate sensitivity
UPDATE needs
  SET location_sensitivity = 'approximate'
  WHERE requester_organization_id IS NULL;
