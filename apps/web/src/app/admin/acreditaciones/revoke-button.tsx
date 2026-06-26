'use client';

import { useTransition } from 'react';
import { revokeAccreditationAction } from './actions';
import { Button } from '@/components/atoms/button';

interface RevokeButtonProps {
  accreditationId: string;
}

export function RevokeButton({ accreditationId }: RevokeButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleRevoke() {
    startTransition(async () => {
      await revokeAccreditationAction(accreditationId);
    });
  }

  return (
    <Button
      type="button"
      variant="danger-outline"
      size="sm"
      disabled={pending}
      onClick={handleRevoke}
    >
      {pending ? 'Revocando…' : 'Revocar'}
    </Button>
  );
}
