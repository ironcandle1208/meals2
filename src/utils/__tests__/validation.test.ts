import {
  validateMealPlan,
  validateRecipe,
  validateIngredient,
  validateShoppingListItem,
  validateCreateMealPlanInput,
  validateCreateRecipeInput,
  validateCreateIngredientInput,
  validateSearchFilters,
  validateShoppingListGenerationOptions,
  isValidDate,
  isValidString,
  isValidNumber,
  throwValidationError,
  validateAndThrow,
} from '../validation';
import {
  MealPlan,
  Recipe,
  Ingredient,
  ShoppingListItem,
  IngredientCategory,
  ValidationError,
  CreateMealPlanInput,
  CreateRecipeInput,
  CreateIngredientInput,
  SearchFilters,
  ShoppingListGenerationOptions,
} from '../../types';

describe('Validation Utilities', () => {
  describe('isValidDate', () => {
    it('should return true for valid ISO date strings', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2024-12-31T23:59:59.999Z')).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('2024-13-01')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });
  });

  describe('isValidString', () => {
    it('should return true for valid strings within length limits', () => {
      expect(isValidString('test', 1, 10)).toBe(true);
      expect(isValidString('a', 1, 1)).toBe(true);
    });

    it('should return false for strings outside length limits', () => {
      expect(isValidString('', 1, 10)).toBe(false);
      expect(isValidString('too long string', 1, 5)).toBe(false);
      expect(isValidString('   ', 1, 10)).toBe(false); // only whitespace
    });
  });

  describe('isValidNumber', () => {
    it('should return true for valid numbers within range', () => {
      expect(isValidNumber(5, 0, 10)).toBe(true);
      expect(isValidNumber(0, 0, 10)).toBe(true);
      expect(isValidNumber(10, 0, 10)).toBe(true);
    });

    it('should return false for numbers outside range or invalid', () => {
      expect(isValidNumber(-1, 0, 10)).toBe(false);
      expect(isValidNumber(11, 0, 10)).toBe(false);
      expect(isValidNumber(NaN, 0, 10)).toBe(false);
    });
  });
});

describe('MealPlan Validation', () => {
  const validMealPlan: Partial<MealPlan> = {
    name: 'テスト献立',
    date: '2024-01-15',
    mealType: 'dinner',
    recipeIds: ['recipe1', 'recipe2'],
  };

  it('should validate a valid meal plan', () => {
    const result = validateMealPlan(validMealPlan);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject meal plan with missing name', () => {
    const invalidMealPlan = { ...validMealPlan, name: '' };
    const result = validateMealPlan(invalidMealPlan);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('献立名は必須です（1-255文字）');
  });

  it('should reject meal plan with invalid date', () => {
    const invalidMealPlan = { ...validMealPlan, date: 'invalid-date' };
    const result = validateMealPlan(invalidMealPlan);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('有効な日付を入力してください');
  });

  it('should reject meal plan with invalid meal type', () => {
    const invalidMealPlan = { ...validMealPlan, mealType: 'invalid' as any };
    const result = validateMealPlan(invalidMealPlan);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      '食事タイプは朝食、昼食、夕食のいずれかを選択してください'
    );
  });

  it('should reject meal plan with invalid recipe IDs', () => {
    const invalidMealPlan = {
      ...validMealPlan,
      recipeIds: 'not-an-array' as any,
    };
    const result = validateMealPlan(invalidMealPlan);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('レシピIDは配列である必要があります');
  });
});

