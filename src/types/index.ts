// 主要データ型定義

export interface MealPlan {
  id: string;
  name: string;
  date: string; // ISO date string
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: string[];
  cookingTime: number; // minutes
  servings: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: IngredientCategory;
}

export interface ShoppingListItem {
  id: string;
  ingredientName: string;
  totalAmount: number;
  unit: string;
  category: IngredientCategory;
  isChecked: boolean;
  mealPlanIds: string[];
}

export enum IngredientCategory {
  VEGETABLES = 'vegetables',
  MEAT = 'meat',
  DAIRY = 'dairy',
  GRAINS = 'grains',
  SPICES = 'spices',
  OTHER = 'other',
}

// エラー型定義
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends Error {
  constructor(
    message: string,
    public operation: string
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends Error {
  constructor(
    message: string,
    public entityType: string,
    public entityId: string
  ) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class DuplicateError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: string
  ) {
    super(message);
    this.name = 'DuplicateError';
  }
}

// バリデーション結果型
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Utility types for partial updates
export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type CreateMealPlanInput = Omit<
  MealPlan,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateMealPlanInput = Partial<
  Omit<MealPlan, 'id' | 'createdAt'>
> & { id: string };

export type CreateRecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRecipeInput = Partial<Omit<Recipe, 'id' | 'createdAt'>> & {
  id: string;
};

export type CreateIngredientInput = Omit<Ingredient, 'id'>;
export type UpdateIngredientInput = Partial<Ingredient> & { id: string };

export type CreateShoppingListItemInput = Omit<ShoppingListItem, 'id'>;
export type UpdateShoppingListItemInput = Partial<ShoppingListItem> & {
  id: string;
};

// Search and filter types
export interface SearchFilters {
  query?: string;
  mealType?: MealType;
  dateRange?: {
    start: string;
    end: string;
  };
  category?: string;
  ingredientCategory?: IngredientCategory;
}

export interface SearchResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
}

// Database operation types
export interface DatabaseOperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

// Shopping list generation types
export interface ShoppingListGenerationOptions {
  startDate: string;
  endDate: string;
  mealTypes?: MealType[];
  consolidateIngredients?: boolean;
}

// ナビゲーション型定義
export type RootStackParamList = {
  Home: undefined;
  MealPlan: undefined;
  Recipe: undefined;
  ShoppingList: undefined;
  Search: undefined;
  MealPlanDetail: { mealPlanId: string };
  RecipeDetail: { recipeId: string };
  MealPlanForm: { mealPlanId?: string };
  RecipeForm: { recipeId?: string };
};

export type TabParamList = {
  MealPlan: undefined;
  Recipe: undefined;
  ShoppingList: undefined;
  Search: undefined;
};
