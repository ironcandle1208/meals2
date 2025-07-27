// ユーティリティ関数

import { ValidationResult, MealPlan } from '../types';

// 日付フォーマット関数
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// 日付バリデーション
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// 献立バリデーション
export const validateMealPlan = (
  mealPlan: Partial<MealPlan>
): ValidationResult => {
  const errors: string[] = [];

  if (!mealPlan.name || mealPlan.name.trim().length === 0) {
    errors.push('献立名は必須です');
  }

  if (!mealPlan.date || !isValidDate(mealPlan.date)) {
    errors.push('有効な日付を入力してください');
  }

  if (!mealPlan.mealType) {
    errors.push('食事タイプを選択してください');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// UUID生成（簡易版）
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 現在の日時をISO文字列で取得
export const getCurrentISOString = (): string => {
  return new Date().toISOString();
};

// エラーハンドリング用のヘルパー関数
export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    console.error('Async operation failed:', error);
    return null;
  }
};
