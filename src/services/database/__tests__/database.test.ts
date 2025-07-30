import {
  databaseService,
  mealPlanOperations,
  recipeOperations,
  shoppingListOperations,
} from '../index';
import { IngredientCategory } from '../../../types';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('Database Service', () => {
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

  describe('Database Initialization', () => {
    it('should initialize database successfully', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);

      await databaseService.initialize();

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS meal_plans')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS recipes')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS ingredients')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          'CREATE TABLE IF NOT EXISTS shopping_list_items'
        )
      );
    });

    it('should create indexes successfully', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);

      await databaseService.initialize();

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          'CREATE INDEX IF NOT EXISTS idx_meal_plans_date'
        )
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_recipes_name')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          'CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id'
        )
      );
    });

    it('should close database successfully', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);
      mockDb.closeAsync.mockResolvedValue(undefined);

      await databaseService.initialize();
      await databaseService.close();

      expect(mockDb.closeAsync).toHaveBeenCalled();
    });

    it('should throw error when database not initialized', () => {
      expect(() => databaseService.getDatabase()).toThrow(
        'Database not initialized'
      );
    });
  });

  describe('Meal Plan Operations', () => {
    beforeEach(async () => {
      mockDb.execAsync.mockResolvedValue(undefined);
      await databaseService.initialize();
    });

    it('should create meal plan successfully', async () => {
      const mockResult = { changes: 1, lastInsertRowId: 1 };
      mockDb.runAsync.mockResolvedValue(mockResult);

      const input = {
        name: 'Test Meal Plan',
        date: '2024-01-01',
        mealType: 'breakfast' as const,
        recipeIds: ['recipe1', 'recipe2'],
      };

      const result = await mealPlanOperations.create(input);

      expect(result.name).toBe(input.name);
      expect(result.date).toBe(input.date);
      expect(result.mealType).toBe(input.mealType);
      expect(result.recipeIds).toEqual(input.recipeIds);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should find meal plan by id', async () => {
      const mockRow = {
        id: 'meal_plan_1',
        name: 'Test Meal Plan',
        date: '2024-01-01',
        meal_type: 'breakfast',
        recipe_ids: '["recipe1", "recipe2"]',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };
      mockDb.getFirstAsync.mockResolvedValue(mockRow);

      const result = await mealPlanOperations.findById('meal_plan_1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('meal_plan_1');
      expect(result!.name).toBe('Test Meal Plan');
      expect(result!.mealType).toBe('breakfast');
      expect(result!.recipeIds).toEqual(['recipe1', 'recipe2']);
    });

    it('should return null when meal plan not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await mealPlanOperations.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should find all meal plans', async () => {
      const mockRows = [
        {
          id: 'meal_plan_1',
          name: 'Breakfast Plan',
          date: '2024-01-01',
          meal_type: 'breakfast',
          recipe_ids: '[]',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'meal_plan_2',
          name: 'Lunch Plan',
          date: '2024-01-01',
          meal_type: 'lunch',
          recipe_ids: '[]',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockRows);

      const result = await mealPlanOperations.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Breakfast Plan');
      expect(result[1].name).toBe('Lunch Plan');
    });

    it('should update meal plan successfully', async () => {
      const existingRow = {
        id: 'meal_plan_1',
        name: 'Old Name',
        date: '2024-01-01',
        meal_type: 'breakfast',
        recipe_ids: '[]',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };
      const updatedRow = {
        ...existingRow,
        name: 'New Name',
        updated_at: '2024-01-01T01:00:00.000Z',
      };

      mockDb.getFirstAsync
        .mockResolvedValueOnce(existingRow)
        .mockResolvedValueOnce(updatedRow);
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await mealPlanOperations.update({
        id: 'meal_plan_1',
        name: 'New Name',
      });

      expect(result.name).toBe('New Name');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE meal_plans SET'),
        expect.arrayContaining(['New Name'])
      );
    });

    it('should delete meal plan successfully', async () => {
      const existingRow = {
        id: 'meal_plan_1',
        name: 'Test Plan',
        date: '2024-01-01',
        meal_type: 'breakfast',
        recipe_ids: '[]',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      mockDb.getFirstAsync.mockResolvedValue(existingRow);
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await mealPlanOperations.delete('meal_plan_1');

      expect(result).toBe(true);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM meal_plans WHERE id = ?',
        ['meal_plan_1']
      );
    });
  });

  describe('Recipe Operations', () => {
    beforeEach(async () => {
      mockDb.execAsync.mockResolvedValue(undefined);
      await databaseService.initialize();
    });

    it('should create recipe successfully', async () => {
      const mockResult = { changes: 1, lastInsertRowId: 1 };
      mockDb.runAsync.mockResolvedValue(mockResult);

      const input = {
        name: 'Test Recipe',
        ingredients: [
          {
            id: 'ing1',
            name: 'Tomato',
            amount: 2,
            unit: 'pieces',
            category: IngredientCategory.VEGETABLES,
          },
        ],
        instructions: ['Step 1', 'Step 2'],
        cookingTime: 30,
        servings: 4,
        category: 'Main Course',
      };

      const result = await recipeOperations.create(input);

      expect(result.name).toBe(input.name);
      expect(result.ingredients).toEqual(input.ingredients);
      expect(result.instructions).toEqual(input.instructions);
      expect(result.cookingTime).toBe(input.cookingTime);
      expect(result.servings).toBe(input.servings);
      expect(result.category).toBe(input.category);
    });

    it('should find recipe by id with ingredients', async () => {
      const mockRecipeRow = {
        id: 'recipe_1',
        name: 'Test Recipe',
        instructions: '["Step 1", "Step 2"]',
        cooking_time: 30,
        servings: 4,
        category: 'Main Course',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };
      const mockIngredientRows = [
        {
          id: 'ing1',
          recipe_id: 'recipe_1',
          name: 'Tomato',
          amount: 2,
          unit: 'pieces',
          category: 'vegetables',
        },
      ];

      mockDb.getFirstAsync.mockResolvedValue(mockRecipeRow);
      mockDb.getAllAsync.mockResolvedValue(mockIngredientRows);

      const result = await recipeOperations.findById('recipe_1');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Test Recipe');
      expect(result!.ingredients).toHaveLength(1);
      expect(result!.ingredients[0].name).toBe('Tomato');
    });
  });

  describe('Shopping List Operations', () => {
    beforeEach(async () => {
      mockDb.execAsync.mockResolvedValue(undefined);
      await databaseService.initialize();
    });

    it('should create shopping list item successfully', async () => {
      const mockResult = { changes: 1, lastInsertRowId: 1 };
      mockDb.runAsync.mockResolvedValue(mockResult);

      const input = {
        ingredientName: 'Tomato',
        totalAmount: 5,
        unit: 'pieces',
        category: IngredientCategory.VEGETABLES,
        isChecked: false,
        mealPlanIds: ['meal1', 'meal2'],
      };

      const result = await shoppingListOperations.create(input);

      expect(result.ingredientName).toBe(input.ingredientName);
      expect(result.totalAmount).toBe(input.totalAmount);
      expect(result.unit).toBe(input.unit);
      expect(result.category).toBe(input.category);
      expect(result.isChecked).toBe(input.isChecked);
      expect(result.mealPlanIds).toEqual(input.mealPlanIds);
    });

    it('should toggle checked status', async () => {
      const existingRow = {
        id: 'shopping_1',
        ingredient_name: 'Tomato',
        total_amount: 5,
        unit: 'pieces',
        category: 'vegetables',
        is_checked: 0,
        meal_plan_ids: '["meal1"]',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };
      const updatedRow = {
        ...existingRow,
        is_checked: 1,
        updated_at: '2024-01-01T01:00:00.000Z',
      };

      // Mock the sequence: findById (for toggle) -> findById (for update check) -> runAsync (update) -> findById (final result)
      mockDb.getFirstAsync
        .mockResolvedValueOnce(existingRow) // First findById in toggleChecked
        .mockResolvedValueOnce(existingRow) // Second findById in update method
        .mockResolvedValueOnce(updatedRow); // Third findById after update
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await shoppingListOperations.toggleChecked('shopping_1');

      expect(result.isChecked).toBe(true);
    });

    it('should clear checked items', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 3 });

      const result = await shoppingListOperations.clearCheckedItems();

      expect(result).toBe(3);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM shopping_list_items WHERE is_checked = 1'
      );
    });
  });
});
