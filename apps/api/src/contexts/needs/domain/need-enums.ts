export { Priority } from '../../../shared/domain/priority';

export enum NeedCategory {
  Hygiene = 'hygiene',
  Water = 'water',
  Food = 'food',
  Medical = 'medical',
  Shelter = 'shelter',
  Tools = 'tools',
  Other = 'other',
}

export enum NeedStatus {
  Pending = 'pending',
  Validated = 'validated',
  Rejected = 'rejected',
  Fulfilled = 'fulfilled',
}
