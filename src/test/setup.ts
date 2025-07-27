// Test setup file

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(),
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
      withTransactionAsync: jest.fn(),
    })
  ),
}));
