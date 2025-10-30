// Crypto polyfill for older Node.js versions
if (typeof globalThis.crypto === 'undefined') {
  const crypto = require('crypto');
  globalThis.crypto = {
    randomUUID: () => crypto.randomUUID(),
    getRandomValues: (array: any) => {
      const bytes = crypto.randomBytes(array.length);
      array.set(bytes);
      return array;
    }
  } as any;
}

// Ensure crypto.randomUUID is available
if (typeof crypto.randomUUID === 'undefined') {
  const crypto = require('crypto');
  (globalThis as any).crypto = {
    ...globalThis.crypto,
    randomUUID: () => crypto.randomUUID(),
  };
}
