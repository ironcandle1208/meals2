import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { Recipe, IngredientCategory } from '../../types';

// Base selectors
export const selectRecipeState = (state: RootState) => state.recipe;

export const selectRecipes = (state: RootState) => state.recipe.recipes;

export const selectCurrentRecipe = (state: RootState) =>
  state.recipe.currentRecipe;

export const selectRecipeLoading = (state: RootState) => state.recipe.loading;

export const selectRecipeError = (state: RootState) => state.recipe.error;

export const selectRecipeLastUpdated = (state: RootState) =>
  state.recipe.lastUpdated;

export const selectRecipeCategories = (state: RootState) =>
  state.recipe.categories;

// Memoized selectors
export const selectRecipeById = createSelector(
  [selectRecipes, (state: RootState, id: string) => id],
  (recipes, id) => recipes.find((recipe) => recipe.id === id) || null
);

export const selectRecipesByCategory = createSelector(
  [selectRecipes, (state: RootState, category: string) => category],
  (recipes, category) =>
    recipes.filter((recipe) => recipe.category === category)
);

export const selectRecipesByIngredient = createSelector(
  [selectRecipes, (state: RootState, ingredientName: string) => ingredientName],
  (recipes, ingredientName) => {
    const lowerIngredientName = ingredientName.toLowerCase();
    return recipes.filter((recipe) =>
      recipe.ingredients.some((ingredient) =>
        ingredient.name.toLowerCase().includes(lowerIngredientName)
      )
    );
  }
);

export const selectRecipesByIngredientCategory = createSelector(
  [selectRecipes, (state: RootState, category: IngredientCategory) => category],
  (recipes, category) =>
    recipes.filter((recipe) =>
      recipe.ingredients.some((ingredient) => ingredient.category === category)
    )
);

export const selectRecipesByCookingTime = createSelector(
  [selectRecipes, (state: RootState, maxTime: number) => maxTime],
  (recipes, maxTime) =>
    recipes.filter((recipe) => recipe.cookingTime <= maxTime)
);

export const selectRecipesByServings = createSelector(
  [selectRecipes, (state: RootState, servings: number) => servings],
  (recipes, servings) =>
    recipes.filter((recipe) => recipe.servings === servings)
);

// Search recipes by name or ingredients
export const selectRecipesBySearch = createSelector(
  [selectRecipes, (state: RootState, searchTerm: string) => searchTerm],
  (recipes, searchTerm) => {
    if (!searchTerm.trim()) {
      return recipes;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(lowerSearchTerm) ||
        recipe.ingredients.some((ingredient) =>
          ingredient.name.toLowerCase().includes(lowerSearchTerm)
        ) ||
        recipe.instructions.some((instruction) =>
          instruction.toLowerCase().includes(lowerSearchTerm)
        )
    );
  }
);

// Get recipes sorted by name
export const selectRecipesSortedByName = createSelector(
  [selectRecipes],
  (recipes) => [...recipes].sort((a, b) => a.name.localeCompare(b.name))
);

// Get recipes sorted by cooking time
export const selectRecipesSortedByCookingTime = createSelector(
  [selectRecipes],
  (recipes) => [...recipes].sort((a, b) => a.cookingTime - b.cookingTime)
);

// Get recipes sorted by creation date (newest first)
export const selectRecipesSortedByDate = createSelector(
  [selectRecipes],
  (recipes) =>
    [...recipes].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
);

// Get all unique ingredients from all recipes
export const selectAllIngredients = createSelector(
  [selectRecipes],
  (recipes) => {
    const ingredientMap = new Map<
      string,
      { name: string; category: IngredientCategory; unit: string }
    >();

    recipes.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        const key = ingredient.name.toLowerCase();
        if (!ingredientMap.has(key)) {
          ingredientMap.set(key, {
            name: ingredient.name,
            category: ingredient.category,
            unit: ingredient.unit,
          });
        }
      });
    });

    return Array.from(ingredientMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }
);

