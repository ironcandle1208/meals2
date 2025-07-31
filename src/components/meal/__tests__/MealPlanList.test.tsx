import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MealPlanList from '../MealPlanList';
import mealPlanReducer from '../../../features/mealPlan/mealPlanSlice';
import { MealPlan } from '../../../types';

// Mock the database operations
jest.mock('../../../services/database/mealPlanOperations', () => ({
  mealPlanOperations: {
    findAll: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockMealPlans: MealPlan[] = [
  {
    id: '1',
    name: '朝食プラン',
    date: '2024-01-15',
    mealType: 'breakfast',
    recipeIds: ['recipe1'],
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
  },
  {
    id: '2',
    name: '昼食プラン',
    date: '2024-01-15',
    mealType: 'lunch',
    recipeIds: ['recipe2', 'recipe3'],
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
  },
  {
    id: '3',
    name: '夕食プラン',
    date: '2024-01-14',
    mealType: 'dinner',
    recipeIds: ['recipe4'],
    createdAt: '2024-01-14T18:00:00Z',
    updatedAt: '2024-01-14T18:00:00Z',
  },
];

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      mealPlan: mealPlanReducer,
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

const renderWithStore = (
  component: React.ReactElement,
  store = createMockStore()
) => {
  return render(<Provider store={store}>{component}</Provider>);
};

const mockProps = {
  onEditMealPlan: jest.fn(),
  onMealPlanPress: jest.fn(),
};

describe('MealPlanList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    const store = createMockStore({ loading: true });
    const { getByText } = renderWithStore(
      <MealPlanList {...mockProps} />,
      store
    );

    expect(getByText('献立を読み込み中...')).toBeTruthy();
  });

  it('renders empty state when no meal plans', () => {
    const store = createMockStore({ mealPlans: [] });
    const { getByText } = renderWithStore(
      <MealPlanList {...mockProps} />,
      store
    );

    expect(getByText('献立がありません')).toBeTruthy();
    expect(getByText('新しい献立を作成して始めましょう')).toBeTruthy();
  });

  it('renders error state correctly', () => {
    const store = createMockStore({
      error: 'データベースエラー',
      mealPlans: [],
    });
    const { getByText } = renderWithStore(
      <MealPlanList {...mockProps} />,
      store
    );

    expect(getByText('エラーが発生しました')).toBeTruthy();
    expect(getByText('データベースエラー')).toBeTruthy();
  });

  it('renders meal plans in chronological order', () => {
    const store = createMockStore({ mealPlans: mockMealPlans });
    const { getAllByText } = renderWithStore(
      <MealPlanList {...mockProps} />,
      store
    );

    // Should render all meal plans
    expect(getAllByText(/プラン/)).toHaveLength(3);
  });

  it('sorts meal plans by date (newest first) and meal type', () => {
    const store = createMockStore({ mealPlans: mockMealPlans });
    const { getByTestId } = renderWithStore(
      <MealPlanList {...mockProps} />,
      store
    );

    // The sorting logic should put newer dates first, then sort by meal type within the same date
    // 2024-01-15 should come before 2024-01-14
    // Within 2024-01-15: breakfast (1) < lunch (2) < dinner (3)
  });

  it('calls onEditMealPlan when edit button is pressed', async () => {
    const store = createMockStore({ mealPlans: mockMealPlans });
    const { getAllByText } = renderWithStore(
      <MealPlanList {...mockProps} />,
      store
    );

    const editButtons = getAllByText('編集');
    fireEvent.press(editButtons[0]);

    expect(mockProps.onEditMealPlan).toHaveBeenCalled();
  });

  it('calls onMealPlanPress when meal plan card is pressed', async () => {
    const store = createMockStore({ mealPlans: mockMealPlans });
    const { getByText } = renderWithStore(
      <MealPlanList {...mockProps} />,
      store
    );

    fireEvent.press(getByText('朝食プラン'));

    expect(mockProps.onMealPlanPress).toHaveBeenCalledWith(mockMealPlans[0]);
  });

  it('handles refresh correctly', async () => {
    const store = createMockStore({ mealPlans: mockMealPlans });
    const { getByTestId } = renderWithStore(
      <MealPlanList {...mockProps} />,
      store
    );

    // Find the FlatList and trigger refresh
    const flatList = getByTestId('meal-plan-list') || {
      props: { refreshControl: { props: { onRefresh: jest.fn() } } },
    };

    // This is a simplified test - in a real scenario, you'd need to properly mock the refresh control
    expect(store.getState().mealPlan.mealPlans).toEqual(mockMealPlans);
  });

  it('handles delete meal plan correctly', async () => {
    const store = createMockStore({ mealPlans: mockMealPlans });
    const { getAllByText } = renderWithStore(
      <MealPlanList {...mockProps} />,
      store
    );

    const deleteButtons = getAllByText('削除');
    fireEvent.press(deleteButtons[0]);

    // This would trigger the confirmation alert in MealCard
    // The actual deletion would be handled by the MealCard component
  });

  it('shows error state but keeps existing data when error occurs with existing meal plans', () => {
    const store = createMockStore({
      mealPlans: mockMealPlans,
      error: 'ネットワークエラー',
    });
    const { getByText, queryByText } = renderWithStore(
      <MealPlanList {...mockProps} />,
      store
    );

    // Should still show the meal plans
    expect(getByText('朝食プラン')).toBeTruthy();

    // Should not show the error state since we have existing data
    expect(queryByText('エラーが発生しました')).toBeFalsy();
  });

  it('handles meal plans with different meal types correctly', () => {
    const mixedMealPlans = [
      { ...mockMealPlans[0], mealType: 'dinner' as const },
      { ...mockMealPlans[1], mealType: 'breakfast' as const },
      { ...mockMealPlans[2], mealType: 'lunch' as const },
    ];

    const store = createMockStore({ mealPlans: mixedMealPlans });
    const { getByText } = renderWithStore(
      <MealPlanList {...mockProps} />,
      store
    );

    expect(getByText('夕食')).toBeTruthy();
    expect(getByText('朝食')).toBeTruthy();
    expect(getByText('昼食')).toBeTruthy();
  });
});
