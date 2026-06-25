import { Need } from '../domain/need';

export interface NeedView {
  id: string;
  emergencyId: string;
  title: string;
  category: string;
  priority: string;
  requestedQuantity: number | null;
  unit: string | null;
  status: string;
  createdAt: string;
}

export function toNeedView(n: Need): NeedView {
  return {
    id: n.id.value,
    emergencyId: n.emergencyId.value,
    title: n.title,
    category: n.category,
    priority: n.priority,
    requestedQuantity: n.requestedQuantity,
    unit: n.unit,
    status: n.status,
    createdAt: n.createdAt.toISOString(),
  };
}