// Get ingredients grouped by category
export const selectIngredientsGroupedByCategory = createSelector(
  [selectAllIngredients],
  (ingredients) => {
    const grouped: Record<IngredientCategory, typeof ingredients> = {
      [IngredientCategory.VEGETABLES]: [],
      [IngredientCategory.MEAT]: [],
      [IngredientCategory.DAIRY]: [],
      [IngredientCategory.GRAINS]: [],
      [IngredientCategory.SPICES]: [],
      [IngredientCategory.OTHER]: [],
    };

    ingredients.forEach((ingredient) => {
      grouped[ingredient.category].push(ingredient);
    });

    return grouped;
  }
);

// Get recipe statistics
export const selectRecipeStats = createSelector([selectRecipes], (recipes) => {
  const stats = {
    total: recipes.length,
    byCategory: {} as Record<string, number>,
    averageCookingTime: 0,
    totalIngredients: 0,
    uniqueIngredients: 0,
    averageServings: 0,
  };

  if (recipes.length === 0) {
    return stats;
  }

  const uniqueIngredients = new Set<string>();
  let totalCookingTime = 0;
  let totalServings = 0;
  let totalIngredientCount = 0;

  recipes.forEach((recipe) => {
    // Category stats
    const category = recipe.category || 'Uncategorized';
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

    // Cooking time
    totalCookingTime += recipe.cookingTime;

    // Servings
    totalServings += recipe.servings;

    // Ingredients
    totalIngredientCount += recipe.ingredients.length;
    recipe.ingredients.forEach((ingredient) => {
      uniqueIngredients.add(ingredient.name.toLowerCase());
    });
  });

  stats.averageCookingTime = Math.round(totalCookingTime / recipes.length);
  stats.averageServings =
    Math.round((totalServings / recipes.length) * 10) / 10;
  stats.totalIngredients = totalIngredientCount;
  stats.uniqueIngredients = uniqueIngredients.size;

  return stats;
});

// Get quick recipes (cooking time <= 30 minutes)
export const selectQuickRecipes = createSelector([selectRecipes], (recipes) =>
  recipes.filter((recipe) => recipe.cookingTime <= 30)
);

// Get recipes for large groups (servings >= 6)
export const selectLargeGroupRecipes = createSelector(
  [selectRecipes],
  (recipes) => recipes.filter((recipe) => recipe.servings >= 6)
);

// Get recently added recipes (last 7 days)
export const selectRecentRecipes = createSelector(
  [selectRecipes],
  (recipes) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return recipes.filter(
      (recipe) => new Date(recipe.createdAt) >= sevenDaysAgo
    );
  }
);

// Get recipes that contain specific ingredients
export const selectRecipesWithIngredients = createSelector(
  [
    selectRecipes,
    (state: RootState, ingredientNames: string[]) => ingredientNames,
  ],
  (recipes, ingredientNames) => {
    if (ingredientNames.length === 0) {
      return recipes;
    }

    const lowerIngredientNames = ingredientNames.map((name) =>
      name.toLowerCase()
    );

    return recipes.filter((recipe) =>
      lowerIngredientNames.every((ingredientName) =>
        recipe.ingredients.some((ingredient) =>
          ingredient.name.toLowerCase().includes(ingredientName)
        )
      )
    );
  }
);

// Get recipes by multiple IDs
export const selectRecipesByIds = createSelector(
  [selectRecipes, (state: RootState, ids: string[]) => ids],
  (recipes, ids) => {
    const idSet = new Set(ids);
    return recipes.filter((recipe) => idSet.has(recipe.id));
  }
);

// Check if recipe exists by name (for duplicate checking)
export const selectRecipeExistsByName = createSelector(
  [selectRecipes, (state: RootState, name: string) => name],
  (recipes, name) => {
    const lowerName = name.toLowerCase();
    return recipes.some((recipe) => recipe.name.toLowerCase() === lowerName);
  }
);
