'use server';

import { revalidatePath } from 'next/cache';
import { getToken, clearToken, authHeaders } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import type { components } from '@reliefhub/api-client';

export type TemplateActionResult =
  | { status: 'idle' }
  | { status: 'success'; message?: string }
  | { status: 'error'; message: string };

export type TemplateViewDto = components['schemas']['TemplateViewDto'];

// ── List ────────────────────────────────────────────────────────────────────

export async function fetchTemplates(): Promise<TemplateViewDto[]> {
  const token = await getToken();
  if (!token) return [];

  const { data, error } = await api.GET('/templates', {
    headers: authHeaders(token),
  });

  if (error !== undefined) return [];

  return data ?? [];
}

// ── Create ──────────────────────────────────────────────────────────────────

export async function createTemplateAction(
  _prev: TemplateActionResult,
  formData: FormData,
): Promise<TemplateActionResult> {
  const token = await getToken();
  if (!token) {
    redirect('/login?next=/admin/templates');
  }

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const dontBringRaw = String(formData.get('dontBringList') ?? '');
  const defaultAnnouncement =
    String(formData.get('defaultAnnouncement') ?? '').trim() || null;

  if (!name) {
    return { status: 'error', message: 'El nombre es obligatorio.' };
  }
  if (!description) {
    return { status: 'error', message: 'La descripción es obligatoria.' };
  }

  const dontBringList = dontBringRaw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (dontBringList.length === 0) {
    return {
      status: 'error',
      message: 'La lista "qué no llevar" debe tener al menos un ítem.',
    };
  }

  const { error, response } = await api.POST('/templates', {
    body: { name, description, dontBringList, defaultAnnouncement },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect('/login?next=/admin/templates');
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para crear plantillas.' };
    }
    if (response.status === 400) {
      return { status: 'error', message: 'Datos inválidos. Revisa los campos.' };
    }
    return { status: 'error', message: 'Error al crear la plantilla. Inténtalo de nuevo.' };
  }

  revalidatePath('/admin/templates');
  return { status: 'success', message: 'Plantilla creada correctamente.' };
}

// ── Delete ──────────────────────────────────────────────────────────────────

export async function deleteTemplateAction(id: string): Promise<TemplateActionResult> {
  const token = await getToken();
  if (!token) {
    redirect('/login?next=/admin/templates');
  }

  const { error, response } = await api.DELETE('/templates/{id}', {
    params: { path: { id } },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect('/login?next=/admin/templates');
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para eliminar esta plantilla.' };
    }
    if (response.status === 404) {
      return { status: 'error', message: 'Plantilla no encontrada.' };
    }
    return { status: 'error', message: 'Error al eliminar la plantilla. Inténtalo de nuevo.' };
  }

  revalidatePath('/admin/templates');
  return { status: 'success' };
}

// ── Create from template ────────────────────────────────────────────────────

export type CreateFromTemplateResult =
  | { status: 'idle' }
  | { status: 'success'; slug: string }
  | { status: 'error'; message: string };

export async function createFromTemplateAction(
  _prev: CreateFromTemplateResult,
  formData: FormData,
): Promise<CreateFromTemplateResult> {
  const token = await getToken();
  if (!token) {
    redirect('/login?next=/admin/templates');
  }

  const templateId = String(formData.get('templateId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();

  if (!templateId) {
    return { status: 'error', message: 'Debes seleccionar una plantilla.' };
  }
  if (!name) {
    return { status: 'error', message: 'El nombre de la emergencia es obligatorio.' };
  }
  if (!slug) {
    return { status: 'error', message: 'El slug es obligatorio.' };
  }
  if (!country) {
    return { status: 'error', message: 'El código de país es obligatorio.' };
  }

  const { data, error, response } = await api.POST('/emergencies/from-template', {
    body: { templateId, name, slug, country },
    headers: authHeaders(token),
  });

  if (error !== undefined) {
    if (response.status === 401) {
      await clearToken();
      redirect('/login?next=/admin/templates');
    }
    if (response.status === 403) {
      return { status: 'error', message: 'No tienes permisos para crear emergencias.' };
    }
    if (response.status === 404) {
      return { status: 'error', message: 'Plantilla no encontrada.' };
    }
    if (response.status === 400) {
      return { status: 'error', message: 'Datos inválidos. Verifica el slug y el código de país.' };
    }
    return { status: 'error', message: 'Error al crear la emergencia. Inténtalo de nuevo.' };
  }

  const createdSlug = data?.slug ?? slug;

  revalidatePath('/admin/templates');
  return { status: 'success', slug: createdSlug };
}
