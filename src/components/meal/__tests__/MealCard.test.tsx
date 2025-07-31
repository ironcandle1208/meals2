import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MealCard from '../MealCard';
import { MealPlan } from '../../../types';

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockMealPlan: MealPlan = {
  id: '1',
  name: 'テスト献立',
  date: '2024-01-15',
  mealType: 'breakfast',
  recipeIds: ['recipe1', 'recipe2'],
  createdAt: '2024-01-15T09:00:00Z',
  updatedAt: '2024-01-15T09:00:00Z',
};

const mockProps = {
  mealPlan: mockMealPlan,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onPress: jest.fn(),
};

describe('MealCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders meal plan information correctly', () => {
    const { getByText } = render(<MealCard {...mockProps} />);

    expect(getByText('テスト献立')).toBeTruthy();
    expect(getByText('朝食')).toBeTruthy();
    expect(getByText('2品のレシピ')).toBeTruthy();
  });

  it('formats date correctly', () => {
    const { getByText } = render(<MealCard {...mockProps} />);

    // The date should be formatted as Japanese locale
    expect(getByText(/1月15日/)).toBeTruthy();
  });

  it('displays correct meal type icon and text', () => {
    const { getByText } = render(<MealCard {...mockProps} />);

    expect(getByText('朝食')).toBeTruthy();
  });

  it('displays correct recipe count', () => {
    const { getByText } = render(<MealCard {...mockProps} />);

    expect(getByText('2品のレシピ')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByText } = render(<MealCard {...mockProps} />);

    fireEvent.press(getByText('テスト献立'));

    expect(mockProps.onPress).toHaveBeenCalledWith(mockMealPlan);
  });

  it('calls onEdit when edit button is pressed', () => {
    const { getByText } = render(<MealCard {...mockProps} />);

    fireEvent.press(getByText('編集'));

    expect(mockProps.onEdit).toHaveBeenCalledWith(mockMealPlan);
  });

  it('shows confirmation alert when delete button is pressed', () => {
    const { getByText } = render(<MealCard {...mockProps} />);

    fireEvent.press(getByText('削除'));

    expect(Alert.alert).toHaveBeenCalledWith(
      '削除確認',
      '「テスト献立」を削除しますか？',
      expect.arrayContaining([
        expect.objectContaining({ text: 'キャンセル' }),
        expect.objectContaining({ text: '削除' }),
      ])
    );
  });

  it('calls onDelete when delete is confirmed', () => {
    const { getByText } = render(<MealCard {...mockProps} />);

    fireEvent.press(getByText('削除'));

    // Get the alert call and simulate pressing the delete button
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteButton = alertCall[2][1]; // Second button (delete)
    deleteButton.onPress();

    expect(mockProps.onDelete).toHaveBeenCalledWith(mockMealPlan);
  });

  it('renders different meal types correctly', () => {
    const lunchMealPlan = { ...mockMealPlan, mealType: 'lunch' as const };
    const { getByText, rerender } = render(
      <MealCard {...mockProps} mealPlan={lunchMealPlan} />
    );

    expect(getByText('昼食')).toBeTruthy();

    const dinnerMealPlan = { ...mockMealPlan, mealType: 'dinner' as const };
    rerender(<MealCard {...mockProps} mealPlan={dinnerMealPlan} />);

    expect(getByText('夕食')).toBeTruthy();
  });

  it('handles single recipe correctly', () => {
    const singleRecipeMealPlan = {
      ...mockMealPlan,
      recipeIds: ['recipe1'],
    };

    const { getByText } = render(
      <MealCard {...mockProps} mealPlan={singleRecipeMealPlan} />
    );

    expect(getByText('1品のレシピ')).toBeTruthy();
  });

  it('handles no recipes correctly', () => {
    const noRecipeMealPlan = {
      ...mockMealPlan,
      recipeIds: [],
    };

    const { getByText } = render(
      <MealCard {...mockProps} mealPlan={noRecipeMealPlan} />
    );

    expect(getByText('0品のレシピ')).toBeTruthy();
  });

  it('works without onPress prop', () => {
    const propsWithoutOnPress = {
      ...mockProps,
      onPress: undefined,
    };

    const { getByText } = render(<MealCard {...propsWithoutOnPress} />);

    // Should not crash when pressed
    fireEvent.press(getByText('テスト献立'));

    expect(mockProps.onPress).not.toHaveBeenCalled();
  });
});
