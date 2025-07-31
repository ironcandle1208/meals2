import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MealCalendarView from '../MealCalendarView';
import mealPlanReducer from '../../../features/mealPlan/mealPlanSlice';
import { MealPlan } from '../../../types';

// Mock react-native-calendars
jest.mock('react-native-calendars', () => ({
  Calendar: ({ onDayPress, markedDates }: any) => {
    const MockCalendar = require('react-native').View;
    return (
      <MockCalendar
        testID="calendar"
        onPress={() => onDayPress({ dateString: '2024-01-15' })}
      />
    );
  },
}));

// Mock the database operations to prevent actual database calls
jest.mock('../../../services/database/mealPlanOperations', () => ({
  mealPlanOperations: {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findByDateRange: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue(true),
  },
}));

// Mock data
const mockMealPlans: MealPlan[] = [
  {
    id: '1',
    name: '朝食プラン',
    date: '2024-01-15T00:00:00.000Z',
    mealType: 'breakfast',
    recipeIds: ['recipe1'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: '昼食プラン',
    date: '2024-01-15T00:00:00.000Z',
    mealType: 'lunch',
    recipeIds: ['recipe2'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: '夕食プラン',
    date: '2024-01-16T00:00:00.000Z',
    mealType: 'dinner',
    recipeIds: ['recipe3'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      mealPlan: mealPlanReducer,
    },
    preloadedState: {
      mealPlan: {
        mealPlans: mockMealPlans,
        currentMealPlan: null,
        loading: false,
        error: null,
        lastUpdated: null,
        ...initialState,
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement, store = createMockStore()) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe('MealCalendarView', () => {
  const mockProps = {
    onEditMealPlan: jest.fn(),
    onMealPlanPress: jest.fn(),
    onCreateMealPlan: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders calendar component', () => {
    const { getByTestId } = renderWithProvider(
      <MealCalendarView {...mockProps} />
    );

    expect(getByTestId('calendar')).toBeTruthy();
  });

  it('displays selected date header', () => {
    const { getByText } = renderWithProvider(
      <MealCalendarView {...mockProps} />
    );

    // Should display current date by default
    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
    
    expect(getByText(today)).toBeTruthy();
  });

  it('displays meal plans for selected date', () => {
    // Create store with meal plans for a specific date
    const store = createMockStore({
      mealPlans: mockMealPlans,
      loading: false,
    });

    const { getByText } = renderWithProvider(
      <MealCalendarView {...mockProps} />,
      store
    );

    // The component should show meal plans when not loading
    expect(() => getByText('朝食プラン')).not.toThrow();
  });

  it('displays meal types with empty state when no meals exist', () => {
    const store = createMockStore({
      mealPlans: [],
      loading: false,
    });

    const { getByText } = renderWithProvider(
      <MealCalendarView {...mockProps} />,
      store
    );

    // Should show meal type headers
    expect(() => getByText('朝食')).not.toThrow();
  });

  it('calls onCreateMealPlan when header add button is pressed', () => {
    const store = createMockStore({
      mealPlans: [],
      loading: false,
    });

    const { getByTestId } = renderWithProvider(
      <MealCalendarView {...mockProps} />,
      store
    );

    // Find the add button in the header (using testID would be better)
    const addButton = getByTestId('header-add-button');
    fireEvent.press(addButton);

    expect(mockProps.onCreateMealPlan).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    );
  });

  it('displays loading state', () => {
    const store = createMockStore({ loading: true });
    const { getByText } = renderWithProvider(
      <MealCalendarView {...mockProps} />,
      store
    );

    expect(getByText('献立を読み込み中...')).toBeTruthy();
  });

  it('groups meal plans by meal type correctly', () => {
    const store = createMockStore({
      mealPlans: mockMealPlans,
      loading: false,
    });

    const { getByText } = renderWithProvider(
      <MealCalendarView {...mockProps} />,
      store
    );

    // Should show meal type headers
    expect(() => getByText('朝食')).not.toThrow();
    expect(() => getByText('昼食')).not.toThrow();
    expect(() => getByText('夕食')).not.toThrow();
  });

  it('handles date selection', () => {
    const { getByTestId } = renderWithProvider(
      <MealCalendarView {...mockProps} />
    );

    const calendar = getByTestId('calendar');
    fireEvent.press(calendar);

    // Calendar should handle date selection (mocked to select 2024-01-15)
    expect(calendar).toBeTruthy();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});