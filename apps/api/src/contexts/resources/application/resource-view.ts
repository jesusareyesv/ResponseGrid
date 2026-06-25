import { Resource } from '../domain/resource';

export interface ResourceView {
  id: string;
  type: string;
  side: string;
  name: string;
  verificationLevel: string;
  publicStatus: string;
}

export function toResourceView(r: Resource): ResourceView {
  return {
    id: r.id.value,
    type: r.type,
    side: r.side,
    name: r.name,
    verificationLevel: r.verificationLevel,
    publicStatus: r.publicStatus,
  };
}
