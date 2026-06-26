'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, clearToken, authHeaders } from '@/lib/auth';

export type ActionResult =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

/**
 * Update the status of a volunteer (coordinator only).
 */
export async function updateVolunteerStatus(
  volunteerId: string,
  status: 'available' | 'assigned' | 'inactive',
  slug: string,
): Promise<ActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/coordinacion/voluntarios`);
  }

  const { error, response } = await api.POST('/volunteers/{volunteerId}/status', {
    params: { path: { volunteerId } },
    body: { status },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect(`/login?next=/e/${slug}/coordinacion/voluntarios`);
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para cambiar el estado de este voluntario.' };
    }
    if (response.status === 404) {
      return { status: 'error', message: 'Voluntario no encontrado.' };
    }
    return { status: 'error', message: 'No se pudo actualizar el estado. Inténtalo de nuevo.' };
  }

  revalidatePath(`/e/${slug}/coordinacion/voluntarios`);
  return { status: 'success' };
}

/**
 * Create a new task for an emergency (coordinator only).
 */
export async function createTask(
  emergencyId: string,
  slug: string,
  formData: FormData,
): Promise<ActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/coordinacion/voluntarios`);
  }

  const title = (formData.get('title') as string | null)?.trim() ?? '';
  const description = (formData.get('description') as string | null)?.trim() ?? '';
  const requiredSkill = (formData.get('requiredSkill') as string | null)?.trim() ?? '';
  const address = (formData.get('address') as string | null)?.trim() ?? '';
  const latitudeRaw = (formData.get('latitude') as string | null)?.trim() ?? '';
  const longitudeRaw = (formData.get('longitude') as string | null)?.trim() ?? '';

  if (title === '') {
    return { status: 'error', message: 'El título es obligatorio.' };
  }
  if (description === '') {
    return { status: 'error', message: 'La descripción es obligatoria.' };
  }

  type Skill = 'driving' | 'medical' | 'logistics' | 'cooking' | 'languages' | 'admin' | 'general';
  const VALID_SKILLS: Skill[] = ['driving', 'medical', 'logistics', 'cooking', 'languages', 'admin', 'general'];

  const skillValue = VALID_SKILLS.includes(requiredSkill as Skill) ? (requiredSkill as Skill) : undefined;

  // Build optional location only when all three fields are present
  let location: { address: string; latitude: number; longitude: number } | undefined;
  if (address !== '' && latitudeRaw !== '' && longitudeRaw !== '') {
    const latitude = parseFloat(latitudeRaw);
    const longitude = parseFloat(longitudeRaw);
    if (!isNaN(latitude) && !isNaN(longitude)) {
      location = { address, latitude, longitude };
    }
  }

  const { error, response } = await api.POST('/emergencies/{emergencyId}/tasks', {
    params: { path: { emergencyId } },
    body: {
      title,
      description,
      ...(skillValue !== undefined && { requiredSkill: skillValue }),
      ...(location !== undefined && { location }),
    },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect(`/login?next=/e/${slug}/coordinacion/voluntarios`);
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para crear tareas en esta emergencia.' };
    }
    return { status: 'error', message: 'No se pudo crear la tarea. Inténtalo de nuevo.' };
  }

  revalidatePath(`/e/${slug}/coordinacion/voluntarios`);
  return { status: 'success' };
}

/**
 * Assign a volunteer to a task (coordinator only).
 */
export async function assignVolunteer(
  taskId: string,
  volunteerId: string,
  slug: string,
): Promise<ActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/coordinacion/voluntarios`);
  }

  const { error, response } = await api.POST('/tasks/{taskId}/assign', {
    params: { path: { taskId } },
    body: { volunteerId },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect(`/login?next=/e/${slug}/coordinacion/voluntarios`);
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para asignar voluntarios.' };
    }
    if (response.status === 404) {
      return { status: 'error', message: 'Tarea o voluntario no encontrado.' };
    }
    if (response.status === 422) {
      return { status: 'error', message: 'El voluntario ya está asignado o la tarea no admite más asignaciones.' };
    }
    return { status: 'error', message: 'No se pudo asignar el voluntario. Inténtalo de nuevo.' };
  }

  revalidatePath(`/e/${slug}/coordinacion/voluntarios`);
  return { status: 'success' };
}

/**
 * Unassign a volunteer from a task (coordinator only).
 */
export async function unassignVolunteer(
  taskId: string,
  volunteerId: string,
  slug: string,
): Promise<ActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/coordinacion/voluntarios`);
  }

  const { error, response } = await api.POST('/tasks/{taskId}/unassign', {
    params: { path: { taskId } },
    body: { volunteerId },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect(`/login?next=/e/${slug}/coordinacion/voluntarios`);
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para quitar voluntarios.' };
    }
    if (response.status === 404) {
      return { status: 'error', message: 'Tarea no encontrada.' };
    }
    if (response.status === 422) {
      return { status: 'error', message: 'El voluntario no estaba asignado a esta tarea.' };
    }
    return { status: 'error', message: 'No se pudo quitar el voluntario. Inténtalo de nuevo.' };
  }

  revalidatePath(`/e/${slug}/coordinacion/voluntarios`);
  return { status: 'success' };
}

/**
 * Mark a task as completed (coordinator only).
 */
export async function completeTask(
  taskId: string,
  slug: string,
): Promise<ActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/coordinacion/voluntarios`);
  }

  const { error, response } = await api.POST('/tasks/{taskId}/complete', {
    params: { path: { taskId } },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect(`/login?next=/e/${slug}/coordinacion/voluntarios`);
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para completar esta tarea.' };
    }
    if (response.status === 409) {
      return { status: 'error', message: 'La tarea ya está cancelada.' };
    }
    return { status: 'error', message: 'No se pudo completar la tarea. Inténtalo de nuevo.' };
  }

  revalidatePath(`/e/${slug}/coordinacion/voluntarios`);
  return { status: 'success' };
}

/**
 * Cancel a task (coordinator only).
 */
export async function cancelTask(
  taskId: string,
  slug: string,
): Promise<ActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/coordinacion/voluntarios`);
  }

  const { error, response } = await api.POST('/tasks/{taskId}/cancel', {
    params: { path: { taskId } },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect(`/login?next=/e/${slug}/coordinacion/voluntarios`);
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para cancelar esta tarea.' };
    }
    if (response.status === 409) {
      return { status: 'error', message: 'La tarea ya está completada.' };
    }
    return { status: 'error', message: 'No se pudo cancelar la tarea. Inténtalo de nuevo.' };
  }

  revalidatePath(`/e/${slug}/coordinacion/voluntarios`);
  return { status: 'success' };
}
