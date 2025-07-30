import * as SQLite from 'expo-sqlite';
import {
  MealPlan,
  CreateMealPlanInput,
  UpdateMealPlanInput,
  DatabaseError,
  NotFoundError,
} from '../../types';
import { databaseService } from './index';

export class MealPlanOperations {
  private getDb(): SQLite.SQLiteDatabase {
    return databaseService.getDatabase();
  }

  async create(input: CreateMealPlanInput): Promise<MealPlan> {
    try {
      const db = this.getDb();
      const id = `meal_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO meal_plans (id, name, date, meal_type, recipe_ids, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name,
          input.date,
          input.mealType,
          JSON.stringify(input.recipeIds),
          now,
          now,
        ]
      );

      return {
        id,
        name: input.name,
        date: input.date,
        mealType: input.mealType,
        recipeIds: input.recipeIds,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to create meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATE_ERROR'
      );
    }
  }

  async findById(id: string): Promise<MealPlan | null> {
    try {
      const db = this.getDb();
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM meal_plans WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      return this.mapRowToMealPlan(result);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FIND_ERROR'
      );
    }
  }

  async findAll(): Promise<MealPlan[]> {
    try {
      const db = this.getDb();
      const results = await db.getAllAsync<any>(
        'SELECT * FROM meal_plans ORDER BY date DESC, meal_type'
      );

      return results.map((row) => this.mapRowToMealPlan(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find meal plans: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FIND_ALL_ERROR'
      );
    }
  }

  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<MealPlan[]> {
    try {
      const db = this.getDb();
      const results = await db.getAllAsync<any>(
        'SELECT * FROM meal_plans WHERE date >= ? AND date <= ? ORDER BY date, meal_type',
        [startDate, endDate]
      );

      return results.map((row) => this.mapRowToMealPlan(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find meal plans by date range: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FIND_BY_DATE_RANGE_ERROR'
      );
    }
  }

  async update(input: UpdateMealPlanInput): Promise<MealPlan> {
    try {
      const db = this.getDb();
      const existing = await this.findById(input.id);

      if (!existing) {
        throw new NotFoundError('Meal plan not found', 'MealPlan', input.id);
      }

      const updatedAt = new Date().toISOString();
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (input.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(input.name);
      }
      if (input.date !== undefined) {
        updateFields.push('date = ?');
        updateValues.push(input.date);
      }
      if (input.mealType !== undefined) {
        updateFields.push('meal_type = ?');
        updateValues.push(input.mealType);
      }
      if (input.recipeIds !== undefined) {
        updateFields.push('recipe_ids = ?');
        updateValues.push(JSON.stringify(input.recipeIds));
      }

      updateFields.push('updated_at = ?');
      updateValues.push(updatedAt);
      updateValues.push(input.id);

      await db.runAsync(
        `UPDATE meal_plans SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      const updated = await this.findById(input.id);
      if (!updated) {
        throw new DatabaseError(
          'Failed to retrieve updated meal plan',
          'UPDATE_ERROR'
        );
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to update meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_ERROR'
      );
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const db = this.getDb();
      const existing = await this.findById(id);

      if (!existing) {
        throw new NotFoundError('Meal plan not found', 'MealPlan', id);
      }

      const result = await db.runAsync('DELETE FROM meal_plans WHERE id = ?', [
        id,
      ]);
      return result.changes > 0;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to delete meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETE_ERROR'
      );
    }
  }

  private mapRowToMealPlan(row: any): MealPlan {
    return {
      id: row.id,
      name: row.name,
      date: row.date,
      mealType: row.meal_type,
      recipeIds: JSON.parse(row.recipe_ids || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const mealPlanOperations = new MealPlanOperations();
