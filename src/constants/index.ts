// アプリケーション定数

export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
} as const;

export const MEAL_TYPES = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
} as const;

export const INGREDIENT_CATEGORIES = {
  vegetables: '野菜',
  meat: '肉類',
  dairy: '乳製品',
  grains: '穀物',
  spices: '調味料',
  other: 'その他',
} as const;

export const DATABASE_NAME = 'meals.db';
export const DATABASE_VERSION = 1;
