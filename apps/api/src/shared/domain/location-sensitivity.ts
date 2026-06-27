/**
 * Shared Kernel — LocationSensitivity value object.
 *
 * Defines how the coordinates of a domain entity should be exposed publicly.
 *
 * | Value       | Meaning                                                   |
 * |-------------|-----------------------------------------------------------|
 * | public      | Exact coordinates are safe to expose (logistics points,   |
 * |             | collection centres, organizational requests).             |
 * | approximate | Coordinates must be jittered before public exposure       |
 * |             | (individual/private requester, informal shelter, etc.).   |
 *
 * NOTE: 'private' is intentionally excluded from the MVP. It will be added
 * when DonationOffer pickup-by-receiver privacy is implemented (F07 scope).
 */
export type LocationSensitivity = 'public' | 'approximate';

export const LocationSensitivity = {
  Public: 'public' as const,
  Approximate: 'approximate' as const,
} satisfies Record<string, LocationSensitivity>;
