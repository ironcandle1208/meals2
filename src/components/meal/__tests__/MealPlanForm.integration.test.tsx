import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MealPlanForm from '../MealPlanForm';
import mealPlanSlice from '../../../features/mealPlan/mealPlanSlice';
import recipeSlice from '../../../features/recipe/recipeSlice';
import shoppingListSlice from '../../../features/shoppingList/shoppingListSlice';

// Mock the external dependencies
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: any) => <View testID="date-picker" {...props} />;
});

jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  const MockPicker = ({
    children,
    onValueChange,
    selectedValue,
    ...props
  }: any) => (
    <View testID="meal-type-picker" {...props}>
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

jest.mock('../../../services/database/mealPlanOperations', () => ({
  mealPlanOperations: {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    findByDateRange: jest.fn(),
  },
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      mealPlan: mealPlanSlice,
      recipe: recipeSlice,
      shoppingList: shoppingListSlice,
    },
  });
};

describe('MealPlanForm Integration', () => {
  it('コンポーネントがエラーなしでレンダリングされる', () => {
    const store = createTestStore();

    const { getByText } = render(
      <Provider store={store}>
        <MealPlanForm />
      </Provider>
    );

    // 基本的な要素が表示されることを確認
    expect(getByText('新しい献立を作成')).toBeTruthy();
    expect(getByText('献立名 *')).toBeTruthy();
    expect(getByText('日付 *')).toBeTruthy();
    expect(getByText('食事タイプ *')).toBeTruthy();
    expect(getByText('保存')).toBeTruthy();
    expect(getByText('キャンセル')).toBeTruthy();
  });

  it('編集モードでコンポーネントがレンダリングされる', () => {
    const store = createTestStore();

    const { getByText } = render(
      <Provider store={store}>
        <MealPlanForm mealPlanId="test-id" />
      </Provider>
    );

    // 編集モードの要素が表示されることを確認
    expect(getByText('献立を編集')).toBeTruthy();
    expect(getByText('更新')).toBeTruthy();
  });
});
