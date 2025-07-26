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
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// バリデーション結果型
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
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