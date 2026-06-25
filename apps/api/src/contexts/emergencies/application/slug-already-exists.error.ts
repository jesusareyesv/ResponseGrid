export class SlugAlreadyExistsError extends Error {
  constructor(slug: string) {
    super(`Slug already exists: ${slug}`);
    this.name = 'SlugAlreadyExistsError';
  }
}
