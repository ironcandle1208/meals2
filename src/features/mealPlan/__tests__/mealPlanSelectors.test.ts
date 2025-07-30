import { RootState } from '../../../store';
import { MealPlan } from '../../../types';
import {
  selectMealPlans,
  selectCurrentMealPlan,
  selectMealPlanLoading,
  selectMealPlanError,
  selectMealPlanById,
  selectMealPlansByDate,
  selectMealPlansByDateRange,
  selectMealPlansByMealType,
  selectMealPlansGroupedByDate,
  selectTodayMealPlans,
  selectMealPlanStats,
  selectMealPlansBySearch,
} from '../mealPlanSelectors';

// Mock data
const mockMealPlans: MealPlan[] = [
  {
    id: 'meal_plan_1',
    name: 'Breakfast Plan',
    date: '2024-01-15',
    mealType: 'breakfast',
    recipeIds: ['recipe_1'],
    createdAt: '2024-01-15T08:00:00.000Z',
    updatedAt: '2024-01-15T08:00:00.000Z',
  },
  {
    id: 'meal_plan_2',
    name: 'Lunch Plan',
    date: '2024-01-15',
    mealType: 'lunch',
    recipeIds: ['recipe_2'],
    createdAt: '2024-01-15T12:00:00.000Z',
    updatedAt: '2024-01-15T12:00:00.000Z',
  },
  {
    id: 'meal_plan_3',
    name: 'Dinner Plan',
    date: '2024-01-16',
    mealType: 'dinner',
    recipeIds: ['recipe_3', 'recipe_4'],
    createdAt: '2024-01-16T18:00:00.000Z',
    updatedAt: '2024-01-16T18:00:00.000Z',
  },
];

const createMockState = (
  overrides?: Partial<RootState['mealPlan']>
): RootState => ({
  mealPlan: {
    mealPlans: mockMealPlans,
    currentMealPlan: mockMealPlans[0],
    loading: false,
    error: null,
    lastUpdated: '2024-01-15T10:00:00.000Z',
    ...overrides,
  },
  recipe: {
    recipes: [],
    currentRecipe: null,
    loading: false,
    error: null,
    lastUpdated: null,
    categories: [],
  },
  shoppingList: {
    items: [],
    loading: false,
    error: null,
    lastUpdated: null,
    generationInProgress: false,
  },
});

describe('mealPlanSelectors', () => {
  describe('basic selectors', () => {
    it('should select meal plans', () => {
      const state = createMockState();
      expect(selectMealPlans(state)).toEqual(mockMealPlans);
    });

    it('should select current meal plan', () => {
      const state = createMockState();
      expect(selectCurrentMealPlan(state)).toEqual(mockMealPlans[0]);
    });

    it('should select loading state', () => {
      const state = createMockState({ loading: true });
      expect(selectMealPlanLoading(state)).toBe(true);
    });

    it('should select error state', () => {
      const state = createMockState({ error: 'Test error' });
      expect(selectMealPlanError(state)).toBe('Test error');
    });
  });

  describe('selectMealPlanById', () => {
    it('should return meal plan by id', () => {
      const state = createMockState();
      const result = selectMealPlanById(state, 'meal_plan_2');
      expect(result).toEqual(mockMealPlans[1]);
    });

    it('should return null for non-existent id', () => {
      const state = createMockState();
      const result = selectMealPlanById(state, 'non_existent');
      expect(result).toBeNull();
    });
  });

  describe('selectMealPlansByDate', () => {
    it('should return meal plans for specific date', () => {
      const state = createMockState();
      const result = selectMealPlansByDate(state, '2024-01-15');
      expect(result).toHaveLength(2);
      expect(result).toEqual([mockMealPlans[0], mockMealPlans[1]]);
    });

    it('should return empty array for date with no meal plans', () => {
      const state = createMockState();
      const result = selectMealPlansByDate(state, '2024-01-20');
      expect(result).toEqual([]);
    });
  });

  describe('selectMealPlansByDateRange', () => {
    it('should return meal plans within date range', () => {
      const state = createMockState();
      const result = selectMealPlansByDateRange(
        state,
        '2024-01-15',
        '2024-01-16'
      );
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockMealPlans);
    });

    it('should return empty array for range with no meal plans', () => {
      const state = createMockState();
      const result = selectMealPlansByDateRange(
        state,
        '2024-01-20',
        '2024-01-25'
      );
      expect(result).toEqual([]);
    });
  });

  describe('selectMealPlansByMealType', () => {
    it('should return meal plans by meal type', () => {
      const state = createMockState();
      const result = selectMealPlansByMealType(state, 'breakfast');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMealPlans[0]);
    });
  });

  describe('selectMealPlansGroupedByDate', () => {
    it('should group meal plans by date and sort by meal type', () => {
      const state = createMockState();
      const result = selectMealPlansGroupedByDate(state);

      expect(result['2024-01-15']).toHaveLength(2);
      expect(result['2024-01-15'][0].mealType).toBe('breakfast');
      expect(result['2024-01-15'][1].mealType).toBe('lunch');

      expect(result['2024-01-16']).toHaveLength(1);
      expect(result['2024-01-16'][0].mealType).toBe('dinner');
    });
  });

  describe('selectTodayMealPlans', () => {
    it('should return meal plans for today', () => {
      const today = new Date().toISOString().split('T')[0];
      const todayMealPlan: MealPlan = {
        ...mockMealPlans[0],
        id: 'today_meal',
        date: today,
      };

      const state = createMockState({
        mealPlans: [todayMealPlan, ...mockMealPlans],
      });

      const result = selectTodayMealPlans(state);
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe(today);
    });
  });

  describe('selectMealPlanStats', () => {
    it('should calculate meal plan statistics', () => {
      const state = createMockState();
      const result = selectMealPlanStats(state);

      expect(result.total).toBe(3);
      expect(result.byMealType.breakfast).toBe(1);
      expect(result.byMealType.lunch).toBe(1);
      expect(result.byMealType.dinner).toBe(1);
      expect(result.uniqueDates).toBe(2);
      expect(result.totalRecipes).toBe(4); // recipe_1, recipe_2, recipe_3, recipe_4
    });
  });

  describe('selectMealPlansBySearch', () => {
    it('should filter meal plans by search term', () => {
      const state = createMockState();
      const result = selectMealPlansBySearch(state, 'Breakfast');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Breakfast Plan');
    });

    it('should return all meal plans for empty search term', () => {
      const state = createMockState();
      const result = selectMealPlansBySearch(state, '');
      expect(result).toEqual(mockMealPlans);
    });

    it('should be case insensitive', () => {
      const state = createMockState();
      const result = selectMealPlansBySearch(state, 'lunch');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Lunch Plan');
    });
  });
});
