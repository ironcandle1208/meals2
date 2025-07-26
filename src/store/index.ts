import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Slices will be imported here as they are created
// import mealPlanSlice from '../features/mealPlan/mealPlanSlice';
// import recipeSlice from '../features/recipe/recipeSlice';
// import shoppingListSlice from '../features/shoppingList/shoppingListSlice';

export const store = configureStore({
  reducer: {
    // mealPlan: mealPlanSlice,
    // recipe: recipeSlice,
    // shoppingList: shoppingListSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;