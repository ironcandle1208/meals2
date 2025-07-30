import { databaseService } from './index';
import { DatabaseError } from '../../types';

/**
 * Initialize the database for the application
 * This should be called when the app starts
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await databaseService.initialize();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw new DatabaseError(
      `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'INIT_FAILED'
    );
  }
}

/**
 * Close the database connection
 * This should be called when the app is shutting down
 */
export async function closeDatabase(): Promise<void> {
  try {
    await databaseService.close();
    console.log('✅ Database closed successfully');
  } catch (error) {
    console.error('❌ Failed to close database:', error);
    throw new DatabaseError(
      `Database close failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'CLOSE_FAILED'
    );
  }
}

/**
 * Reset the database by dropping all tables and recreating them
 * WARNING: This will delete all data!
 */
export async function resetDatabase(): Promise<void> {
  try {
    const db = databaseService.getDatabase();

    // Drop all tables
    await db.execAsync('DROP TABLE IF EXISTS shopping_list_items');
    await db.execAsync('DROP TABLE IF EXISTS ingredients');
    await db.execAsync('DROP TABLE IF EXISTS recipes');
    await db.execAsync('DROP TABLE IF EXISTS meal_plans');

    console.log('🗑️ All tables dropped');

    // Reinitialize
    await databaseService.initialize();
    console.log('✅ Database reset successfully');
  } catch (error) {
    console.error('❌ Failed to reset database:', error);
    throw new DatabaseError(
      `Database reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RESET_FAILED'
    );
  }
}

/**
 * Check if the database is properly initialized
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const db = databaseService.getDatabase();

    // Check if all required tables exist
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    const requiredTables = [
      'meal_plans',
      'recipes',
      'ingredients',
      'shopping_list_items',
    ];
    const existingTables = tables.map((t) => t.name);

    const missingTables = requiredTables.filter(
      (table) => !existingTables.includes(table)
    );

    if (missingTables.length > 0) {
      console.warn('⚠️ Missing database tables:', missingTables);
      return false;
    }

    console.log('✅ Database health check passed');
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}
