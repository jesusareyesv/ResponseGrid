export class UnauthorizedStatusChangeError extends Error {
  constructor() {
    super('Not authorized to change the status of this resource');
    this.name = 'UnauthorizedStatusChangeError';
  }
}
