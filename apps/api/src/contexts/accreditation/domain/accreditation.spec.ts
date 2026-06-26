import { Accreditation } from './accreditation';
import { AccreditationScope } from './value-objects/accreditation-scope';

describe('Accreditation aggregate', () => {
  it('grants a global accreditation with evidence', () => {
    const a = Accreditation.grant({
      id: 'acc-1',
      organizationId: 'org-1',
      scope: AccreditationScope.global(),
      grantedByUserId: 'admin-1',
      evidence: 'UN verified',
    });
    expect(a.id).toBe('acc-1');
    expect(a.organizationId).toBe('org-1');
    expect(a.scope.isGlobal).toBe(true);
    expect(a.evidence).toBe('UN verified');
    expect(a.grantedAt).toBeInstanceOf(Date);
  });

  it('grants an emergency-scoped accreditation without evidence', () => {
    const a = Accreditation.grant({
      id: 'acc-2',
      organizationId: 'org-2',
      scope: AccreditationScope.forEmergency('em-99'),
      grantedByUserId: 'admin-2',
    });
    expect(a.scope.isGlobal).toBe(false);
    expect(a.scope.emergencyId).toBe('em-99');
    expect(a.evidence).toBeNull();
  });

  it('round-trips through snapshot', () => {
    const original = Accreditation.grant({
      id: 'acc-3',
      organizationId: 'org-3',
      scope: AccreditationScope.forEmergency('em-1'),
      grantedByUserId: 'admin-1',
      evidence: 'docs',
    });
    const snapshot = original.toSnapshot();
    const restored = Accreditation.fromSnapshot(snapshot);
    expect(restored.id).toBe(original.id);
    expect(restored.scope.emergencyId).toBe('em-1');
    expect(restored.evidence).toBe('docs');
  });
});
