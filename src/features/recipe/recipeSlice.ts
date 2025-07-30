import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Recipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  DatabaseError,
  NotFoundError,
} from '../../types';
import { recipeOperations } from '../../services/database/recipeOperations';

// State interface
interface RecipeState {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  categories: string[];
}

// Initial state
const initialState: RecipeState = {
  recipes: [],
  currentRecipe: null,
  loading: false,
  error: null,
  lastUpdated: null,
  categories: [],
};

// Async thunks
export const fetchRecipes = createAsyncThunk(
  'recipe/fetchRecipes',
  async (_, { rejectWithValue }) => {
    try {
      const recipes = await recipeOperations.findAll();
      return recipes;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch recipes');
    }
  }
);

export const fetchRecipeById = createAsyncThunk(
  'recipe/fetchRecipeById',
  async (id: string, { rejectWithValue }) => {
    try {
      const recipe = await recipeOperations.findById(id);
      if (!recipe) {
        return rejectWithValue('Recipe not found');
      }
      return recipe;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch recipe');
    }
  }
);

export const fetchRecipesByCategory = createAsyncThunk(
  'recipe/fetchRecipesByCategory',
  async (category: string, { rejectWithValue }) => {
    try {
      const recipes = await recipeOperations.findByCategory(category);
      return recipes;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch recipes by category');
    }
  }
);

export const createRecipe = createAsyncThunk(
  'recipe/createRecipe',
  async (input: CreateRecipeInput, { rejectWithValue }) => {
    try {
      const recipe = await recipeOperations.create(input);
      return recipe;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to create recipe');
    }
  }
);

export const updateRecipe = createAsyncThunk(
  'recipe/updateRecipe',
  async (input: UpdateRecipeInput, { rejectWithValue }) => {
    try {
      const recipe = await recipeOperations.update(input);
      return recipe;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return rejectWithValue('Recipe not found');
      }
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update recipe');
    }
  }
);

export const deleteRecipe = createAsyncThunk(
  'recipe/deleteRecipe',
  async (id: string, { rejectWithValue }) => {
    try {
      const success = await recipeOperations.delete(id);
      if (!success) {
        return rejectWithValue('Failed to delete recipe');
      }
      return id;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return rejectWithValue('Recipe not found');
      }
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to delete recipe');
    }
  }
);

// Slice
const recipeSlice = createSlice({
  name: 'recipe',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentRecipe: (state) => {
      state.currentRecipe = null;
    },
    setCurrentRecipe: (state, action: PayloadAction<Recipe>) => {
      state.currentRecipe = action.payload;
    },
    updateCategories: (state) => {
      // Extract unique categories from recipes
      const categories = Array.from(
        new Set(
          state.recipes
            .map((recipe) => recipe.category)
            .filter((category): category is string => Boolean(category))
        )
      ).sort();
      state.categories = categories;
    },
  },
  extraReducers: (builder) => {
    // Fetch recipes
    builder
      .addCase(fetchRecipes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes = action.payload;
        state.lastUpdated = new Date().toISOString();
        // Update categories
        const categories = Array.from(
          new Set(
            action.payload
              .map((recipe) => recipe.category)
              .filter((category): category is string => Boolean(category))
          )
        ).sort();
        state.categories = categories;
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch recipe by ID
    builder
      .addCase(fetchRecipeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipeById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRecipe = action.payload;
      })
      .addCase(fetchRecipeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch recipes by category
    builder
      .addCase(fetchRecipesByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipesByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchRecipesByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create recipe
    builder
      .addCase(createRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRecipe.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes.push(action.payload);
        state.currentRecipe = action.payload;
        state.lastUpdated = new Date().toISOString();
        // Update categories if new category added
        if (
          action.payload.category &&
          !state.categories.includes(action.payload.category)
        ) {
          state.categories.push(action.payload.category);
          state.categories.sort();
        }
      })
      .addCase(createRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update recipe
    builder
      .addCase(updateRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRecipe.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.recipes.findIndex(
          (recipe) => recipe.id === action.payload.id
        );
        if (index !== -1) {
          state.recipes[index] = action.payload;
        }
        if (state.currentRecipe?.id === action.payload.id) {
          state.currentRecipe = action.payload;
        }
        state.lastUpdated = new Date().toISOString();
        // Update categories
        const categories = Array.from(
          new Set(
            state.recipes
              .map((recipe) => recipe.category)
              .filter((category): category is string => Boolean(category))
          )
        ).sort();
        state.categories = categories;
      })
      .addCase(updateRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete recipe
    builder
      .addCase(deleteRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRecipe.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes = state.recipes.filter(
          (recipe) => recipe.id !== action.payload
        );
        if (state.currentRecipe?.id === action.payload) {
          state.currentRecipe = null;
        }
        state.lastUpdated = new Date().toISOString();
        // Update categories
        const categories = Array.from(
          new Set(
            state.recipes
              .map((recipe) => recipe.category)
              .filter((category): category is string => Boolean(category))
          )
        ).sort();
        state.categories = categories;
      })
      .addCase(deleteRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentRecipe,
  setCurrentRecipe,
  updateCategories,
} = recipeSlice.actions;

export default recipeSlice.reducer;
