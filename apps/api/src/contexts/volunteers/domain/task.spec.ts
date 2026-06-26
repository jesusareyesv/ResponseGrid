import { Task, TaskStatus, AssignmentStatus } from './task';
import { TaskId } from './task-id';
import { EmergencyId } from '../../../shared/domain/emergency-id';
import { VolunteerSkill } from './volunteer-enums';
import {
  TaskAlreadyAssignedError,
  TaskNotAssignedError,
  TaskClosedError,
  TaskCheckInError,
  TaskCheckOutError,
} from './task-errors';

const EM = '11111111-1111-4111-8111-111111111111';
const VOL_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VOL_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CREATOR = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function makeTask(): Task {
  return Task.create({
    id: TaskId.create(),
    emergencyId: EmergencyId.fromString(EM),
    title: 'Deliver supplies',
    description: 'Transport water to zone 3',
    location: null,
    requiredSkill: null,
    createdByUserId: CREATOR,
  });
}

describe('Task aggregate', () => {
  describe('create', () => {
    it('creates task in open status', () => {
      const t = makeTask();
      expect(t.status).toBe(TaskStatus.Open);
      expect(t.assignments).toHaveLength(0);
      expect(t.title).toBe('Deliver supplies');
    });

    it('accepts optional location and requiredSkill', () => {
      const t = Task.create({
        id: TaskId.create(),
        emergencyId: EmergencyId.fromString(EM),
        title: 'Medical triage',
        description: 'Set up triage area',
        location: null,
        requiredSkill: VolunteerSkill.Medical,
        createdByUserId: CREATOR,
      });
      expect(t.requiredSkill).toBe(VolunteerSkill.Medical);
      expect(t.location).toBeNull();
    });

    it('round-trips through snapshot', () => {
      const t = makeTask();
      t.assign(VOL_A);
      t.checkIn(VOL_A);
      const snap = t.toSnapshot();
      const restored = Task.fromSnapshot(snap);
      expect(restored.id.value).toBe(t.id.value);
      expect(restored.emergencyId.value).toBe(EM);
      expect(restored.status).toBe(TaskStatus.InProgress);
      expect(restored.assignments).toHaveLength(1);
      expect(restored.assignments[0].status).toBe(AssignmentStatus.CheckedIn);
    });
  });

  describe('assign', () => {
    it('assigns a volunteer successfully', () => {
      const t = makeTask();
      t.assign(VOL_A);
      expect(t.assignments).toHaveLength(1);
      expect(t.assignments[0].volunteerId).toBe(VOL_A);
      expect(t.assignments[0].status).toBe(AssignmentStatus.Assigned);
    });

    it('throws TaskAlreadyAssignedError on duplicate assign', () => {
      const t = makeTask();
      t.assign(VOL_A);
      expect(() => t.assign(VOL_A)).toThrow(TaskAlreadyAssignedError);
    });

    it('throws TaskClosedError when assigning to completed task', () => {
      const t = makeTask();
      t.assign(VOL_A);
      t.checkIn(VOL_A);
      t.complete();
      expect(() => t.assign(VOL_B)).toThrow(TaskClosedError);
    });

    it('throws TaskClosedError when assigning to cancelled task', () => {
      const t = makeTask();
      t.cancel();
      expect(() => t.assign(VOL_A)).toThrow(TaskClosedError);
    });
  });

  describe('unassign', () => {
    it('removes assignment successfully', () => {
      const t = makeTask();
      t.assign(VOL_A);
      t.unassign(VOL_A);
      expect(t.assignments).toHaveLength(0);
    });

    it('throws TaskNotAssignedError for non-assigned volunteer', () => {
      const t = makeTask();
      expect(() => t.unassign(VOL_A)).toThrow(TaskNotAssignedError);
    });
  });

  describe('checkIn', () => {
    it('transitions assignment to checked_in and task to in_progress', () => {
      const t = makeTask();
      t.assign(VOL_A);
      t.checkIn(VOL_A);
      expect(t.assignments[0].status).toBe(AssignmentStatus.CheckedIn);
      expect(t.assignments[0].checkedInAt).toBeInstanceOf(Date);
      expect(t.status).toBe(TaskStatus.InProgress);
    });

    it('throws TaskNotAssignedError when volunteer is not assigned', () => {
      const t = makeTask();
      expect(() => t.checkIn(VOL_A)).toThrow(TaskNotAssignedError);
    });

    it('throws TaskCheckInError when already checked in', () => {
      const t = makeTask();
      t.assign(VOL_A);
      t.checkIn(VOL_A);
      expect(() => t.checkIn(VOL_A)).toThrow(TaskCheckInError);
    });
  });

  describe('checkOut', () => {
    it('transitions assignment to checked_out', () => {
      const t = makeTask();
      t.assign(VOL_A);
      t.checkIn(VOL_A);
      t.checkOut(VOL_A);
      expect(t.assignments[0].status).toBe(AssignmentStatus.CheckedOut);
      expect(t.assignments[0].checkedOutAt).toBeInstanceOf(Date);
    });

    it('throws TaskNotAssignedError for non-assigned volunteer', () => {
      const t = makeTask();
      expect(() => t.checkOut(VOL_A)).toThrow(TaskNotAssignedError);
    });

    it('throws TaskCheckOutError when not yet checked in', () => {
      const t = makeTask();
      t.assign(VOL_A);
      expect(() => t.checkOut(VOL_A)).toThrow(TaskCheckOutError);
    });
  });

  describe('complete', () => {
    it('completes an in_progress task', () => {
      const t = makeTask();
      t.assign(VOL_A);
      t.checkIn(VOL_A);
      t.complete();
      expect(t.status).toBe(TaskStatus.Completed);
    });

    it('completes an open task (coordinator closes it directly)', () => {
      const t = makeTask();
      t.complete();
      expect(t.status).toBe(TaskStatus.Completed);
    });

    it('throws TaskClosedError when already cancelled', () => {
      const t = makeTask();
      t.cancel();
      expect(() => t.complete()).toThrow(TaskClosedError);
    });
  });

  describe('cancel', () => {
    it('cancels an open task', () => {
      const t = makeTask();
      t.cancel();
      expect(t.status).toBe(TaskStatus.Cancelled);
    });

    it('cancels an in_progress task', () => {
      const t = makeTask();
      t.assign(VOL_A);
      t.checkIn(VOL_A);
      t.cancel();
      expect(t.status).toBe(TaskStatus.Cancelled);
    });

    it('throws TaskClosedError when already completed', () => {
      const t = makeTask();
      t.complete();
      expect(() => t.cancel()).toThrow(TaskClosedError);
    });
  });

  describe('assignments defensive copy', () => {
    it('mutating the returned array does not affect the aggregate', () => {
      const t = makeTask();
      t.assign(VOL_A);
      const copy = t.assignments;
      copy.pop();
      expect(t.assignments).toHaveLength(1);
    });
  });
});
