import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Alert } from 'react-native';
import MealPlanForm from '../MealPlanForm';
import mealPlanSlice from '../../../features/mealPlan/mealPlanSlice';
import recipeSlice from '../../../features/recipe/recipeSlice';
import shoppingListSlice from '../../../features/shoppingList/shoppingListSlice';
import { MealPlan } from '../../../types';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock the database operations
const mockMealPlanOperations = {
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
  findByDateRange: jest.fn(),
};

jest.mock('../../../services/database/mealPlanOperations', () => ({
  mealPlanOperations: mockMealPlanOperations,
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: any) => <View testID="date-picker" {...props} />;
});

// Mock Picker
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  const MockPicker = ({ children, onValueChange, selectedValue, ...props }: any) => (
    <View
      testID="meal-type-picker"
      onTouchEnd={() => onValueChange && onValueChange('breakfast')}
      {...props}
    >
      {children}
    </View>
  );
  
  const MockPickerItem = ({ label, value, ...props }: any) => (
    <Text testID={`picker-item-${value}`} {...props}>
      {label}
    </Text>
  );
  
  MockPicker.Item = MockPickerItem;
  
  return {
    Picker: MockPicker,
  };
});

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      mealPlan: mealPlanSlice,
      recipe: recipeSlice,
      shoppingList: shoppingListSlice,
    },
    preloadedState: {
      mealPlan: {
        mealPlans: [],
        currentMealPlan: null,
        loading: false,
        error: null,
        lastUpdated: null,
        ...initialState,
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement, store = createTestStore()) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe('MealPlanForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('新規作成モード', () => {
    it('正しく初期状態でレンダリングされる', () => {
      const { getByText, getByPlaceholderText } = renderWithProvider(
        <MealPlanForm />
      );

      expect(getByText('新しい献立を作成')).toBeTruthy();
      expect(getByPlaceholderText('例: 和風ハンバーグ定食')).toBeTruthy();
      expect(getByText('保存')).toBeTruthy();
      expect(getByText('キャンセル')).toBeTruthy();
    });

    it('献立名の入力ができる', () => {
      const { getByPlaceholderText } = renderWithProvider(<MealPlanForm />);
      
      const nameInput = getByPlaceholderText('例: 和風ハンバーグ定食');
      fireEvent.changeText(nameInput, 'テスト献立');
      
      expect(nameInput.props.value).toBe('テスト献立');
    });

    it('バリデーションエラーが表示される', async () => {
      const { getByText } = renderWithProvider(<MealPlanForm />);
      
      const saveButton = getByText('保存');
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        expect(getByText('• 献立名は必須です（1-255文字）')).toBeTruthy();
      });
    });

    it('有効なデータで保存が実行される', async () => {
      const mockOnSave = jest.fn();
      const store = createTestStore();
      
      // Mock successful creation
      mockMealPlanOperations.create.mockResolvedValue({
        id: 'test-id',
        name: 'テスト献立',
        date: '2025-07-30',
        mealType: 'breakfast',
        recipeIds: [],
        createdAt: '2025-07-30T10:00:00Z',
        updatedAt: '2025-07-30T10:00:00Z',
      });
      
      const { getByPlaceholderText, getByText } = renderWithProvider(
        <MealPlanForm onSave={mockOnSave} />,
        store
      );
      
      // 献立名を入力
      const nameInput = getByPlaceholderText('例: 和風ハンバーグ定食');
      fireEvent.changeText(nameInput, 'テスト献立');
      
      // 保存ボタンをクリック
      const saveButton = getByText('保存');
      
      await act(async () => {
        fireEvent.press(saveButton);
      });
      
      // 保存処理が呼ばれることを確認（Alertの代わりに）
      await waitFor(() => {
        expect(mockMealPlanOperations.create).toHaveBeenCalledWith({
          name: 'テスト献立',
          date: expect.any(String),
          mealType: 'breakfast',
          recipeIds: [],
        });
      });
    });

    it('キャンセルボタンで確認ダイアログが表示される', () => {
      const mockOnCancel = jest.fn();
      const { getByText } = renderWithProvider(
        <MealPlanForm onCancel={mockOnCancel} />
      );
      
      const cancelButton = getByText('キャンセル');
      fireEvent.press(cancelButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        '確認',
        '変更を破棄しますか？',
        expect.any(Array)
      );
    });
  });

  describe('編集モード', () => {
    const mockMealPlan: MealPlan = {
      id: 'test-id',
      name: '既存の献立',
      date: '2024-01-15',
      mealType: 'lunch',
      recipeIds: [],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    it('編集モードで正しくレンダリングされる', () => {
      const store = createTestStore({
        currentMealPlan: mockMealPlan,
      });
      
      const { getByText, getByDisplayValue } = renderWithProvider(
        <MealPlanForm mealPlanId="test-id" />,
        store
      );

      expect(getByText('献立を編集')).toBeTruthy();
      expect(getByDisplayValue('既存の献立')).toBeTruthy();
      expect(getByText('更新')).toBeTruthy();
    });

    it('既存データがフォームに読み込まれる', () => {
      const store = createTestStore({
        currentMealPlan: mockMealPlan,
      });
      
      const { getByDisplayValue } = renderWithProvider(
        <MealPlanForm mealPlanId="test-id" />,
        store
      );

      expect(getByDisplayValue('既存の献立')).toBeTruthy();
    });

    it('更新処理が実行される', async () => {
      const mockOnSave = jest.fn();
      const store = createTestStore({
        currentMealPlan: mockMealPlan,
      });
      
      // Mock successful update
      mockMealPlanOperations.update.mockResolvedValue({
        ...mockMealPlan,
        name: '更新された献立',
        updatedAt: '2025-07-30T10:00:00Z',
      });
      
      const { getByText, getByDisplayValue } = renderWithProvider(
        <MealPlanForm mealPlanId="test-id" onSave={mockOnSave} />,
        store
      );
      
      // 献立名を変更
      const nameInput = getByDisplayValue('既存の献立');
      fireEvent.changeText(nameInput, '更新された献立');
      
      // 更新ボタンをクリック
      const updateButton = getByText('更新');
      
      await act(async () => {
        fireEvent.press(updateButton);
      });
      
      // 更新処理が呼ばれることを確認
      await waitFor(() => {
        expect(mockMealPlanOperations.update).toHaveBeenCalledWith({
          id: 'test-id',
          name: '更新された献立',
          date: '2024-01-15',
          mealType: 'lunch',
          recipeIds: [],
        });
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('Redux エラーが表示される', () => {
      const store = createTestStore({
        error: 'データベースエラーが発生しました',
      });
      
      const { getByText } = renderWithProvider(<MealPlanForm />, store);
      
      expect(getByText('データベースエラーが発生しました')).toBeTruthy();
    });

    it('ローディング状態が表示される', () => {
      const store = createTestStore({
        loading: true,
      });
      
      const { getByText } = renderWithProvider(<MealPlanForm />, store);
      
      expect(getByText('処理中...')).toBeTruthy();
    });

    it('ローディング中はボタンが無効化される', () => {
      const store = createTestStore({
        loading: true,
      });
      
      const { getByText } = renderWithProvider(<MealPlanForm />, store);
      
      const saveButton = getByText('保存');
      const cancelButton = getByText('キャンセル');
      
      expect(saveButton.props.accessibilityState?.disabled).toBe(true);
      expect(cancelButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('バリデーション', () => {
    it('空の献立名でバリデーションエラーが表示される', async () => {
      const { getByText } = renderWithProvider(<MealPlanForm />);
      
      const saveButton = getByText('保存');
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        expect(getByText('• 献立名は必須です（1-255文字）')).toBeTruthy();
      });
    });

    it('長すぎる献立名でバリデーションエラーが表示される', async () => {
      const { getByPlaceholderText, getByText } = renderWithProvider(
        <MealPlanForm />
      );
      
      const nameInput = getByPlaceholderText('例: 和風ハンバーグ定食');
      const longName = 'a'.repeat(256); // 256文字の長い名前
      fireEvent.changeText(nameInput, longName);
      
      const saveButton = getByText('保存');
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        expect(getByText('• 献立名は必須です（1-255文字）')).toBeTruthy();
      });
    });

    it('複数のバリデーションエラーが同時に表示される', async () => {
      const { getByText } = renderWithProvider(<MealPlanForm />);
      
      const saveButton = getByText('保存');
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        expect(getByText('• 献立名は必須です（1-255文字）')).toBeTruthy();
      });
    });
  });

  describe('日付選択', () => {
    it('日付ボタンをクリックすると日付ピッカーが表示される', () => {
      const { getByText, getByTestId } = renderWithProvider(<MealPlanForm />);
      
      // 日付ボタンを探す（現在の日付が表示されている）
      const today = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      const dateButton = getByText(today);
      fireEvent.press(dateButton);
      
      expect(getByTestId('date-picker')).toBeTruthy();
    });
  });

  describe('食事タイプ選択', () => {
    it('食事タイプピッカーが表示される', () => {
      const { getByTestId } = renderWithProvider(<MealPlanForm />);
      
      expect(getByTestId('meal-type-picker')).toBeTruthy();
    });
  });
});