'use server';

import { revalidatePath } from 'next/cache';
import { getToken, clearToken, authHeaders } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type AccreditationActionResult =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export interface AccreditationDto {
  id: string;
  organizationId: string;
  scope: 'global' | { emergencyId: string };
  evidence?: string;
  grantedAt: string;
}

const API_BASE = process.env.API_URL ?? 'http://localhost:3000';

/** Fetch all accreditations, optionally filtered by org or emergency. */
export async function fetchAccreditations(
  organizationId?: string,
  emergencyId?: string,
): Promise<AccreditationDto[]> {
  const token = await getToken();
  if (!token) return [];

  const params = new URLSearchParams();
  if (organizationId) params.set('organizationId', organizationId);
  if (emergencyId) params.set('emergencyId', emergencyId);

  const qs = params.toString();
  const url = `${API_BASE}/accreditations${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    headers: authHeaders(token),
    cache: 'no-store',
  });

  if (!res.ok) return [];

  const data: unknown = await res.json();
  return Array.isArray(data) ? (data as AccreditationDto[]) : [];
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

  const res = await fetch(`${API_BASE}/accreditations`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId, scope, evidence }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      await clearToken();
      redirect('/login?next=/admin/acreditaciones');
    }
    if (res.status === 403) {
      return { status: 'error', message: 'No tienes permisos para conceder acreditaciones.' };
    }
    if (res.status === 400) {
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

  const res = await fetch(`${API_BASE}/accreditations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    if (res.status === 401) {
      await clearToken();
      redirect('/login?next=/admin/acreditaciones');
    }
    if (res.status === 403) {
      return { status: 'error', message: 'No tienes permisos para revocar esta acreditación.' };
    }
    return { status: 'error', message: 'Error al revocar la acreditación. Inténtalo de nuevo.' };
  }

  revalidatePath('/admin/acreditaciones');
  return { status: 'success' };
}
