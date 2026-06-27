'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, clearToken, authHeaders } from '@/lib/auth';

export type PersonnelActionResult =
  | { status: 'idle' }
  | { status: 'success'; taskId: string }
  | { status: 'error'; message: string };

/**
 * Crea una tarea a partir de una need de personal y opcionalmente asigna
 * voluntarios. Solo coordinadores.
 */
export async function createTaskFromNeed(
  needId: string,
  slug: string,
  volunteerIds: string[],
  dueDate?: string,
): Promise<PersonnelActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/coordinacion`);
  }

  const { data, error, response } = await api.POST('/needs/{needId}/create-task', {
    params: { path: { needId } },
    body: {
      ...(volunteerIds.length > 0 ? { volunteerIds } : {}),
      ...(dueDate != null && dueDate.trim() !== '' ? { dueDate: dueDate.trim() } : {}),
    },
    headers: authHeaders(token),
  });

  if (response.status === 401) {
    await clearToken();
    redirect(`/login?next=/e/${slug}/coordinacion`);
  }

  if (response.status === 403) {
    return {
      status: 'error',
      message: 'No tienes permisos para crear tareas desde esta necesidad.',
    };
  }

  if (response.status === 404) {
    return {
      status: 'error',
      message: 'Necesidad no encontrada.',
    };
  }

  if (error !== undefined || data === undefined) {
    const msg =
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : 'No se pudo crear la tarea. Inténtalo de nuevo.';
    return { status: 'error', message: msg };
  }

  revalidatePath(`/e/${slug}/coordinacion`);
  revalidatePath(`/e/${slug}/coordinacion/voluntarios`);

  return { status: 'success', taskId: data.id };
}
