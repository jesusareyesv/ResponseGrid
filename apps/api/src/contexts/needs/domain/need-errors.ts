export class NeedNotPendingError extends Error {
  constructor() {
    super('Need must be in pending status to be validated or rejected');
    this.name = 'NeedNotPendingError';
  }
}
