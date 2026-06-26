/**
 * Port used by the authorization layer to resolve which emergency owns a given task.
 *
 * Infrastructure note: this port is intentionally placed in the identity context because
 * authorization (guard enforcement) lives there. The adapter reads the `tasks` table
 * from the volunteers context schema — an accepted cross-context infra coupling kept
 * explicitly in the adapter so the domain stays clean.
 */
export const TASK_EMERGENCY_LOOKUP = Symbol('TaskEmergencyLookup');

export interface TaskEmergencyLookup {
  /** Returns the emergencyId that owns the task, or null when the task does not exist. */
  findEmergencyId(taskId: string): Promise<string | null>;
}
