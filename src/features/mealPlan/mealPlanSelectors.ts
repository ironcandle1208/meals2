import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { MealPlan, MealType } from '../../types';

// Base selectors
export const selectMealPlanState = (state: RootState) => state.mealPlan;

export const selectMealPlans = (state: RootState) => state.mealPlan.mealPlans;

export const selectCurrentMealPlan = (state: RootState) =>
  state.mealPlan.currentMealPlan;

export const selectMealPlanLoading = (state: RootState) =>
  state.mealPlan.loading;

export const selectMealPlanError = (state: RootState) => state.mealPlan.error;

export const selectMealPlanLastUpdated = (state: RootState) =>
  state.mealPlan.lastUpdated;

// Memoized selectors
export const selectMealPlanById = createSelector(
  [selectMealPlans, (state: RootState, id: string) => id],
  (mealPlans, id) => mealPlans.find((mealPlan) => mealPlan.id === id) || null
);

export const selectMealPlansByDate = createSelector(
  [selectMealPlans, (state: RootState, date: string) => date],
  (mealPlans, date) => mealPlans.filter((mealPlan) => mealPlan.date === date)
);

export const selectMealPlansByDateRange = createSelector(
  [
    selectMealPlans,
    (state: RootState, startDate: string, endDate: string) => ({
      startDate,
      endDate,
    }),
  ],
  (mealPlans, { startDate, endDate }) =>
    mealPlans.filter(
      (mealPlan) => mealPlan.date >= startDate && mealPlan.date <= endDate
    )
);

export const selectMealPlansByMealType = createSelector(
  [selectMealPlans, (state: RootState, mealType: MealType) => mealType],
  (mealPlans, mealType) =>
    mealPlans.filter((mealPlan) => mealPlan.mealType === mealType)
);

export const selectMealPlansByDateAndMealType = createSelector(
  [
    selectMealPlans,
    (state: RootState, date: string, mealType: MealType) => ({
      date,
      mealType,
    }),
  ],
  (mealPlans, { date, mealType }) =>
    mealPlans.filter(
      (mealPlan) => mealPlan.date === date && mealPlan.mealType === mealType
    )
);

// Get unique dates from meal plans
export const selectMealPlanDates = createSelector(
  [selectMealPlans],
  (mealPlans) =>
    Array.from(new Set(mealPlans.map((mealPlan) => mealPlan.date))).sort()
);

// Get meal plans grouped by date
export const selectMealPlansGroupedByDate = createSelector(
  [selectMealPlans],
  (mealPlans) => {
    const grouped: Record<string, MealPlan[]> = {};
    mealPlans.forEach((mealPlan) => {
      if (!grouped[mealPlan.date]) {
        grouped[mealPlan.date] = [];
      }
      grouped[mealPlan.date].push(mealPlan);
    });

    // Sort meal plans within each date by meal type
    const mealTypeOrder: Record<MealType, number> = {
      breakfast: 1,
      lunch: 2,
      dinner: 3,
    };

    Object.keys(grouped).forEach((date) => {
      grouped[date].sort(
        (a, b) => mealTypeOrder[a.mealType] - mealTypeOrder[b.mealType]
      );
    });

    return grouped;
  }
);

// Get meal plans for current week
export const selectCurrentWeekMealPlans = createSelector(
  [selectMealPlans],
  (mealPlans) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    const startDateStr = startOfWeek.toISOString().split('T')[0];
    const endDateStr = endOfWeek.toISOString().split('T')[0];

    return mealPlans.filter(
      (mealPlan) => mealPlan.date >= startDateStr && mealPlan.date <= endDateStr
    );
  }
);

// Get meal plans for today
export const selectTodayMealPlans = createSelector(
  [selectMealPlans],
  (mealPlans) => {
    const today = new Date().toISOString().split('T')[0];
    return mealPlans.filter((mealPlan) => mealPlan.date === today);
  }
);

// Get upcoming meal plans (next 7 days)
export const selectUpcomingMealPlans = createSelector(
  [selectMealPlans],
  (mealPlans) => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    return mealPlans.filter(
      (mealPlan) => mealPlan.date >= todayStr && mealPlan.date <= nextWeekStr
    );
  }
);

// Get all recipe IDs used in meal plans
export const selectUsedRecipeIds = createSelector(
  [selectMealPlans],
  (mealPlans) =>
    Array.from(new Set(mealPlans.flatMap((mealPlan) => mealPlan.recipeIds)))
);

// Check if a specific date and meal type combination exists
export const selectMealPlanExists = createSelector(
  [
    selectMealPlans,
    (state: RootState, date: string, mealType: MealType) => ({
      date,
      mealType,
    }),
  ],
  (mealPlans, { date, mealType }) =>
    mealPlans.some(
      (mealPlan) => mealPlan.date === date && mealPlan.mealType === mealType
    )
);

// Get meal plan statistics
export const selectMealPlanStats = createSelector(
  [selectMealPlans],
  (mealPlans) => {
    const stats = {
      total: mealPlans.length,
      byMealType: {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
      },
      uniqueDates: 0,
      totalRecipes: 0,
    };

    const uniqueDates = new Set<string>();
    const uniqueRecipes = new Set<string>();

    mealPlans.forEach((mealPlan) => {
      stats.byMealType[mealPlan.mealType]++;
      uniqueDates.add(mealPlan.date);
      mealPlan.recipeIds.forEach((recipeId) => uniqueRecipes.add(recipeId));
    });

    stats.uniqueDates = uniqueDates.size;
    stats.totalRecipes = uniqueRecipes.size;

    return stats;
  }
);

// Search meal plans by name
export const selectMealPlansBySearch = createSelector(
  [selectMealPlans, (state: RootState, searchTerm: string) => searchTerm],
  (mealPlans, searchTerm) => {
    if (!searchTerm.trim()) {
      return mealPlans;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return mealPlans.filter((mealPlan) =>
      mealPlan.name.toLowerCase().includes(lowerSearchTerm)
    );
  }
);
