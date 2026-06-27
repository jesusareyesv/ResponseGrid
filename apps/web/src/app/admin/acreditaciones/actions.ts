'use server';

import { revalidatePath } from 'next/cache';
import { getToken, clearToken, authHeaders } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';

export type AccreditationActionResult =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

/**
 * Local DTO that preserves the discriminated-union shape of `scope`.
 * The generated AccreditationViewDto has `scope: Record<string, never>` which
 * loses the union — we keep the original shape here so callers can compare
 * acc.scope === 'global' without TypeScript errors.
 */
export interface AccreditationDto {
  id: string;
  organizationId: string;
  scope: 'global' | { emergencyId: string };
  evidence?: string;
  grantedAt: string;
}

/** Fetch all accreditations, optionally filtered by org or emergency. */
export async function fetchAccreditations(
  organizationId?: string,
  emergencyId?: string,
): Promise<AccreditationDto[]> {
  const token = await getToken();
  if (!token) return [];

  const { data, error } = await api.GET('/accreditations', {
    params: { query: { organizationId, emergencyId } },
    headers: authHeaders(token),
  });

  if (error !== undefined) return [];

  // Double-cast via unknown: the runtime shape matches AccreditationDto, but
  // the generated schema uses Record<string, never> for scope, losing the
  // 'global' | { emergencyId } union that the page relies on.
  return (data ?? []) as unknown as AccreditationDto[];
}

/** Grant an accreditation (POST /accreditations). */
export async function grantAccreditationAction(
  _prev: AccreditationActionResult,
  formData: FormData,
): Promise<AccreditationActionResult> {
  const token = await getToken();
  if (!token) {
    redirect('/login?next=/admin/acreditaciones');
  }

  const organizationId = String(formData.get('organizationId') ?? '').trim();
  const scopeType = String(formData.get('scopeType') ?? '').trim();
  const emergencyId = String(formData.get('emergencyId') ?? '').trim();
  const evidence = String(formData.get('evidence') ?? '').trim() || undefined;

  if (!organizationId) {
    return { status: 'error', message: 'El ID de organización es obligatorio.' };
  }

  const scope: 'global' | { emergencyId: string } =
    scopeType === 'emergency' && emergencyId
      ? { emergencyId }
      : 'global';

  if (scopeType === 'emergency' && !emergencyId) {
    return { status: 'error', message: 'El ID de emergencia es obligatorio para el alcance "Esta emergencia".' };
  }

  const { error, response } = await api.POST('/accreditations', {
    body: { organizationId, scope, evidence },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect('/login?next=/admin/acreditaciones');
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para conceder acreditaciones.' };
    }
    if (response.status === 400) {
      return { status: 'error', message: 'Datos inválidos. Comprueba el ID de organización y el alcance.' };
    }
    return { status: 'error', message: 'Error al conceder la acreditación. Inténtalo de nuevo.' };
  }

  revalidatePath('/admin/acreditaciones');
  return { status: 'success' };
}

/** Revoke an accreditation (DELETE /accreditations/{id}). */
export async function revokeAccreditationAction(
  id: string,
): Promise<AccreditationActionResult> {
  const token = await getToken();
  if (!token) {
    redirect('/login?next=/admin/acreditaciones');
  }

  const { error, response } = await api.DELETE('/accreditations/{id}', {
    params: { path: { id } },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect('/login?next=/admin/acreditaciones');
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para revocar esta acreditación.' };
    }
    return { status: 'error', message: 'Error al revocar la acreditación. Inténtalo de nuevo.' };
  }

  revalidatePath('/admin/acreditaciones');
  return { status: 'success' };
}
