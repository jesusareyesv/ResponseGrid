import {
  RevokeAccreditation,
  AccreditationNotFoundError,
} from './revoke-accreditation';
import { GrantAccreditation } from './grant-accreditation';
import { InMemoryAccreditationRepository } from '../infrastructure/in-memory-accreditation.repository';

describe('RevokeAccreditation use case', () => {
  let repo: InMemoryAccreditationRepository;
  let grant: GrantAccreditation;
  let revoke: RevokeAccreditation;

  beforeEach(() => {
    repo = new InMemoryAccreditationRepository();
    grant = new GrantAccreditation(repo);
    revoke = new RevokeAccreditation(repo);
  });

  it('revokes an existing accreditation', async () => {
    const { id } = await grant.execute({
      organizationId: 'org-1',
      scope: 'global',
      grantedByUserId: 'admin-1',
    });
    await revoke.execute({ accreditationId: id });
    expect(await repo.findById(id)).toBeNull();
  });

  it('throws AccreditationNotFoundError when id does not exist', async () => {
    await expect(
      revoke.execute({ accreditationId: 'non-existent' }),
    ).rejects.toThrow(AccreditationNotFoundError);
  });
});
