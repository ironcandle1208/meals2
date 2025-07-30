import { configureStore } from '@reduxjs/toolkit';
import mealPlanSlice, {
  fetchMealPlans,
  fetchMealPlanById,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  clearError,
  clearCurrentMealPlan,
  setCurrentMealPlan,
} from '../mealPlanSlice';
import {
  MealPlan,
  CreateMealPlanInput,
  UpdateMealPlanInput,
} from '../../../types';

// Mock the database operations
jest.mock('../../../services/database/mealPlanOperations', () => ({
  mealPlanOperations: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { mealPlanOperations } from '../../../services/database/mealPlanOperations';

const mockMealPlanOperations = mealPlanOperations as jest.Mocked<
  typeof mealPlanOperations
>;

// Test store setup
const createTestStore = () =>
  configureStore({
    reducer: {
      mealPlan: mealPlanSlice,
    },
  });

// Mock data
const mockMealPlan: MealPlan = {
  id: 'meal_plan_1',
  name: 'Test Meal Plan',
  date: '2024-01-15',
  mealType: 'dinner',
  recipeIds: ['recipe_1', 'recipe_2'],
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
};

const mockCreateInput: CreateMealPlanInput = {
  name: 'New Meal Plan',
  date: '2024-01-16',
  mealType: 'lunch',
  recipeIds: ['recipe_3'],
};

const mockUpdateInput: UpdateMealPlanInput = {
  id: 'meal_plan_1',
  name: 'Updated Meal Plan',
};

describe('mealPlanSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().mealPlan;
      expect(state).toEqual({
        mealPlans: [],
        currentMealPlan: null,
        loading: false,
        error: null,
        lastUpdated: null,
      });
    });
  });

  describe('reducers', () => {
    it('should clear error', () => {
      // Set an error first
      store.dispatch({
        type: 'mealPlan/fetchMealPlans/rejected',
        payload: 'Test error',
      });
      expect(store.getState().mealPlan.error).toBe('Test error');

      // Clear the error
      store.dispatch(clearError());
      expect(store.getState().mealPlan.error).toBeNull();
    });

    it('should clear current meal plan', () => {
      // Set a current meal plan first
      store.dispatch(setCurrentMealPlan(mockMealPlan));
      expect(store.getState().mealPlan.currentMealPlan).toEqual(mockMealPlan);

      // Clear the current meal plan
      store.dispatch(clearCurrentMealPlan());
      expect(store.getState().mealPlan.currentMealPlan).toBeNull();
    });

    it('should set current meal plan', () => {
      store.dispatch(setCurrentMealPlan(mockMealPlan));
      expect(store.getState().mealPlan.currentMealPlan).toEqual(mockMealPlan);
    });
  });

  describe('fetchMealPlans', () => {
    it('should handle fetchMealPlans.pending', () => {
      store.dispatch({ type: fetchMealPlans.pending.type });
      const state = store.getState().mealPlan;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fetchMealPlans.fulfilled', () => {
      const mealPlans = [mockMealPlan];
      store.dispatch({
        type: fetchMealPlans.fulfilled.type,
        payload: mealPlans,
      });
      const state = store.getState().mealPlan;
      expect(state.loading).toBe(false);
      expect(state.mealPlans).toEqual(mealPlans);
      expect(state.lastUpdated).toBeTruthy();
    });

    it('should handle fetchMealPlans.rejected', () => {
      const errorMessage = 'Failed to fetch meal plans';
      store.dispatch({
        type: fetchMealPlans.rejected.type,
        payload: errorMessage,
      });
      const state = store.getState().mealPlan;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('fetchMealPlanById', () => {
    it('should handle fetchMealPlanById.fulfilled', () => {
      store.dispatch({
        type: fetchMealPlanById.fulfilled.type,
        payload: mockMealPlan,
      });
      const state = store.getState().mealPlan;
      expect(state.loading).toBe(false);
      expect(state.currentMealPlan).toEqual(mockMealPlan);
    });
  });

  describe('createMealPlan', () => {
    it('should handle createMealPlan.fulfilled', () => {
      store.dispatch({
        type: createMealPlan.fulfilled.type,
        payload: mockMealPlan,
      });
      const state = store.getState().mealPlan;
      expect(state.loading).toBe(false);
      expect(state.mealPlans).toContain(mockMealPlan);
      expect(state.currentMealPlan).toEqual(mockMealPlan);
      expect(state.lastUpdated).toBeTruthy();
    });
  });

  describe('updateMealPlan', () => {
    it('should handle updateMealPlan.fulfilled', () => {
      // First add a meal plan
      store.dispatch({
        type: createMealPlan.fulfilled.type,
        payload: mockMealPlan,
      });

      // Then update it
      const updatedMealPlan = { ...mockMealPlan, name: 'Updated Name' };
      store.dispatch({
        type: updateMealPlan.fulfilled.type,
        payload: updatedMealPlan,
      });

      const state = store.getState().mealPlan;
      expect(state.loading).toBe(false);
      expect(state.mealPlans[0]).toEqual(updatedMealPlan);
      expect(state.currentMealPlan).toEqual(updatedMealPlan);
      expect(state.lastUpdated).toBeTruthy();
    });
  });

  describe('deleteMealPlan', () => {
    it('should handle deleteMealPlan.fulfilled', () => {
      // First add a meal plan
      store.dispatch({
        type: createMealPlan.fulfilled.type,
        payload: mockMealPlan,
      });

      // Then delete it
      store.dispatch({
        type: deleteMealPlan.fulfilled.type,
        payload: mockMealPlan.id,
      });

      const state = store.getState().mealPlan;
      expect(state.loading).toBe(false);
      expect(state.mealPlans).not.toContain(mockMealPlan);
      expect(state.currentMealPlan).toBeNull();
      expect(state.lastUpdated).toBeTruthy();
    });
  });

  describe('async thunks', () => {
    it('should dispatch fetchMealPlans correctly', async () => {
      const mealPlans = [mockMealPlan];
      mockMealPlanOperations.findAll.mockResolvedValue(mealPlans);

      await store.dispatch(fetchMealPlans());

      expect(mockMealPlanOperations.findAll).toHaveBeenCalled();
      expect(store.getState().mealPlan.mealPlans).toEqual(mealPlans);
    });

    it('should dispatch fetchMealPlanById correctly', async () => {
      mockMealPlanOperations.findById.mockResolvedValue(mockMealPlan);

      await store.dispatch(fetchMealPlanById('meal_plan_1'));

      expect(mockMealPlanOperations.findById).toHaveBeenCalledWith(
        'meal_plan_1'
      );
      expect(store.getState().mealPlan.currentMealPlan).toEqual(mockMealPlan);
    });

    it('should dispatch createMealPlan correctly', async () => {
      mockMealPlanOperations.create.mockResolvedValue(mockMealPlan);

      await store.dispatch(createMealPlan(mockCreateInput));

      expect(mockMealPlanOperations.create).toHaveBeenCalledWith(
        mockCreateInput
      );
      expect(store.getState().mealPlan.mealPlans).toContain(mockMealPlan);
    });

    it('should dispatch updateMealPlan correctly', async () => {
      const updatedMealPlan = { ...mockMealPlan, name: 'Updated Name' };
      mockMealPlanOperations.update.mockResolvedValue(updatedMealPlan);

      await store.dispatch(updateMealPlan(mockUpdateInput));

      expect(mockMealPlanOperations.update).toHaveBeenCalledWith(
        mockUpdateInput
      );
    });

    it('should dispatch deleteMealPlan correctly', async () => {
      mockMealPlanOperations.delete.mockResolvedValue(true);

      await store.dispatch(deleteMealPlan('meal_plan_1'));

      expect(mockMealPlanOperations.delete).toHaveBeenCalledWith('meal_plan_1');
    });
  });

  describe('error handling', () => {
    it('should handle database errors in fetchMealPlans', async () => {
      const errorMessage = 'Database connection failed';
      mockMealPlanOperations.findAll.mockRejectedValue(new Error(errorMessage));

      await store.dispatch(fetchMealPlans());

      const state = store.getState().mealPlan;
      expect(state.error).toBe('Failed to fetch meal plans');
      expect(state.loading).toBe(false);
    });

    it('should handle not found error in fetchMealPlanById', async () => {
      mockMealPlanOperations.findById.mockResolvedValue(null);

      await store.dispatch(fetchMealPlanById('nonexistent_id'));

      const state = store.getState().mealPlan;
      expect(state.error).toBe('Meal plan not found');
    });
  });
});
