'use server';

import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { setToken } from '@/lib/auth';

export type LoginResult =
  | { status: 'idle' }
  | { status: 'error'; message: string };

export async function loginAction(
  next: string,
  _prev: LoginResult,
  formData: FormData,
): Promise<LoginResult> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const { data, error } = await api.POST('/auth/login', {
    body: { email, password },
  });

  if (error !== undefined || data === undefined) {
    return { status: 'error', message: 'Credenciales incorrectas.' };
  }

  await setToken(data.accessToken);
  // Sanitize the redirect target: only allow internal relative paths to prevent
  // open redirect attacks (e.g. ?next=https://evil.com or ?next=//evil.com).
  const safe =
    typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
      ? next
      : '/';
  redirect(safe);
}
