'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, clearToken, authHeaders } from '@/lib/auth';
import type { components } from '@reliefhub/api-client';

type VerificationLevel = Exclude<
  components['schemas']['VerifyResourceDto']['level'],
  'unverified'
>;

export type ActionResult =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

/**
 * Verifies a resource at the given level and immediately publishes it.
 * The token is read server-side from the httpOnly cookie — never exposed to
 * the client.
 */
export async function verifyAndPublish(
  resourceId: string,
  slug: string,
  level: VerificationLevel,
): Promise<ActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/coordinacion`);
  }

  const headers = authHeaders(token);

  const { error: verifyError, response: verifyResponse } = await api.POST(
    '/resources/{resourceId}/verify',
    {
      params: { path: { resourceId } },
      body: { level },
      headers,
    },
  );

  if (verifyError !== undefined) {
    if (verifyResponse.status === 401) {
      await clearToken();
      redirect(`/login?next=/e/${slug}/coordinacion`);
    }
    return {
      status: 'error',
      message: 'No se pudo verificar el recurso. Inténtalo de nuevo.',
    };
  }

  const { error: publishError, response: publishResponse } = await api.POST(
    '/resources/{resourceId}/publish',
    {
      params: { path: { resourceId } },
      headers,
    },
  );

  if (publishError !== undefined) {
    if (publishResponse.status === 401) {
      await clearToken();
      redirect(`/login?next=/e/${slug}/coordinacion`);
    }
    return {
      status: 'error',
      message:
        'Recurso verificado pero no se pudo publicar. Contacta al administrador.',
    };
  }

  revalidatePath(`/e/${slug}/coordinacion`);
  return { status: 'success' };
}

/**
 * Validates a pending need (moves it to "validated" state so it appears publicly).
 */
export async function validateNeed(
  needId: string,
  slug: string,
): Promise<ActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/coordinacion`);
  }

  const headers = authHeaders(token);

  const { error, response } = await api.POST('/needs/{needId}/validate', {
    params: { path: { needId } },
    headers,
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect(`/login?next=/e/${slug}/coordinacion`);
    }
    return {
      status: 'error',
      message: 'No se pudo validar la petición. Inténtalo de nuevo.',
    };
  }

  revalidatePath(`/e/${slug}/coordinacion`);
  return { status: 'success' };
}

/**
 * Clears the auth cookie and redirects to the login page.
 */
export async function logout(): Promise<never> {
  await clearToken();
  redirect('/login');
}

/**
 * Pauses intake for the given emergency (coordinator only).
 * Returns an ActionResult — does not redirect, so the coordinator stays on
 * the page and sees the outcome.
 */
export async function pauseEmergency(
  emergencyId: string,
  slug: string,
): Promise<ActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/coordinacion`);
  }

  const { error, response } = await api.POST('/emergencies/{id}/pause', {
    params: { path: { id: emergencyId } },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect(`/login?next=/e/${slug}/coordinacion`);
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para pausar esta emergencia.' };
    }
    if (response.status === 409) {
      return { status: 'error', message: 'La emergencia ya está en pausa.' };
    }
    return { status: 'error', message: 'No se pudo pausar la emergencia. Inténtalo de nuevo.' };
  }

  revalidatePath(`/e/${slug}/coordinacion`);
  revalidatePath(`/e/${slug}`);
  return { status: 'success' };
}

/**
 * Resumes intake for a paused emergency (coordinator only).
 */
export async function resumeEmergency(
  emergencyId: string,
  slug: string,
): Promise<ActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/coordinacion`);
  }

  const { error, response } = await api.POST('/emergencies/{id}/resume', {
    params: { path: { id: emergencyId } },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect(`/login?next=/e/${slug}/coordinacion`);
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para reanudar esta emergencia.' };
    }
    if (response.status === 409) {
      return { status: 'error', message: 'La emergencia no está en pausa.' };
    }
    return { status: 'error', message: 'No se pudo reanudar la emergencia. Inténtalo de nuevo.' };
  }

  revalidatePath(`/e/${slug}/coordinacion`);
  revalidatePath(`/e/${slug}`);
  return { status: 'success' };
}

/**
 * Updates the official announcement for an emergency (coordinator only).
 */
export async function publishAnnouncement(
  emergencyId: string,
  slug: string,
  message: string,
): Promise<ActionResult> {
  const token = await getToken();
  if (token === null) {
    redirect(`/login?next=/e/${slug}/coordinacion`);
  }

  const { error, response } = await api.PUT('/emergencies/{id}/announcement', {
    params: { path: { id: emergencyId } },
    body: { message },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect(`/login?next=/e/${slug}/coordinacion`);
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para publicar comunicados en esta emergencia.' };
    }
    return { status: 'error', message: 'No se pudo publicar el comunicado. Inténtalo de nuevo.' };
  }

  revalidatePath(`/e/${slug}/coordinacion`);
  revalidatePath(`/e/${slug}`);
  return { status: 'success' };
}
