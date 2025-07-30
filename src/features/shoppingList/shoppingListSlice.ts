import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  ShoppingListItem,
  CreateShoppingListItemInput,
  UpdateShoppingListItemInput,
  DatabaseError,
  NotFoundError,
  IngredientCategory,
} from '../../types';
import { shoppingListOperations } from '../../services/database/shoppingListOperations';

// State interface
interface ShoppingListState {
  items: ShoppingListItem[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  generationInProgress: boolean;
}

// Initial state
const initialState: ShoppingListState = {
  items: [],
  loading: false,
  error: null,
  lastUpdated: null,
  generationInProgress: false,
};

// Async thunks
export const fetchShoppingListItems = createAsyncThunk(
  'shoppingList/fetchShoppingListItems',
  async (_, { rejectWithValue }) => {
    try {
      const items = await shoppingListOperations.findAll();
      return items;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch shopping list items');
    }
  }
);

export const fetchShoppingListItemById = createAsyncThunk(
  'shoppingList/fetchShoppingListItemById',
  async (id: string, { rejectWithValue }) => {
    try {
      const item = await shoppingListOperations.findById(id);
      if (!item) {
        return rejectWithValue('Shopping list item not found');
      }
      return item;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch shopping list item');
    }
  }
);

export const fetchShoppingListItemsByCategory = createAsyncThunk(
  'shoppingList/fetchShoppingListItemsByCategory',
  async (category: IngredientCategory, { rejectWithValue }) => {
    try {
      const items = await shoppingListOperations.findByCategory(category);
      return items;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch shopping list items by category');
    }
  }
);

export const fetchUncheckedItems = createAsyncThunk(
  'shoppingList/fetchUncheckedItems',
  async (_, { rejectWithValue }) => {
    try {
      const items = await shoppingListOperations.findUnchecked();
      return items;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch unchecked items');
    }
  }
);

export const createShoppingListItem = createAsyncThunk(
  'shoppingList/createShoppingListItem',
  async (input: CreateShoppingListItemInput, { rejectWithValue }) => {
    try {
      const item = await shoppingListOperations.create(input);
      return item;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to create shopping list item');
    }
  }
);

export const updateShoppingListItem = createAsyncThunk(
  'shoppingList/updateShoppingListItem',
  async (input: UpdateShoppingListItemInput, { rejectWithValue }) => {
    try {
      const item = await shoppingListOperations.update(input);
      return item;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return rejectWithValue('Shopping list item not found');
      }
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update shopping list item');
    }
  }
);

export const deleteShoppingListItem = createAsyncThunk(
  'shoppingList/deleteShoppingListItem',
  async (id: string, { rejectWithValue }) => {
    try {
      const success = await shoppingListOperations.delete(id);
      if (!success) {
        return rejectWithValue('Failed to delete shopping list item');
      }
      return id;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return rejectWithValue('Shopping list item not found');
      }
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to delete shopping list item');
    }
  }
);

export const toggleItemChecked = createAsyncThunk(
  'shoppingList/toggleItemChecked',
  async (id: string, { rejectWithValue }) => {
    try {
      const item = await shoppingListOperations.toggleChecked(id);
      return item;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return rejectWithValue('Shopping list item not found');
      }
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to toggle item checked status');
    }
  }
);

export const clearCheckedItems = createAsyncThunk(
  'shoppingList/clearCheckedItems',
  async (_, { rejectWithValue }) => {
    try {
      const deletedCount = await shoppingListOperations.clearCheckedItems();
      return deletedCount;
    } catch (error) {
      if (error instanceof DatabaseError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to clear checked items');
    }
  }
);

// Slice
const shoppingListSlice = createSlice({
  name: 'shoppingList',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setGenerationInProgress: (state, action: PayloadAction<boolean>) => {
      state.generationInProgress = action.payload;
    },
    // Local state management for optimistic updates
    optimisticToggleChecked: (state, action: PayloadAction<string>) => {
      const item = state.items.find((item) => item.id === action.payload);
      if (item) {
        item.isChecked = !item.isChecked;
      }
    },
    // Revert optimistic update on failure
    revertOptimisticToggle: (state, action: PayloadAction<string>) => {
      const item = state.items.find((item) => item.id === action.payload);
      if (item) {
        item.isChecked = !item.isChecked;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch shopping list items
    builder
      .addCase(fetchShoppingListItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShoppingListItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchShoppingListItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch shopping list item by ID
    builder
      .addCase(fetchShoppingListItemById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShoppingListItemById.fulfilled, (state, action) => {
        state.loading = false;
        // Update or add the item to the list
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })
      .addCase(fetchShoppingListItemById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch shopping list items by category
    builder
      .addCase(fetchShoppingListItemsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShoppingListItemsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchShoppingListItemsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch unchecked items
    builder
      .addCase(fetchUncheckedItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUncheckedItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchUncheckedItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create shopping list item
    builder
      .addCase(createShoppingListItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createShoppingListItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(createShoppingListItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update shopping list item
    builder
      .addCase(updateShoppingListItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateShoppingListItem.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateShoppingListItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete shopping list item
    builder
      .addCase(deleteShoppingListItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteShoppingListItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(deleteShoppingListItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Toggle item checked
    builder
      .addCase(toggleItemChecked.pending, (state) => {
        // Don't set loading for toggle operations to keep UI responsive
        state.error = null;
      })
      .addCase(toggleItemChecked.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(toggleItemChecked.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Clear checked items
    builder
      .addCase(clearCheckedItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCheckedItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => !item.isChecked);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(clearCheckedItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setGenerationInProgress,
  optimisticToggleChecked,
  revertOptimisticToggle,
} = shoppingListSlice.actions;

export default shoppingListSlice.reducer;
