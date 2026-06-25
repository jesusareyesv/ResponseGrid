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
