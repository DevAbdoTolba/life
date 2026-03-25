/**
 * Mock for expo-sqlite — used in node-environment unit tests.
 * expo-sqlite uses ESM which cannot run in the node jest environment.
 */
module.exports = {
  openDatabaseAsync: jest.fn(),
  SQLiteDatabase: jest.fn(),
};
