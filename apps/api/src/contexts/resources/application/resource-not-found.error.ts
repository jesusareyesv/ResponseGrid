export class ResourceNotFoundError extends Error {
  constructor(id: string) {
    super(`Resource not found: ${id}`);
    this.name = 'ResourceNotFoundError';
  }
}
