import * as SQLite from 'expo-sqlite';
import { DatabaseError } from '../../types';

export interface DatabaseService {
  initialize(): Promise<void>;
  close(): Promise<void>;
  getDatabase(): SQLite.SQLiteDatabase;
}

export class SQLiteService implements DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly dbName = 'meals.db';

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.dbName);
      await this.createTables();
      await this.createIndexes();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new DatabaseError(
        `Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INIT_ERROR'
      );
    }
  }

  async close(): Promise<void> {
    try {
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
        console.log('Database closed successfully');
      }
    } catch (error) {
      console.error('Database close failed:', error);
      throw new DatabaseError(
        `Failed to close database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CLOSE_ERROR'
      );
    }
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new DatabaseError('Database not initialized', 'NOT_INITIALIZED');
    }
    return this.db;
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized', 'NOT_INITIALIZED');
    }

    // Create meal_plans table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS meal_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
        recipe_ids TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Create recipes table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        instructions TEXT NOT NULL DEFAULT '[]',
        cooking_time INTEGER NOT NULL DEFAULT 0,
        servings INTEGER NOT NULL DEFAULT 1,
        category TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Create ingredients table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        unit TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('vegetables', 'meat', 'dairy', 'grains', 'spices', 'other')),
        FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
      );
    `);

    // Create shopping_list_items table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS shopping_list_items (
        id TEXT PRIMARY KEY,
        ingredient_name TEXT NOT NULL,
        total_amount REAL NOT NULL,
        unit TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('vegetables', 'meat', 'dairy', 'grains', 'spices', 'other')),
        is_checked INTEGER NOT NULL DEFAULT 0,
        meal_plan_ids TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    console.log('Database tables created successfully');
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized', 'NOT_INITIALIZED');
    }

    // Indexes for meal_plans
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans (date);
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_meal_plans_meal_type ON meal_plans (meal_type);
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_meal_plans_date_meal_type ON meal_plans (date, meal_type);
    `);

    // Indexes for recipes
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes (name);
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes (category);
    `);

    // Indexes for ingredients
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON ingredients (recipe_id);
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients (name);
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients (category);
    `);

    // Indexes for shopping_list_items
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_shopping_list_items_category ON shopping_list_items (category);
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_shopping_list_items_is_checked ON shopping_list_items (is_checked);
    `);

    console.log('Database indexes created successfully');
  }
}

export const databaseService = new SQLiteService();

// Export all operations
export { mealPlanOperations } from './mealPlanOperations';
export { recipeOperations } from './recipeOperations';
export { shoppingListOperations } from './shoppingListOperations';
