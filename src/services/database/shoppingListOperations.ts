import * as SQLite from 'expo-sqlite';
import {
  ShoppingListItem,
  CreateShoppingListItemInput,
  UpdateShoppingListItemInput,
  DatabaseError,
  NotFoundError,
} from '../../types';
import { databaseService } from './index';

export class ShoppingListOperations {
  private getDb(): SQLite.SQLiteDatabase {
    return databaseService.getDatabase();
  }

  async create(input: CreateShoppingListItemInput): Promise<ShoppingListItem> {
    try {
      const db = this.getDb();
      const id = `shopping_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO shopping_list_items (id, ingredient_name, total_amount, unit, category, is_checked, meal_plan_ids, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.ingredientName,
          input.totalAmount,
          input.unit,
          input.category,
          input.isChecked ? 1 : 0,
          JSON.stringify(input.mealPlanIds),
          now,
          now,
        ]
      );

      return {
        id,
        ingredientName: input.ingredientName,
        totalAmount: input.totalAmount,
        unit: input.unit,
        category: input.category,
        isChecked: input.isChecked,
        mealPlanIds: input.mealPlanIds,
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to create shopping list item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATE_ERROR'
      );
    }
  }

  async findById(id: string): Promise<ShoppingListItem | null> {
    try {
      const db = this.getDb();
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM shopping_list_items WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      return this.mapRowToShoppingListItem(result);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find shopping list item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FIND_ERROR'
      );
    }
  }

  async findAll(): Promise<ShoppingListItem[]> {
    try {
      const db = this.getDb();
      const results = await db.getAllAsync<any>(
        'SELECT * FROM shopping_list_items ORDER BY category, ingredient_name'
      );

      return results.map((row) => this.mapRowToShoppingListItem(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find shopping list items: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FIND_ALL_ERROR'
      );
    }
  }

  async findByCategory(category: string): Promise<ShoppingListItem[]> {
    try {
      const db = this.getDb();
      const results = await db.getAllAsync<any>(
        'SELECT * FROM shopping_list_items WHERE category = ? ORDER BY ingredient_name',
        [category]
      );

      return results.map((row) => this.mapRowToShoppingListItem(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find shopping list items by category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FIND_BY_CATEGORY_ERROR'
      );
    }
  }

  async findUnchecked(): Promise<ShoppingListItem[]> {
    try {
      const db = this.getDb();
      const results = await db.getAllAsync<any>(
        'SELECT * FROM shopping_list_items WHERE is_checked = 0 ORDER BY category, ingredient_name'
      );

      return results.map((row) => this.mapRowToShoppingListItem(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find unchecked shopping list items: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FIND_UNCHECKED_ERROR'
      );
    }
  }

  async update(input: UpdateShoppingListItemInput): Promise<ShoppingListItem> {
    try {
      const db = this.getDb();
      const existing = await this.findById(input.id);

      if (!existing) {
        throw new NotFoundError(
          'Shopping list item not found',
          'ShoppingListItem',
          input.id
        );
      }

      const updatedAt = new Date().toISOString();
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (input.ingredientName !== undefined) {
        updateFields.push('ingredient_name = ?');
        updateValues.push(input.ingredientName);
      }
      if (input.totalAmount !== undefined) {
        updateFields.push('total_amount = ?');
        updateValues.push(input.totalAmount);
      }
      if (input.unit !== undefined) {
        updateFields.push('unit = ?');
        updateValues.push(input.unit);
      }
      if (input.category !== undefined) {
        updateFields.push('category = ?');
        updateValues.push(input.category);
      }
      if (input.isChecked !== undefined) {
        updateFields.push('is_checked = ?');
        updateValues.push(input.isChecked ? 1 : 0);
      }
      if (input.mealPlanIds !== undefined) {
        updateFields.push('meal_plan_ids = ?');
        updateValues.push(JSON.stringify(input.mealPlanIds));
      }

      updateFields.push('updated_at = ?');
      updateValues.push(updatedAt);
      updateValues.push(input.id);

      await db.runAsync(
        `UPDATE shopping_list_items SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      const updated = await this.findById(input.id);
      if (!updated) {
        throw new DatabaseError(
          'Failed to retrieve updated shopping list item',
          'UPDATE_ERROR'
        );
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to update shopping list item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_ERROR'
      );
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const db = this.getDb();
      const existing = await this.findById(id);

      if (!existing) {
        throw new NotFoundError(
          'Shopping list item not found',
          'ShoppingListItem',
          id
        );
      }

      const result = await db.runAsync(
        'DELETE FROM shopping_list_items WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to delete shopping list item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETE_ERROR'
      );
    }
  }

  async clearCheckedItems(): Promise<number> {
    try {
      const db = this.getDb();
      const result = await db.runAsync(
        'DELETE FROM shopping_list_items WHERE is_checked = 1'
      );
      return result.changes;
    } catch (error) {
      throw new DatabaseError(
        `Failed to clear checked items: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CLEAR_CHECKED_ERROR'
      );
    }
  }

  async toggleChecked(id: string): Promise<ShoppingListItem> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundError(
          'Shopping list item not found',
          'ShoppingListItem',
          id
        );
      }

      return await this.update({
        id,
        isChecked: !existing.isChecked,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to toggle checked status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TOGGLE_CHECKED_ERROR'
      );
    }
  }

  private mapRowToShoppingListItem(row: any): ShoppingListItem {
    return {
      id: row.id,
      ingredientName: row.ingredient_name,
      totalAmount: row.total_amount,
      unit: row.unit,
      category: row.category,
      isChecked: row.is_checked === 1,
      mealPlanIds: JSON.parse(row.meal_plan_ids || '[]'),
    };
  }
}

export const shoppingListOperations = new ShoppingListOperations();
