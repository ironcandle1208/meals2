import * as SQLite from 'expo-sqlite';
import {
  Recipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  DatabaseError,
  NotFoundError,
} from '../../types';
import { databaseService } from './index';

export class RecipeOperations {
  private getDb(): SQLite.SQLiteDatabase {
    return databaseService.getDatabase();
  }

  async create(input: CreateRecipeInput): Promise<Recipe> {
    try {
      const db = this.getDb();
      const id = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO recipes (id, name, instructions, cooking_time, servings, category, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name,
          JSON.stringify(input.instructions),
          input.cookingTime,
          input.servings,
          input.category || null,
          now,
          now,
        ]
      );

      return {
        id,
        name: input.name,
        ingredients: input.ingredients,
        instructions: input.instructions,
        cookingTime: input.cookingTime,
        servings: input.servings,
        category: input.category,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to create recipe: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATE_ERROR'
      );
    }
  }

  async findById(id: string): Promise<Recipe | null> {
    try {
      const db = this.getDb();
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM recipes WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      // Get ingredients for this recipe
      const ingredients = await db.getAllAsync<any>(
        'SELECT * FROM ingredients WHERE recipe_id = ?',
        [id]
      );

      return this.mapRowToRecipe(result, ingredients);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find recipe: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FIND_ERROR'
      );
    }
  }

  async findAll(): Promise<Recipe[]> {
    try {
      const db = this.getDb();
      const results = await db.getAllAsync<any>(
        'SELECT * FROM recipes ORDER BY name'
      );

      const recipes: Recipe[] = [];
      for (const row of results) {
        const ingredients = await db.getAllAsync<any>(
          'SELECT * FROM ingredients WHERE recipe_id = ?',
          [row.id]
        );
        recipes.push(this.mapRowToRecipe(row, ingredients));
      }

      return recipes;
    } catch (error) {
      throw new DatabaseError(
        `Failed to find recipes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FIND_ALL_ERROR'
      );
    }
  }

  async findByCategory(category: string): Promise<Recipe[]> {
    try {
      const db = this.getDb();
      const results = await db.getAllAsync<any>(
        'SELECT * FROM recipes WHERE category = ? ORDER BY name',
        [category]
      );

      const recipes: Recipe[] = [];
      for (const row of results) {
        const ingredients = await db.getAllAsync<any>(
          'SELECT * FROM ingredients WHERE recipe_id = ?',
          [row.id]
        );
        recipes.push(this.mapRowToRecipe(row, ingredients));
      }

      return recipes;
    } catch (error) {
      throw new DatabaseError(
        `Failed to find recipes by category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FIND_BY_CATEGORY_ERROR'
      );
    }
  }

  async update(input: UpdateRecipeInput): Promise<Recipe> {
    try {
      const db = this.getDb();
      const existing = await this.findById(input.id);

      if (!existing) {
        throw new NotFoundError('Recipe not found', 'Recipe', input.id);
      }

      const updatedAt = new Date().toISOString();
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (input.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(input.name);
      }
      if (input.instructions !== undefined) {
        updateFields.push('instructions = ?');
        updateValues.push(JSON.stringify(input.instructions));
      }
      if (input.cookingTime !== undefined) {
        updateFields.push('cooking_time = ?');
        updateValues.push(input.cookingTime);
      }
      if (input.servings !== undefined) {
        updateFields.push('servings = ?');
        updateValues.push(input.servings);
      }
      if (input.category !== undefined) {
        updateFields.push('category = ?');
        updateValues.push(input.category);
      }

      updateFields.push('updated_at = ?');
      updateValues.push(updatedAt);
      updateValues.push(input.id);

      await db.runAsync(
        `UPDATE recipes SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // Update ingredients if provided
      if (input.ingredients !== undefined) {
        // Delete existing ingredients
        await db.runAsync('DELETE FROM ingredients WHERE recipe_id = ?', [
          input.id,
        ]);

        // Insert new ingredients
        for (const ingredient of input.ingredients) {
          const ingredientId = `ingredient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await db.runAsync(
            `INSERT INTO ingredients (id, recipe_id, name, amount, unit, category)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              ingredientId,
              input.id,
              ingredient.name,
              ingredient.amount,
              ingredient.unit,
              ingredient.category,
            ]
          );
        }
      }

      const updated = await this.findById(input.id);
      if (!updated) {
        throw new DatabaseError(
          'Failed to retrieve updated recipe',
          'UPDATE_ERROR'
        );
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to update recipe: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_ERROR'
      );
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const db = this.getDb();
      const existing = await this.findById(id);

      if (!existing) {
        throw new NotFoundError('Recipe not found', 'Recipe', id);
      }

      // Delete ingredients first (cascade should handle this, but being explicit)
      await db.runAsync('DELETE FROM ingredients WHERE recipe_id = ?', [id]);

      // Delete recipe
      const result = await db.runAsync('DELETE FROM recipes WHERE id = ?', [
        id,
      ]);
      return result.changes > 0;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to delete recipe: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETE_ERROR'
      );
    }
  }

  private mapRowToRecipe(row: any, ingredientRows: any[]): Recipe {
    const ingredients = ingredientRows.map((ingredientRow) => ({
      id: ingredientRow.id,
      name: ingredientRow.name,
      amount: ingredientRow.amount,
      unit: ingredientRow.unit,
      category: ingredientRow.category,
    }));

    return {
      id: row.id,
      name: row.name,
      ingredients,
      instructions: JSON.parse(row.instructions || '[]'),
      cookingTime: row.cooking_time,
      servings: row.servings,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const recipeOperations = new RecipeOperations();
