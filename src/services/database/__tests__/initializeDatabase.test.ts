import {
  initializeDatabase,
  closeDatabase,
  resetDatabase,
  checkDatabaseHealth,
} from '../initializeDatabase';
import { databaseService } from '../index';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('Database Initialization', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execAsync: jest.fn(),
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      closeAsync: jest.fn(),
    };

    const SQLite = require('expo-sqlite');
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeDatabase', () => {
    it('should initialize database successfully', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);

      await expect(initializeDatabase()).resolves.not.toThrow();
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS meal_plans')
      );
    });

    it('should throw error when initialization fails', async () => {
      mockDb.execAsync.mockRejectedValue(new Error('Database error'));

      await expect(initializeDatabase()).rejects.toThrow(
        'Database initialization failed'
      );
    });
  });

  describe('closeDatabase', () => {
    it('should close database successfully', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);
      mockDb.closeAsync.mockResolvedValue(undefined);

      await initializeDatabase();
      await expect(closeDatabase()).resolves.not.toThrow();
      expect(mockDb.closeAsync).toHaveBeenCalled();
    });

    it('should throw error when close fails', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);
      mockDb.closeAsync.mockRejectedValue(new Error('Close error'));

      await initializeDatabase();
      await expect(closeDatabase()).rejects.toThrow('Database close failed');
    });
  });

  describe('resetDatabase', () => {
    it('should reset database successfully', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);

      await initializeDatabase();
      await expect(resetDatabase()).resolves.not.toThrow();

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        'DROP TABLE IF EXISTS shopping_list_items'
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        'DROP TABLE IF EXISTS ingredients'
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        'DROP TABLE IF EXISTS recipes'
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        'DROP TABLE IF EXISTS meal_plans'
      );
    });
  });

  describe('checkDatabaseHealth', () => {
    it('should return true when all tables exist', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);
      mockDb.getAllAsync.mockResolvedValue([
        { name: 'meal_plans' },
        { name: 'recipes' },
        { name: 'ingredients' },
        { name: 'shopping_list_items' },
      ]);

      await initializeDatabase();
      const result = await checkDatabaseHealth();

      expect(result).toBe(true);
    });

    it('should return false when tables are missing', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);
      mockDb.getAllAsync.mockResolvedValue([
        { name: 'meal_plans' },
        { name: 'recipes' },
        // Missing ingredients and shopping_list_items tables
      ]);

      await initializeDatabase();
      const result = await checkDatabaseHealth();

      expect(result).toBe(false);
    });

    it('should return false when database check fails', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);
      mockDb.getAllAsync.mockRejectedValue(new Error('Database error'));

      await initializeDatabase();
      const result = await checkDatabaseHealth();

      expect(result).toBe(false);
    });
  });
});