describe('Recipe Validation', () => {
  const validIngredient: Ingredient = {
    id: 'ing1',
    name: 'トマト',
    amount: 2,
    unit: '個',
    category: IngredientCategory.VEGETABLES,
  };

  const validRecipe: Partial<Recipe> = {
    name: 'テストレシピ',
    ingredients: [validIngredient],
    instructions: ['手順1', '手順2'],
    cookingTime: 30,
    servings: 4,
    category: 'メイン',
  };

  it('should validate a valid recipe', () => {
    const result = validateRecipe(validRecipe);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject recipe with missing name', () => {
    const invalidRecipe = { ...validRecipe, name: '' };
    const result = validateRecipe(invalidRecipe);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('レシピ名は必須です（1-255文字）');
  });

  it('should reject recipe with empty ingredients', () => {
    const invalidRecipe = { ...validRecipe, ingredients: [] };
    const result = validateRecipe(invalidRecipe);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('少なくとも1つの材料が必要です');
  });

  it('should reject recipe with empty instructions', () => {
    const invalidRecipe = { ...validRecipe, instructions: [] };
    const result = validateRecipe(invalidRecipe);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('少なくとも1つの調理手順が必要です');
  });

  it('should reject recipe with invalid cooking time', () => {
    const invalidRecipe = { ...validRecipe, cookingTime: -1 };
    const result = validateRecipe(invalidRecipe);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      '調理時間は1分から1440分（24時間）の間で入力してください'
    );
  });

  it('should reject recipe with invalid servings', () => {
    const invalidRecipe = { ...validRecipe, servings: 0 };
    const result = validateRecipe(invalidRecipe);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      '人数分は1人から100人の間で入力してください'
    );
  });
});

describe('Ingredient Validation', () => {
  const validIngredient: Partial<Ingredient> = {
    name: 'トマト',
    amount: 2,
    unit: '個',
    category: IngredientCategory.VEGETABLES,
  };

  it('should validate a valid ingredient', () => {
    const result = validateIngredient(validIngredient);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject ingredient with missing name', () => {
    const invalidIngredient = { ...validIngredient, name: '' };
    const result = validateIngredient(invalidIngredient);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('材料名は必須です（1-255文字）');
  });

  it('should reject ingredient with invalid amount', () => {
    const invalidIngredient = { ...validIngredient, amount: 0 };
    const result = validateIngredient(invalidIngredient);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      '分量は0.001から10000の間で入力してください'
    );
  });

  it('should reject ingredient with missing unit', () => {
    const invalidIngredient = { ...validIngredient, unit: '' };
    const result = validateIngredient(invalidIngredient);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('単位は必須です（1-50文字）');
  });

  it('should reject ingredient with invalid category', () => {
    const invalidIngredient = {
      ...validIngredient,
      category: 'invalid' as any,
    };
    const result = validateIngredient(invalidIngredient);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('有効なカテゴリを選択してください');
  });
});

describe('ShoppingListItem Validation', () => {
  const validShoppingListItem: Partial<ShoppingListItem> = {
    ingredientName: 'トマト',
    totalAmount: 4,
    unit: '個',
    category: IngredientCategory.VEGETABLES,
    isChecked: false,
    mealPlanIds: ['meal1', 'meal2'],
  };

  it('should validate a valid shopping list item', () => {
    const result = validateShoppingListItem(validShoppingListItem);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject shopping list item with missing ingredient name', () => {
    const invalidItem = { ...validShoppingListItem, ingredientName: '' };
    const result = validateShoppingListItem(invalidItem);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('材料名は必須です（1-255文字）');
  });

  it('should reject shopping list item with invalid total amount', () => {
    const invalidItem = { ...validShoppingListItem, totalAmount: 0 };
    const result = validateShoppingListItem(invalidItem);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      '合計分量は0.001から10000の間で入力してください'
    );
  });

  it('should reject shopping list item with invalid checked state', () => {
    const invalidItem = {
      ...validShoppingListItem,
      isChecked: 'not-boolean' as any,
    };
    const result = validateShoppingListItem(invalidItem);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'チェック状態はboolean値である必要があります'
    );
  });

  it('should reject shopping list item with invalid meal plan IDs', () => {
    const invalidItem = {
      ...validShoppingListItem,
      mealPlanIds: 'not-array' as any,
    };
    const result = validateShoppingListItem(invalidItem);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('献立IDリストは配列である必要があります');
  });
});

