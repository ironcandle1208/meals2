import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  MealPlan,
  CreateMealPlanInput,
  UpdateMealPlanInput,
  DatabaseError,
  NotFoundError,
} from '../../types';
import { mealPlanOperations } from '../../services/database/mealPlanOperations';

// State interface
interface MealPlanState {
  mealPlans: MealPlan[];
  currentMealPlan: MealPlan | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Initial state
const initialState: MealPlanState = {
  mealPlans: [],
  currentMealPlan: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchMealPlans = createAsyncThunk(
  'mealPlan/fetchMealPlans',
  async (_, { rejectWithValue }) => {
    try {
      const mealPlans = await mealPlanOperations.findAll();
      return mealPlans;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch meal plans');
    }
  }
);

export const fetchMealPlanById = createAsyncThunk(
  'mealPlan/fetchMealPlanById',
  async (id: string, { rejectWithValue }) => {
    try {
      const mealPlan = await mealPlanOperations.findById(id);
      if (!mealPlan) {
        return rejectWithValue('Meal plan not found');
      }
      return mealPlan;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch meal plan');
    }
  }
);

export const fetchMealPlansByDateRange = createAsyncThunk(
  'mealPlan/fetchMealPlansByDateRange',
  async (
    { startDate, endDate }: { startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      const mealPlans = await mealPlanOperations.findByDateRange(
        startDate,
        endDate
      );
      return mealPlans;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch meal plans by date range');
    }
  }
);

export const createMealPlan = createAsyncThunk(
  'mealPlan/createMealPlan',
  async (input: CreateMealPlanInput, { rejectWithValue }) => {
    try {
      const mealPlan = await mealPlanOperations.create(input);
      return mealPlan;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to create meal plan');
    }
  }
);

export const updateMealPlan = createAsyncThunk(
  'mealPlan/updateMealPlan',
  async (input: UpdateMealPlanInput, { rejectWithValue }) => {
    try {
      const mealPlan = await mealPlanOperations.update(input);
      return mealPlan;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return rejectWithValue('Meal plan not found');
      }
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update meal plan');
    }
  }
);

export const deleteMealPlan = createAsyncThunk(
  'mealPlan/deleteMealPlan',
  async (id: string, { rejectWithValue }) => {
    try {
      const success = await mealPlanOperations.delete(id);
      if (!success) {
        return rejectWithValue('Failed to delete meal plan');
      }
      return id;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return rejectWithValue('Meal plan not found');
      }
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to delete meal plan');
    }
  }
);

// Slice
const mealPlanSlice = createSlice({
  name: 'mealPlan',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentMealPlan: (state) => {
      state.currentMealPlan = null;
    },
    setCurrentMealPlan: (state, action: PayloadAction<MealPlan>) => {
      state.currentMealPlan = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch meal plans
    builder
      .addCase(fetchMealPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.mealPlans = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchMealPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch meal plan by ID
    builder
      .addCase(fetchMealPlanById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealPlanById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMealPlan = action.payload;
      })
      .addCase(fetchMealPlanById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch meal plans by date range
    builder
      .addCase(fetchMealPlansByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealPlansByDateRange.fulfilled, (state, action) => {
        state.loading = false;
        state.mealPlans = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchMealPlansByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create meal plan
    builder
      .addCase(createMealPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMealPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.mealPlans.push(action.payload);
        state.currentMealPlan = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(createMealPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update meal plan
    builder
      .addCase(updateMealPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMealPlan.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.mealPlans.findIndex(
          (mp) => mp.id === action.payload.id
        );
        if (index !== -1) {
          state.mealPlans[index] = action.payload;
        }
        if (state.currentMealPlan?.id === action.payload.id) {
          state.currentMealPlan = action.payload;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateMealPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete meal plan
    builder
      .addCase(deleteMealPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMealPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.mealPlans = state.mealPlans.filter(
          (mp) => mp.id !== action.payload
        );
        if (state.currentMealPlan?.id === action.payload) {
          state.currentMealPlan = null;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(deleteMealPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentMealPlan, setCurrentMealPlan } =
  mealPlanSlice.actions;

export default mealPlanSlice.reducer;
