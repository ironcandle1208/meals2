import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Screen imports
import MealPlanScreen from '../screens/MealPlanScreen';
import RecipeScreen from '../screens/RecipeScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import SearchScreen from '../screens/SearchScreen';
import MealPlanFormScreen from '../screens/MealPlanFormScreen';

import { TabParamList, RootStackParamList } from '../types';
import { COLORS } from '../constants';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'MealPlan') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Recipe') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'ShoppingList') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
      })}
    >
      <Tab.Screen
        name="MealPlan"
        component={MealPlanScreen}
        options={{ title: '献立' }}
      />
      <Tab.Screen
        name="Recipe"
        component={RecipeScreen}
        options={{ title: 'レシピ' }}
      />
      <Tab.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{ title: '買い物リスト' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: '検索' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MealPlanForm"
          component={MealPlanFormScreen}
          options={{
            title: '献立作成・編集',
            headerStyle: {
              backgroundColor: COLORS.surface,
            },
            headerTintColor: COLORS.text,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
