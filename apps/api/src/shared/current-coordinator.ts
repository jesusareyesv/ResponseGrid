// ponytail: auth stub for the slice. Replace with a real IdentityProvider guard
// that resolves the coordinator from the JWT and checks the membership role.
export function currentCoordinatorId(): string {
  return 'coordinator-stub';
}
