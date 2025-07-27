import {
  MealPlan,
  Recipe,
  Ingredient,
  ShoppingListItem,
  ValidationResult,
  ValidationError,
  IngredientCategory,
  MealType,
  CreateMealPlanInput,
  CreateRecipeInput,
  CreateIngredientInput,
  SearchFilters,
  ShoppingListGenerationOptions,
} from '../types';

// Date validation utility
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// String validation utilities
export const isValidString = (
  value: string,
  minLength = 1,
  maxLength = 255
): boolean => {
  return (
    typeof value === 'string' &&
    value.trim().length >= minLength &&
    value.trim().length <= maxLength
  );
};

export const isValidNumber = (
  value: number,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): boolean => {
  return (
    typeof value === 'number' && !isNaN(value) && value >= min && value <= max
  );
};

// MealPlan validation
export const validateMealPlan = (
  mealPlan: Partial<MealPlan>
): ValidationResult => {
  const errors: string[] = [];

  // Name validation
  if (!mealPlan.name || !isValidString(mealPlan.name)) {
    errors.push('献立名は必須です（1-255文字）');
  }

  // Date validation
  if (!mealPlan.date || !isValidDate(mealPlan.date)) {
    errors.push('有効な日付を入力してください');
  }

  // MealType validation
  const validMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
  if (!mealPlan.mealType || !validMealTypes.includes(mealPlan.mealType)) {
    errors.push('食事タイプは朝食、昼食、夕食のいずれかを選択してください');
  }

  // RecipeIds validation
  if (!mealPlan.recipeIds || !Array.isArray(mealPlan.recipeIds)) {
    errors.push('レシピIDは配列である必要があります');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Recipe validation
export const validateRecipe = (recipe: Partial<Recipe>): ValidationResult => {
  const errors: string[] = [];

  // Name validation
  if (!recipe.name || !isValidString(recipe.name)) {
    errors.push('レシピ名は必須です（1-255文字）');
  }

  // Ingredients validation
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
    errors.push('材料リストは必須です');
  } else if (recipe.ingredients.length === 0) {
    errors.push('少なくとも1つの材料が必要です');
  } else {
    // Validate each ingredient
    recipe.ingredients.forEach((ingredient, index) => {
      const ingredientValidation = validateIngredient(ingredient);
      if (!ingredientValidation.isValid) {
        errors.push(
          `材料${index + 1}: ${ingredientValidation.errors.join(', ')}`
        );
      }
    });
  }

  // Instructions validation
  if (!recipe.instructions || !Array.isArray(recipe.instructions)) {
    errors.push('調理手順は必須です');
  } else if (recipe.instructions.length === 0) {
    errors.push('少なくとも1つの調理手順が必要です');
  } else {
    // Validate each instruction
    recipe.instructions.forEach((instruction, index) => {
      if (!isValidString(instruction)) {
        errors.push(`調理手順${index + 1}は有効な文字列である必要があります`);
      }
    });
  }

  // Cooking time validation
  if (
    recipe.cookingTime !== undefined &&
    !isValidNumber(recipe.cookingTime, 1, 1440)
  ) {
    errors.push('調理時間は1分から1440分（24時間）の間で入力してください');
  }

  // Servings validation
  if (
    recipe.servings !== undefined &&
    !isValidNumber(recipe.servings, 1, 100)
  ) {
    errors.push('人数分は1人から100人の間で入力してください');
  }

  // Category validation (optional)
  if (recipe.category !== undefined && !isValidString(recipe.category)) {
    errors.push('カテゴリは有効な文字列である必要があります');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Ingredient validation
export const validateIngredient = (
  ingredient: Partial<Ingredient>
): ValidationResult => {
  const errors: string[] = [];

  // Name validation
  if (!ingredient.name || !isValidString(ingredient.name)) {
    errors.push('材料名は必須です（1-255文字）');
  }

  // Amount validation
  if (
    ingredient.amount === undefined ||
    !isValidNumber(ingredient.amount, 0.001, 10000)
  ) {
    errors.push('分量は0.001から10000の間で入力してください');
  }

  // Unit validation
  if (!ingredient.unit || !isValidString(ingredient.unit, 1, 50)) {
    errors.push('単位は必須です（1-50文字）');
  }

  // Category validation
  const validCategories = Object.values(IngredientCategory);
  if (!ingredient.category || !validCategories.includes(ingredient.category)) {
    errors.push('有効なカテゴリを選択してください');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ShoppingListItem validation
export const validateShoppingListItem = (
  item: Partial<ShoppingListItem>
): ValidationResult => {
  const errors: string[] = [];

  // Ingredient name validation
  if (!item.ingredientName || !isValidString(item.ingredientName)) {
    errors.push('材料名は必須です（1-255文字）');
  }

  // Total amount validation
  if (
    item.totalAmount === undefined ||
    !isValidNumber(item.totalAmount, 0.001, 10000)
  ) {
    errors.push('合計分量は0.001から10000の間で入力してください');
  }

  // Unit validation
  if (!item.unit || !isValidString(item.unit, 1, 50)) {
    errors.push('単位は必須です（1-50文字）');
  }

  // Category validation
  const validCategories = Object.values(IngredientCategory);
  if (!item.category || !validCategories.includes(item.category)) {
    errors.push('有効なカテゴリを選択してください');
  }

  // IsChecked validation
  if (item.isChecked !== undefined && typeof item.isChecked !== 'boolean') {
    errors.push('チェック状態はboolean値である必要があります');
  }

  // MealPlanIds validation
  if (!item.mealPlanIds || !Array.isArray(item.mealPlanIds)) {
    errors.push('献立IDリストは配列である必要があります');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validation functions for create inputs
export const validateCreateMealPlanInput = (
  input: CreateMealPlanInput
): ValidationResult => {
  return validateMealPlan(input);
};

export const validateCreateRecipeInput = (
  input: CreateRecipeInput
): ValidationResult => {
  return validateRecipe(input);
};

export const validateCreateIngredientInput = (
  input: CreateIngredientInput
): ValidationResult => {
  return validateIngredient(input);
};

// Utility function to throw validation error
export const throwValidationError = (field: string, message: string): never => {
  throw new ValidationError(message, field);
};

// SearchFilters validation
export const validateSearchFilters = (
  filters: Partial<SearchFilters>
): ValidationResult => {
  const errors: string[] = [];

  // Query validation (optional)
  if (filters.query !== undefined && !isValidString(filters.query, 0, 255)) {
    errors.push('検索クエリは255文字以内で入力してください');
  }

  // MealType validation (optional)
  if (filters.mealType !== undefined) {
    const validMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
    if (!validMealTypes.includes(filters.mealType)) {
      errors.push('有効な食事タイプを選択してください');
    }
  }

  // Date range validation (optional)
  if (filters.dateRange !== undefined) {
    if (!filters.dateRange.start || !isValidDate(filters.dateRange.start)) {
      errors.push('有効な開始日を入力してください');
    }
    if (!filters.dateRange.end || !isValidDate(filters.dateRange.end)) {
      errors.push('有効な終了日を入力してください');
    }
    if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      if (startDate > endDate) {
        errors.push('開始日は終了日より前である必要があります');
      }
    }
  }

  // Category validation (optional)
  if (filters.category !== undefined && !isValidString(filters.category)) {
    errors.push('有効なカテゴリを入力してください');
  }

  // Ingredient category validation (optional)
  if (filters.ingredientCategory !== undefined) {
    const validCategories = Object.values(IngredientCategory);
    if (!validCategories.includes(filters.ingredientCategory)) {
      errors.push('有効な材料カテゴリを選択してください');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ShoppingListGenerationOptions validation
export const validateShoppingListGenerationOptions = (
  options: Partial<ShoppingListGenerationOptions>
): ValidationResult => {
  const errors: string[] = [];

  // Start date validation
  if (!options.startDate || !isValidDate(options.startDate)) {
    errors.push('有効な開始日を入力してください');
  }

  // End date validation
  if (!options.endDate || !isValidDate(options.endDate)) {
    errors.push('有効な終了日を入力してください');
  }

  // Date range validation
  if (options.startDate && options.endDate) {
    const startDate = new Date(options.startDate);
    const endDate = new Date(options.endDate);
    if (startDate > endDate) {
      errors.push('開始日は終了日より前である必要があります');
    }
  }

  // Meal types validation (optional)
  if (options.mealTypes !== undefined) {
    if (!Array.isArray(options.mealTypes)) {
      errors.push('食事タイプは配列である必要があります');
    } else {
      const validMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
      const invalidMealTypes = options.mealTypes.filter(
        (mealType) => !validMealTypes.includes(mealType)
      );
      if (invalidMealTypes.length > 0) {
        errors.push(
          `無効な食事タイプが含まれています: ${invalidMealTypes.join(', ')}`
        );
      }
    }
  }

  // Consolidate ingredients validation (optional)
  if (
    options.consolidateIngredients !== undefined &&
    typeof options.consolidateIngredients !== 'boolean'
  ) {
    errors.push('材料統合フラグはboolean値である必要があります');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Utility function to validate and throw if invalid
export const validateAndThrow = (
  data: any,
  validator: (data: any) => ValidationResult,
  entityName: string
): void => {
  const result = validator(data);
  if (!result.isValid) {
    throw new ValidationError(
      `${entityName}のバリデーションに失敗しました: ${result.errors.join(', ')}`,
      entityName
    );
  }
};