describe('Create Input Validation', () => {
  it('should validate create meal plan input', () => {
    const input: CreateMealPlanInput = {
      name: 'テスト献立',
      date: '2024-01-15',
      mealType: 'dinner',
      recipeIds: ['recipe1'],
    };
    const result = validateCreateMealPlanInput(input);
    expect(result.isValid).toBe(true);
  });

  it('should validate create recipe input', () => {
    const input: CreateRecipeInput = {
      name: 'テストレシピ',
      ingredients: [
        {
          id: 'ing1',
          name: 'トマト',
          amount: 2,
          unit: '個',
          category: IngredientCategory.VEGETABLES,
        },
      ],
      instructions: ['手順1'],
      cookingTime: 30,
      servings: 4,
    };
    const result = validateCreateRecipeInput(input);
    expect(result.isValid).toBe(true);
  });

  it('should validate create ingredient input', () => {
    const input: CreateIngredientInput = {
      name: 'トマト',
      amount: 2,
      unit: '個',
      category: IngredientCategory.VEGETABLES,
    };
    const result = validateCreateIngredientInput(input);
    expect(result.isValid).toBe(true);
  });
});

describe('SearchFilters Validation', () => {
  it('should validate valid search filters', () => {
    const filters: Partial<SearchFilters> = {
      query: 'トマト',
      mealType: 'dinner',
      dateRange: {
        start: '2024-01-01',
        end: '2024-01-31',
      },
      category: 'メイン',
      ingredientCategory: IngredientCategory.VEGETABLES,
    };
    const result = validateSearchFilters(filters);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject search filters with invalid date range', () => {
    const filters: Partial<SearchFilters> = {
      dateRange: {
        start: '2024-01-31',
        end: '2024-01-01',
      },
    };
    const result = validateSearchFilters(filters);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('開始日は終了日より前である必要があります');
  });

  it('should reject search filters with invalid meal type', () => {
    const filters: Partial<SearchFilters> = {
      mealType: 'invalid' as any,
    };
    const result = validateSearchFilters(filters);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('有効な食事タイプを選択してください');
  });
});

describe('ShoppingListGenerationOptions Validation', () => {
  it('should validate valid shopping list generation options', () => {
    const options: Partial<ShoppingListGenerationOptions> = {
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      mealTypes: ['breakfast', 'dinner'],
      consolidateIngredients: true,
    };
    const result = validateShoppingListGenerationOptions(options);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject options with missing start date', () => {
    const options: Partial<ShoppingListGenerationOptions> = {
      endDate: '2024-01-07',
    };
    const result = validateShoppingListGenerationOptions(options);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('有効な開始日を入力してください');
  });

  it('should reject options with invalid date range', () => {
    const options: Partial<ShoppingListGenerationOptions> = {
      startDate: '2024-01-07',
      endDate: '2024-01-01',
    };
    const result = validateShoppingListGenerationOptions(options);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('開始日は終了日より前である必要があります');
  });

  it('should reject options with invalid meal types', () => {
    const options: Partial<ShoppingListGenerationOptions> = {
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      mealTypes: ['invalid'] as any,
    };
    const result = validateShoppingListGenerationOptions(options);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      '無効な食事タイプが含まれています: invalid'
    );
  });
});

describe('Error Utilities', () => {
  it('should throw validation error', () => {
    expect(() => {
      throwValidationError('testField', 'Test error message');
    }).toThrow(ValidationError);
  });

  it('should validate and throw if invalid', () => {
    const invalidData = { name: '' };
    const validator = (data: any) => ({
      isValid: false,
      errors: ['Name is required'],
    });

    expect(() => {
      validateAndThrow(invalidData, validator, 'TestEntity');
    }).toThrow(ValidationError);
  });

  it('should not throw if validation passes', () => {
    const validData = { name: 'Valid Name' };
    const validator = (data: any) => ({ isValid: true, errors: [] });

    expect(() => {
      validateAndThrow(validData, validator, 'TestEntity');
    }).not.toThrow();
  });
});
