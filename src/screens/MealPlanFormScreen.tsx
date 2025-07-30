import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MealPlanForm from '../components/meal/MealPlanForm';
import { RootStackParamList } from '../types';

type MealPlanFormScreenRouteProp = RouteProp<RootStackParamList, 'MealPlanForm'>;
type MealPlanFormScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'MealPlanForm'
>;

interface MealPlanFormScreenProps {
  route: MealPlanFormScreenRouteProp;
  navigation: MealPlanFormScreenNavigationProp;
}

const MealPlanFormScreen: React.FC<MealPlanFormScreenProps> = ({
  route,
  navigation,
}) => {
  const { mealPlanId } = route.params || {};

  const handleSave = (savedMealPlanId: string) => {
    // Navigate back to meal plan list or detail screen
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <MealPlanForm
        mealPlanId={mealPlanId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MealPlanFormScreen;