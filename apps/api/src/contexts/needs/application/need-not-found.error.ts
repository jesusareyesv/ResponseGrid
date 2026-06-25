export class NeedNotFoundError extends Error {
  constructor(id: string) {
    super(`Need not found: ${id}`);
    this.name = 'NeedNotFoundError';
  }
}
