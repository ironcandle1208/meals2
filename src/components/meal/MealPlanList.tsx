import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  fetchMealPlans,
  deleteMealPlan,
} from '../../features/mealPlan/mealPlanSlice';
import {
  selectMealPlans,
  selectMealPlanLoading,
  selectMealPlanError,
} from '../../features/mealPlan/mealPlanSelectors';
import { MealPlan } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import MealCard from './MealCard';

interface MealPlanListProps {
  onEditMealPlan: (mealPlan: MealPlan) => void;
  onMealPlanPress?: (mealPlan: MealPlan) => void;
}

const MealPlanList: React.FC<MealPlanListProps> = ({
  onEditMealPlan,
  onMealPlanPress,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const mealPlans = useSelector(selectMealPlans);
  const loading = useSelector(selectMealPlanLoading);
  const error = useSelector(selectMealPlanError);

  // Sort meal plans by date and meal type in chronological order
  const sortedMealPlans = useMemo(() => {
    const mealTypeOrder = {
      breakfast: 1,
      lunch: 2,
      dinner: 3,
    };

    return [...mealPlans].sort((a, b) => {
      // First sort by date (newest first for better UX)
      const dateComparison =
        new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateComparison !== 0) {
        return dateComparison;
      }

      // Then sort by meal type within the same date
      return mealTypeOrder[a.mealType] - mealTypeOrder[b.mealType];
    });
  }, [mealPlans]);

  useEffect(() => {
    dispatch(fetchMealPlans());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchMealPlans());
  };

  const handleDeleteMealPlan = async (mealPlan: MealPlan) => {
    try {
      await dispatch(deleteMealPlan(mealPlan.id)).unwrap();
    } catch (error) {
      console.error('Failed to delete meal plan:', error);
    }
  };

  const renderMealPlan = ({ item }: { item: MealPlan }) => (
    <MealCard
      mealPlan={item}
      onEdit={onEditMealPlan}
      onDelete={handleDeleteMealPlan}
      onPress={onMealPlanPress}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>献立がありません</Text>
      <Text style={styles.emptySubtitle}>新しい献立を作成して始めましょう</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>エラーが発生しました</Text>
      <Text style={styles.errorMessage}>{error}</Text>
    </View>
  );

  if (loading && mealPlans.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>献立を読み込み中...</Text>
      </View>
    );
  }

  if (error && mealPlans.length === 0) {
    return renderError();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedMealPlans}
        renderItem={renderMealPlan}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          sortedMealPlans.length === 0 ? styles.emptyListContainer : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default MealPlanList;
