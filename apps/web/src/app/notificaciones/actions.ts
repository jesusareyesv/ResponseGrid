'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, authHeaders } from '@/lib/auth';

export type NotificationActionResult =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

/**
 * Mark a single notification as read.
 * Only the owner of the notification can call this.
 */
export async function markNotificationReadAction(
  id: string,
): Promise<NotificationActionResult> {
  const token = await getToken();
  if (!token) {
    redirect('/login?next=/notificaciones');
  }

  const { error, response } = await api.POST('/notifications/{id}/read', {
    params: { path: { id } },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) redirect('/login?next=/notificaciones');
    if (response.status === 403) {
      return { status: 'error', message: 'No puedes marcar esta notificación como leída.' };
    }
    if (response.status === 404) {
      return { status: 'error', message: 'Notificación no encontrada.' };
    }
    return { status: 'error', message: 'No se pudo marcar la notificación. Inténtalo de nuevo.' };
  }

  revalidatePath('/notificaciones');
  revalidatePath('/');
  return { status: 'success' };
}

/**
 * Mark all notifications for the authenticated user as read.
 */
export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const token = await getToken();
  if (!token) {
    redirect('/login?next=/notificaciones');
  }

  const { error, response } = await api.POST('/notifications/read-all', {
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) redirect('/login?next=/notificaciones');
    return { status: 'error', message: 'No se pudieron marcar todas las notificaciones. Inténtalo de nuevo.' };
  }

  revalidatePath('/notificaciones');
  revalidatePath('/');
  return { status: 'success' };
}
