import { CreateTask } from './create-task';
import { InMemoryTaskRepository } from './in-memory-task.repository';
import { VolunteerSkill } from '../domain/volunteer-enums';

const EM = '11111111-1111-4111-8111-111111111111';
const CREATOR = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

describe('CreateTask use case', () => {
  let repo: InMemoryTaskRepository;
  let uc: CreateTask;

  beforeEach(() => {
    repo = new InMemoryTaskRepository();
    uc = new CreateTask(repo);
  });

  it('creates a task and returns its id', async () => {
    const result = await uc.execute({
      emergencyId: EM,
      title: 'Test Task',
      description: 'A description',
      location: null,
      requiredSkill: null,
      createdByUserId: CREATOR,
    });
    expect(typeof result.id).toBe('string');
    const tasks = await repo.findByEmergency(EM);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test Task');
  });

  it('creates a task with location', async () => {
    const result = await uc.execute({
      emergencyId: EM,
      title: 'Located Task',
      description: 'Near the river',
      location: { address: 'River Bank', latitude: 39.4, longitude: -0.3 },
      requiredSkill: VolunteerSkill.Medical,
      createdByUserId: CREATOR,
    });
    const tasks = await repo.findByEmergency(EM);
    expect(tasks[0].location?.address).toBe('River Bank');
    expect(tasks[0].requiredSkill).toBe(VolunteerSkill.Medical);
    expect(result.id).toBeDefined();
  });
});
