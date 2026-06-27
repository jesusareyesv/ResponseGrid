'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getToken, authHeaders, clearToken } from '@/lib/auth';
import { api } from '@/lib/api';
import type { components } from '@reliefhub/api-client';

export type VolunteerProfile = components['schemas']['VolunteerViewDto'];
export type MyTask = components['schemas']['MyTaskViewDto'];

export type CheckActionResult =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

/**
 * Fetch the authenticated user's volunteer profile for the given emergency.
 * Returns null when not registered (404) or on network error.
 */
export async function fetchMyVolunteerProfile(
  emergencyId: string,
  slug: string,
): Promise<VolunteerProfile | null> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/mi-voluntariado`);
  }

  const { data, response } = await api.GET(
    '/emergencies/{emergencyId}/volunteers/me',
    {
      params: { path: { emergencyId } },
      headers: authHeaders(token),
    },
  );

  if (response.status === 401) {
    await clearToken();
    redirect(`/login?next=/e/${slug}/mi-voluntariado`);
  }

  if (response.status === 404 || data === undefined) {
    return null;
  }

  return data;
}

/**
 * Fetch tasks assigned to the authenticated volunteer for the given emergency.
 */
export async function fetchMyTasks(
  emergencyId: string,
  slug: string,
): Promise<MyTask[]> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/mi-voluntariado`);
  }

  const { data, response } = await api.GET(
    '/emergencies/{emergencyId}/tasks/mine',
    {
      params: { path: { emergencyId } },
      headers: authHeaders(token),
    },
  );

  if (response.status === 401) {
    await clearToken();
    redirect(`/login?next=/e/${slug}/mi-voluntariado`);
  }

  return data ?? [];
}

/**
 * Check in a volunteer to a task.
 */
export async function checkInTask(
  taskId: string,
  volunteerId: string,
  slug: string,
): Promise<CheckActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/mi-voluntariado`);
  }

  const { response } = await api.POST('/tasks/{taskId}/check-in', {
    params: { path: { taskId } },
    body: { volunteerId },
    headers: authHeaders(token),
  });

  if (response.status === 401) {
    await clearToken();
    redirect(`/login?next=/e/${slug}/mi-voluntariado`);
  }

  if (response.status === 403) {
    return { status: 'error', message: 'No tienes permisos para hacer check-in en esta tarea.' };
  }

  if (!response.ok) {
    return { status: 'error', message: 'No se pudo hacer check-in. Inténtalo de nuevo.' };
  }

  revalidatePath(`/e/${slug}/mi-voluntariado`);
  return { status: 'success' };
}

/**
 * Check out a volunteer from a task.
 */
export async function checkOutTask(
  taskId: string,
  volunteerId: string,
  slug: string,
): Promise<CheckActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/mi-voluntariado`);
  }

  const { response } = await api.POST('/tasks/{taskId}/check-out', {
    params: { path: { taskId } },
    body: { volunteerId },
    headers: authHeaders(token),
  });

  if (response.status === 401) {
    await clearToken();
    redirect(`/login?next=/e/${slug}/mi-voluntariado`);
  }

  if (response.status === 403) {
    return { status: 'error', message: 'No tienes permisos para hacer check-out en esta tarea.' };
  }

  if (!response.ok) {
    return { status: 'error', message: 'No se pudo hacer check-out. Inténtalo de nuevo.' };
  }

  revalidatePath(`/e/${slug}/mi-voluntariado`);
  return { status: 'success' };
}
