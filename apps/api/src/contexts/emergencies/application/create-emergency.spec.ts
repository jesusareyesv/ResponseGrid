import { CreateEmergency } from './create-emergency';
import { SlugAlreadyExistsError } from './slug-already-exists.error';
import { InMemoryEmergencyRepository } from '../infrastructure/in-memory-emergency.repository';

describe('CreateEmergency', () => {
  it('creates an emergency with an explicit slug', async () => {
    const repo = new InMemoryEmergencyRepository();
    const useCase = new CreateEmergency(repo);

    const result = await useCase.execute({
      name: 'Hurricane Relief',
      slug: 'hurricane-relief',
      country: 'US',
    });

    expect(result.slug).toBe('hurricane-relief');
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
  });

  it('derives slug from name when slug is omitted', async () => {
    const repo = new InMemoryEmergencyRepository();
    const useCase = new CreateEmergency(repo);

    const result = await useCase.execute({
      name: 'Flood Response 2024',
      country: 'MX',
    });

    expect(result.slug).toBe('flood-response-2024');
    expect(typeof result.id).toBe('string');
  });

  it('throws SlugAlreadyExistsError on duplicate slug', async () => {
    const repo = new InMemoryEmergencyRepository();
    const useCase = new CreateEmergency(repo);

    await useCase.execute({
      name: 'First Emergency',
      slug: 'my-slug',
      country: 'US',
    });

    await expect(
      useCase.execute({
        name: 'Second Emergency',
        slug: 'my-slug',
        country: 'ES',
      }),
    ).rejects.toThrow(SlugAlreadyExistsError);
  });

  it('throws SlugAlreadyExistsError with correct message', async () => {
    const repo = new InMemoryEmergencyRepository();
    const useCase = new CreateEmergency(repo);

    await useCase.execute({ name: 'First', slug: 'taken-slug', country: 'US' });

    await expect(
      useCase.execute({ name: 'Second', slug: 'taken-slug', country: 'US' }),
    ).rejects.toThrow('Slug already exists: taken-slug');
  });
});
