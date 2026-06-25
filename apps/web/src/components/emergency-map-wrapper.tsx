'use client';

import dynamic from 'next/dynamic';
import type { MapPoint } from './emergency-map';

// Leaflet must only run in the browser — dynamic with ssr:false is only
// valid inside a Client Component (Server Components forbid it in Next 16).
const EmergencyMap = dynamic(() => import('./emergency-map'), { ssr: false });

interface EmergencyMapWrapperProps {
  points: MapPoint[];
}

export function EmergencyMapWrapper({ points }: EmergencyMapWrapperProps) {
  return <EmergencyMap points={points} />;
}
