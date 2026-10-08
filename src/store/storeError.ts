/** A save or load failed. The message is fixed so it is never shown to the user. */
export class StoreError extends Error {
  constructor() {
    super('save-failed');
    this.name = 'StoreError';
  }
}
