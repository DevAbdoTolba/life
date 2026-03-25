/**
 * Mock for expo-crypto — used in node-environment unit tests.
 * expo-crypto uses ESM which cannot run in the node jest environment.
 */
let counter = 0;
module.exports = {
  randomUUID: jest.fn(() => `mock-uuid-${++counter}`),
};
