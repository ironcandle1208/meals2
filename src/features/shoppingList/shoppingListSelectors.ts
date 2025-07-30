import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { ShoppingListItem, IngredientCategory } from '../../types';

// Base selectors
export const selectShoppingListState = (state: RootState) => state.shoppingList;

export const selectShoppingListItems = (state: RootState) =>
  state.shoppingList.items;

export const selectShoppingListLoading = (state: RootState) =>
  state.shoppingList.loading;

export const selectShoppingListError = (state: RootState) =>
  state.shoppingList.error;

export const selectShoppingListLastUpdated = (state: RootState) =>
  state.shoppingList.lastUpdated;

export const selectGenerationInProgress = (state: RootState) =>
  state.shoppingList.generationInProgress;

// Memoized selectors
export const selectShoppingListItemById = createSelector(
  [selectShoppingListItems, (state: RootState, id: string) => id],
  (items, id) => items.find((item) => item.id === id) || null
);

export const selectCheckedItems = createSelector(
  [selectShoppingListItems],
  (items) => items.filter((item) => item.isChecked)
);

export const selectUncheckedItems = createSelector(
  [selectShoppingListItems],
  (items) => items.filter((item) => !item.isChecked)
);

export const selectItemsByCategory = createSelector(
  [
    selectShoppingListItems,
    (state: RootState, category: IngredientCategory) => category,
  ],
  (items, category) => items.filter((item) => item.category === category)
);

// Get items grouped by category
export const selectItemsGroupedByCategory = createSelector(
  [selectShoppingListItems],
  (items) => {
    const grouped: Record<IngredientCategory, ShoppingListItem[]> = {
      [IngredientCategory.VEGETABLES]: [],
      [IngredientCategory.MEAT]: [],
      [IngredientCategory.DAIRY]: [],
      [IngredientCategory.GRAINS]: [],
      [IngredientCategory.SPICES]: [],
      [IngredientCategory.OTHER]: [],
    };

    items.forEach((item) => {
      grouped[item.category].push(item);
    });

    // Sort items within each category by name
    Object.keys(grouped).forEach((category) => {
      grouped[category as IngredientCategory].sort((a, b) =>
        a.ingredientName.localeCompare(b.ingredientName)
      );
    });

    return grouped;
  }
);

// Get unchecked items grouped by category
export const selectUncheckedItemsGroupedByCategory = createSelector(
  [selectUncheckedItems],
  (items) => {
    const grouped: Record<IngredientCategory, ShoppingListItem[]> = {
      [IngredientCategory.VEGETABLES]: [],
      [IngredientCategory.MEAT]: [],
      [IngredientCategory.DAIRY]: [],
      [IngredientCategory.GRAINS]: [],
      [IngredientCategory.SPICES]: [],
      [IngredientCategory.OTHER]: [],
    };

    items.forEach((item) => {
      grouped[item.category].push(item);
    });

    // Sort items within each category by name
    Object.keys(grouped).forEach((category) => {
      grouped[category as IngredientCategory].sort((a, b) =>
        a.ingredientName.localeCompare(b.ingredientName)
      );
    });

    return grouped;
  }
);

