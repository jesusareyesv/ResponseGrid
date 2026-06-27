'use client';

import { useActionState, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { SubmitReportState } from './actions';
import { Button } from '@/components/atoms/button';
import { Select } from '@/components/atoms/select';
import { Textarea } from '@/components/atoms/textarea';
import { ErrorMessage } from '@/components/atoms/error-message';
import { FormField } from '@/components/molecules/form-field';
import { PhotoUploader } from '@/components/molecules/photo-uploader';

const INITIAL_STATE: SubmitReportState = { status: 'idle' };

const REPORT_TYPES = [
  { value: 'incident', label: 'Incidencia' },
  { value: 'stock', label: 'Stock' },
  { value: 'status', label: 'Estado' },
  { value: 'other', label: 'Otro' },
] as const;

const REPORT_PRIORITIES = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
] as const;

type BoundAction = (prev: SubmitReportState, formData: FormData) => Promise<SubmitReportState>;

interface ReportFormProps {
  action: BoundAction;
  slug: string;
  myResources: Array<{ id: string; name: string }>;
  prefilledResourceId?: string;
}

export function ReportForm({
  action,
  slug,
  myResources,
  prefilledResourceId,
}: ReportFormProps) {
  const [state, formAction, pending] = useActionState<SubmitReportState, FormData>(
    action,
    INITIAL_STATE,
  );

  const [type, setType] = useState('');
  const [priority, setPriority] = useState('');
  const [note, setNote] = useState('');
  const [resourceId, setResourceId] = useState(prefilledResourceId ?? '');
  const photoUrlsRef = useRef<string[]>([]);

  const handlePhotoUrlsChange = useCallback((urls: string[]) => {
    photoUrlsRef.current = urls;
  }, []);

  if (state.status === 'success') {
    return (
      <section
        role="alert"
        aria-live="polite"
        className="flex flex-col gap-6 rounded-lg border-2 border-gray-900 bg-white p-6"
      >
        <p className="text-lg font-semibold text-gray-900 leading-snug">
          Parte enviado correctamente. El coordinador lo revisará en breve.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={`/e/${slug}/reportar`}
            className="flex items-center justify-center w-full py-4 px-6 text-base font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
            onClick={() => {
              window.location.href = `/e/${slug}/reportar`;
            }}
          >
            Enviar otro parte
          </Link>
          <Link
            href={`/e/${slug}`}
            className="flex items-center justify-center w-full py-4 px-6 text-base font-semibold text-gray-900 bg-white border-2 border-gray-900 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
          >
            Volver a la emergencia
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form
      action={(formData: FormData) => {
        formData.set('photoUrls', JSON.stringify(photoUrlsRef.current));
        formAction(formData);
      }}
      className="flex flex-col gap-6"
      noValidate
    >
      {state.status === 'error' && (
        <ErrorMessage message={state.message ?? 'Error al enviar el parte'} />
      )}

      {/* Tipo */}
      <FormField
        htmlFor="type"
        label={<>Tipo <span aria-hidden="true">*</span></>}
      >
        <Select
          id="type"
          name="type"
          required
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="" disabled>Selecciona un tipo…</option>
          {REPORT_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </FormField>

      {/* Prioridad */}
      <FormField
        htmlFor="priority"
        label={<>Prioridad <span aria-hidden="true">*</span></>}
      >
        <Select
          id="priority"
          name="priority"
          required
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="" disabled>Selecciona una prioridad…</option>
          {REPORT_PRIORITIES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </FormField>

      {/* Nota */}
      <FormField
        htmlFor="note"
        label={<>Nota <span aria-hidden="true">*</span></>}
      >
        <Textarea
          id="note"
          name="note"
          rows={4}
          required
          placeholder="Describe la incidencia, estado o stock…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </FormField>

      {/* Punto relacionado */}
      {myResources.length > 0 && (
        <FormField
          htmlFor="resourceId"
          label="Punto relacionado (opcional)"
        >
          <Select
            id="resourceId"
            name="resourceId"
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
          >
            <option value="">General (sin punto específico)</option>
            {myResources.map(({ id, name }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </Select>
        </FormField>
      )}

      {/* Hidden field for resourceId when no resources to show selector */}
      {myResources.length === 0 && prefilledResourceId != null && (
        <input type="hidden" name="resourceId" value={prefilledResourceId} />
      )}

      {/* Fotos */}
      <PhotoUploader onUrlsChange={handlePhotoUrlsChange} />

      {/* Submit */}
      <Button type="submit" disabled={pending} fullWidth>
        {pending ? 'Enviando…' : 'Enviar parte'}
      </Button>
    </form>
  );
}
