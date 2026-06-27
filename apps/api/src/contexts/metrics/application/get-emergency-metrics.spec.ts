import { GetEmergencyMetrics } from './get-emergency-metrics';
import { MetricsReader } from '../domain/ports/metrics-reader';
import { NeedStatus } from '../../needs/domain/need-enums';
import { PublicStatus } from '../../resources/domain/resource-enums';

const EM = '11111111-1111-4111-8111-111111111111';

function makeNeedCounts(
  overrides: Partial<Record<NeedStatus, number>> = {},
): Record<NeedStatus, number> {
  return {
    [NeedStatus.Pending]: 0,
    [NeedStatus.Validated]: 0,
    [NeedStatus.Rejected]: 0,
    [NeedStatus.Fulfilled]: 0,
    ...overrides,
  };
}

function makeResourceCounts(
  overrides: Partial<Record<PublicStatus, number>> = {},
): Record<PublicStatus, number> {
  return {
    [PublicStatus.Hidden]: 0,
    [PublicStatus.Active]: 0,
    [PublicStatus.Saturated]: 0,
    [PublicStatus.Paused]: 0,
    [PublicStatus.Closed]: 0,
    ...overrides,
  };
}

function makeReader(
  needCounts: Record<NeedStatus, number>,
  resourceCounts: Record<PublicStatus, number>,
): MetricsReader {
  return {
    countNeedsByEmergencyGroupedByStatus: () => Promise.resolve(needCounts),
    countResourcesByEmergencyGroupedByPublicStatus: () =>
      Promise.resolve(resourceCounts),
  };
}

describe('GetEmergencyMetrics', () => {
  it('returns all zeros when emergency has no needs or resources', async () => {
    const useCase = new GetEmergencyMetrics(
      makeReader(makeNeedCounts(), makeResourceCounts()),
    );
    const result = await useCase.execute({ emergencyId: EM });
    expect(result.needs.total).toBe(0);
    expect(result.needs.open).toBe(0);
    expect(result.needs.closed).toBe(0);
    expect(result.resources.total).toBe(0);
    expect(result.resources.active).toBe(0);
    expect(result.resources.pending).toBe(0);
  });

  it('counts pending needs as open and in total', async () => {
    const useCase = new GetEmergencyMetrics(
      makeReader(
        makeNeedCounts({ [NeedStatus.Pending]: 2 }),
        makeResourceCounts(),
      ),
    );
    const result = await useCase.execute({ emergencyId: EM });
    expect(result.needs.total).toBe(2);
    expect(result.needs.open).toBe(2);
    expect(result.needs.closed).toBe(0);
  });

  it('counts validated needs as open', async () => {
    const useCase = new GetEmergencyMetrics(
      makeReader(
        makeNeedCounts({ [NeedStatus.Validated]: 1 }),
        makeResourceCounts(),
      ),
    );
    const result = await useCase.execute({ emergencyId: EM });
    expect(result.needs.total).toBe(1);
    expect(result.needs.open).toBe(1);
    expect(result.needs.closed).toBe(0);
  });

  it('counts fulfilled needs as closed, not open', async () => {
    const useCase = new GetEmergencyMetrics(
      makeReader(
        makeNeedCounts({ [NeedStatus.Fulfilled]: 1 }),
        makeResourceCounts(),
      ),
    );
    const result = await useCase.execute({ emergencyId: EM });
    expect(result.needs.total).toBe(1);
    expect(result.needs.open).toBe(0);
    expect(result.needs.closed).toBe(1);
  });

  it('counts rejected needs in total but not in open or closed', async () => {
    const useCase = new GetEmergencyMetrics(
      makeReader(
        makeNeedCounts({ [NeedStatus.Rejected]: 1 }),
        makeResourceCounts(),
      ),
    );
    const result = await useCase.execute({ emergencyId: EM });
    expect(result.needs.total).toBe(1);
    expect(result.needs.open).toBe(0);
    expect(result.needs.closed).toBe(0);
  });

  it('combines mixed need statuses correctly', async () => {
    // 2 pending, 1 validated, 1 rejected, 1 fulfilled
    const useCase = new GetEmergencyMetrics(
      makeReader(
        makeNeedCounts({
          [NeedStatus.Pending]: 2,
          [NeedStatus.Validated]: 1,
          [NeedStatus.Rejected]: 1,
          [NeedStatus.Fulfilled]: 1,
        }),
        makeResourceCounts(),
      ),
    );
    const result = await useCase.execute({ emergencyId: EM });
    expect(result.needs.total).toBe(5);
    expect(result.needs.open).toBe(3); // 2 pending + 1 validated
    expect(result.needs.closed).toBe(1); // 1 fulfilled
    // rejected: in total, not in open/closed
  });

  it('counts hidden resources as pending, active as active', async () => {
    const useCase = new GetEmergencyMetrics(
      makeReader(
        makeNeedCounts(),
        makeResourceCounts({
          [PublicStatus.Hidden]: 1,
          [PublicStatus.Active]: 1,
        }),
      ),
    );
    const result = await useCase.execute({ emergencyId: EM });
    expect(result.resources.total).toBe(2);
    expect(result.resources.active).toBe(1);
    expect(result.resources.pending).toBe(1);
  });

  it('ignores needs from other emergencies (reader is scoped by emergencyId)', async () => {
    // The reader is always called with the exact emergencyId — isolation is
    // an adapter concern. Here we verify the use case forwards the correct id.
    let capturedId: string | undefined;
    const reader: MetricsReader = {
      countNeedsByEmergencyGroupedByStatus: (id) => {
        capturedId = id;
        return Promise.resolve(makeNeedCounts({ [NeedStatus.Pending]: 1 }));
      },
      countResourcesByEmergencyGroupedByPublicStatus: () =>
        Promise.resolve(makeResourceCounts()),
    };
    const useCase = new GetEmergencyMetrics(reader);
    const result = await useCase.execute({ emergencyId: EM });
    expect(capturedId).toBe(EM);
    expect(result.needs.total).toBe(1);
  });
});
