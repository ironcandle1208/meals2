import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  selectMealPlans,
  selectMealPlanLoading,
} from '../../features/mealPlan/mealPlanSelectors';
import { fetchMealPlans } from '../../features/mealPlan/mealPlanSlice';
import { MealPlan, MealType } from '../../types';
import { COLORS, SPACING, FONT_SIZES, MEAL_TYPES } from '../../constants';
import MealCard from './MealCard';

interface MealCalendarViewProps {
  onEditMealPlan: (mealPlan: MealPlan) => void;
  onMealPlanPress?: (mealPlan: MealPlan) => void;
  onCreateMealPlan: (date: string) => void;
}

const MealCalendarView: React.FC<MealCalendarViewProps> = ({
  onEditMealPlan,
  onMealPlanPress,
  onCreateMealPlan,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const mealPlans = useSelector(selectMealPlans);
  const loading = useSelector(selectMealPlanLoading);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    dispatch(fetchMealPlans());
  }, [dispatch]);

  // Create marked dates for calendar
  const markedDates = useMemo(() => {
    const marked: { [key: string]: any } = {};

    // Mark dates that have meal plans
    mealPlans.forEach((mealPlan) => {
      const date = mealPlan.date.split('T')[0];
      if (!marked[date]) {
        marked[date] = {
          marked: true,
          dotColor: COLORS.primary,
        };
      }
    });

    // Mark selected date
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: COLORS.primary,
    };

    return marked;
  }, [mealPlans, selectedDate]);

  // Get meal plans for selected date
  const selectedDateMealPlans = useMemo(() => {
    return mealPlans
      .filter((mealPlan) => mealPlan.date.split('T')[0] === selectedDate)
      .sort((a, b) => {
        const mealTypeOrder: { [key in MealType]: number } = {
          breakfast: 1,
          lunch: 2,
          dinner: 3,
        };
        return mealTypeOrder[a.mealType] - mealTypeOrder[b.mealType];
      });
  }, [mealPlans, selectedDate]);

  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleCreateMealPlan = () => {
    onCreateMealPlan(selectedDate);
  };

  const renderMealPlansByType = () => {
    const mealsByType: { [key in MealType]: MealPlan[] } = {
      breakfast: [],
      lunch: [],
      dinner: [],
    };

    selectedDateMealPlans.forEach((mealPlan) => {
      mealsByType[mealPlan.mealType].push(mealPlan);
    });

    return (
      <View style={styles.mealPlansContainer}>
        {(Object.keys(mealsByType) as MealType[]).map((mealType) => (
          <View key={mealType} style={styles.mealTypeSection}>
            <View style={styles.mealTypeHeader}>
              <Text style={styles.mealTypeTitle}>
                {MEAL_TYPES[mealType]}
              </Text>
              {mealsByType[mealType].length === 0 && (
                <TouchableOpacity
                  style={styles.addMealButton}
                  onPress={handleCreateMealPlan}
                >
                  <Ionicons name="add" size={16} color={COLORS.primary} />
                  <Text style={styles.addMealText}>追加</Text>
                </TouchableOpacity>
              )}
            </View>

            {mealsByType[mealType].length > 0 ? (
              mealsByType[mealType].map((mealPlan) => (
                <MealCard
                  key={mealPlan.id}
                  mealPlan={mealPlan}
                  onEdit={onEditMealPlan}
                  onPress={onMealPlanPress}
                  showDate={false}
                />
              ))
            ) : (
              <View style={styles.emptyMealType}>
                <Text style={styles.emptyMealTypeText}>
                  {MEAL_TYPES[mealType]}の献立がありません
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={handleDateSelect}
        markedDates={markedDates}
        theme={{
          backgroundColor: COLORS.surface,
          calendarBackground: COLORS.surface,
          textSectionTitleColor: COLORS.text,
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: COLORS.surface,
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.text,
          textDisabledColor: COLORS.textSecondary,
          dotColor: COLORS.primary,
          selectedDotColor: COLORS.surface,
          arrowColor: COLORS.primary,
          monthTextColor: COLORS.text,
          indicatorColor: COLORS.primary,
          textDayFontSize: FONT_SIZES.md,
          textMonthFontSize: FONT_SIZES.lg,
          textDayHeaderFontSize: FONT_SIZES.sm,
        }}
        style={styles.calendar}
      />

      <View style={styles.selectedDateHeader}>
        <Text style={styles.selectedDateText}>
          {new Date(selectedDate).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateMealPlan}
          testID="header-add-button"
        >
          <Ionicons name="add" size={20} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>献立を読み込み中...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderMealPlansByType()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedDateText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  mealPlansContainer: {
    padding: SPACING.md,
  },
  mealTypeSection: {
    marginBottom: SPACING.lg,
  },
  mealTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  mealTypeTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addMealText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  emptyMealType: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyMealTypeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});

export default MealCalendarView;