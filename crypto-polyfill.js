// Node.js crypto polyfill for older versions
if (typeof globalThis.crypto === 'undefined') {
  const crypto = require('crypto');
  globalThis.crypto = {
    randomUUID: () => crypto.randomUUID(),
    getRandomValues: (array) => {
      const bytes = crypto.randomBytes(array.length);
      array.set(bytes);
      return array;
    }
  };
}
