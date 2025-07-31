import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MealPlan, RootStackParamList } from '../types';
import { COLORS, SPACING, FONT_SIZES } from '../constants';
import MealPlanList from '../components/meal/MealPlanList';
import MealCalendarView from '../components/meal/MealCalendarView';

type MealPlanScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Home'
>;

const MealPlanScreen: React.FC = () => {
  const navigation = useNavigation<MealPlanScreenNavigationProp>();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const handleEditMealPlan = (mealPlan: MealPlan) => {
    // Navigate to meal plan form with existing meal plan
    navigation.navigate('MealPlanForm', { mealPlanId: mealPlan.id });
  };

  const handleMealPlanPress = (mealPlan: MealPlan) => {
    // Navigate to meal plan detail screen
    navigation.navigate('MealPlanDetail', { mealPlanId: mealPlan.id });
  };

  const handleCreateMealPlan = (date?: string) => {
    // Navigate to meal plan form for creating new meal plan
    navigation.navigate('MealPlanForm', { date });
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'calendar' : 'list');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>献立一覧</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.viewToggleButton}
            onPress={toggleViewMode}
          >
            <Ionicons
              name={viewMode === 'list' ? 'calendar-outline' : 'list-outline'}
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleCreateMealPlan()}
          >
            <Ionicons name="add" size={24} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' ? (
        <MealPlanList
          onEditMealPlan={handleEditMealPlan}
          onMealPlanPress={handleMealPlanPress}
        />
      ) : (
        <MealCalendarView
          onEditMealPlan={handleEditMealPlan}
          onMealPlanPress={handleMealPlanPress}
          onCreateMealPlan={handleCreateMealPlan}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  viewToggleButton: {
    backgroundColor: COLORS.background,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MealPlanScreen;