// Search items by ingredient name
export const selectItemsBySearch = createSelector(
  [
    selectShoppingListItems,
    (state: RootState, searchTerm: string) => searchTerm,
  ],
  (items, searchTerm) => {
    if (!searchTerm.trim()) {
      return items;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter((item) =>
      item.ingredientName.toLowerCase().includes(lowerSearchTerm)
    );
  }
);

// Get shopping list statistics
export const selectShoppingListStats = createSelector(
  [selectShoppingListItems],
  (items) => {
    const stats = {
      total: items.length,
      checked: 0,
      unchecked: 0,
      byCategory: {} as Record<IngredientCategory, number>,
      completionPercentage: 0,
    };

    items.forEach((item) => {
      if (item.isChecked) {
        stats.checked++;
      } else {
        stats.unchecked++;
      }

      stats.byCategory[item.category] =
        (stats.byCategory[item.category] || 0) + 1;
    });

    stats.completionPercentage =
      stats.total > 0 ? Math.round((stats.checked / stats.total) * 100) : 0;

    return stats;
  }
);

// Get items sorted by name
export const selectItemsSortedByName = createSelector(
  [selectShoppingListItems],
  (items) =>
    [...items].sort((a, b) => a.ingredientName.localeCompare(b.ingredientName))
);

// Get items sorted by category then name
export const selectItemsSortedByCategoryAndName = createSelector(
  [selectShoppingListItems],
  (items) =>
    [...items].sort((a, b) => {
      const categoryComparison = a.category.localeCompare(b.category);
      if (categoryComparison !== 0) {
        return categoryComparison;
      }
      return a.ingredientName.localeCompare(b.ingredientName);
    })
);

// Get items by meal plan IDs
export const selectItemsByMealPlanIds = createSelector(
  [
    selectShoppingListItems,
    (state: RootState, mealPlanIds: string[]) => mealPlanIds,
  ],
  (items, mealPlanIds) => {
    const mealPlanIdSet = new Set(mealPlanIds);
    return items.filter((item) =>
      item.mealPlanIds.some((id) => mealPlanIdSet.has(id))
    );
  }
);

// Get items that belong to a specific meal plan
export const selectItemsByMealPlanId = createSelector(
  [
    selectShoppingListItems,
    (state: RootState, mealPlanId: string) => mealPlanId,
  ],
  (items, mealPlanId) =>
    items.filter((item) => item.mealPlanIds.includes(mealPlanId))
);

// Check if shopping list is empty
export const selectIsShoppingListEmpty = createSelector(
  [selectShoppingListItems],
  (items) => items.length === 0
);

// Check if all items are checked
export const selectAreAllItemsChecked = createSelector(
  [selectShoppingListItems],
  (items) => items.length > 0 && items.every((item) => item.isChecked)
);

// Get categories that have items
export const selectCategoriesWithItems = createSelector(
  [selectShoppingListItems],
  (items) => {
    const categories = new Set<IngredientCategory>();
    items.forEach((item) => categories.add(item.category));
    return Array.from(categories).sort();
  }
);

// Get categories that have unchecked items
export const selectCategoriesWithUncheckedItems = createSelector(
  [selectUncheckedItems],
  (items) => {
    const categories = new Set<IngredientCategory>();
    items.forEach((item) => categories.add(item.category));
    return Array.from(categories).sort();
  }
);

// Get total amount for a specific ingredient across all items
export const selectTotalAmountForIngredient = createSelector(
  [
    selectShoppingListItems,
    (state: RootState, ingredientName: string) => ingredientName,
  ],
  (items, ingredientName) => {
    const lowerIngredientName = ingredientName.toLowerCase();
    return items
      .filter(
        (item) => item.ingredientName.toLowerCase() === lowerIngredientName
      )
      .reduce((total, item) => total + item.totalAmount, 0);
  }
);

// Get items that need to be purchased (unchecked) with priority
export const selectPriorityUncheckedItems = createSelector(
  [selectUncheckedItems],
  (items) => {
    // Sort by category priority and then by name
    const categoryPriority: Record<IngredientCategory, number> = {
      [IngredientCategory.VEGETABLES]: 1,
      [IngredientCategory.MEAT]: 2,
      [IngredientCategory.DAIRY]: 3,
      [IngredientCategory.GRAINS]: 4,
      [IngredientCategory.SPICES]: 5,
      [IngredientCategory.OTHER]: 6,
    };

    return [...items].sort((a, b) => {
      const priorityDiff =
        categoryPriority[a.category] - categoryPriority[b.category];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return a.ingredientName.localeCompare(b.ingredientName);
    });
  }
);

// Get shopping list summary for export
export const selectShoppingListSummary = createSelector(
  [selectShoppingListItems, selectShoppingListStats],
  (items, stats) => ({
    items: items.map((item) => ({
      name: item.ingredientName,
      amount: item.totalAmount,
      unit: item.unit,
      category: item.category,
      checked: item.isChecked,
    })),
    stats,
    generatedAt: new Date().toISOString(),
  })
);
