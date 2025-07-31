import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MealPlan } from '../../types';
import { COLORS, SPACING, FONT_SIZES, MEAL_TYPES } from '../../constants';

interface MealCardProps {
  mealPlan: MealPlan;
  onEdit: (mealPlan: MealPlan) => void;
  onDelete: (mealPlan: MealPlan) => void;
  onPress?: (mealPlan: MealPlan) => void;
}

const MealCard: React.FC<MealCardProps> = ({
  mealPlan,
  onEdit,
  onDelete,
  onPress,
}) => {
  const handleDelete = () => {
    Alert.alert('削除確認', `「${mealPlan.name}」を削除しますか？`, [
      {
        text: 'キャンセル',
        style: 'cancel',
      },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => onDelete(mealPlan),
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'sunny-outline';
      case 'lunch':
        return 'partly-sunny-outline';
      case 'dinner':
        return 'moon-outline';
      default:
        return 'restaurant-outline';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(mealPlan)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.mealTypeContainer}>
          <Ionicons
            name={getMealTypeIcon(mealPlan.mealType)}
            size={16}
            color={COLORS.primary}
          />
          <Text style={styles.mealType}>{MEAL_TYPES[mealPlan.mealType]}</Text>
        </View>
        <Text style={styles.date}>{formatDate(mealPlan.date)}</Text>
      </View>

      <Text style={styles.name}>{mealPlan.name}</Text>

      <View style={styles.recipeInfo}>
        <Ionicons
          name="restaurant-outline"
          size={14}
          color={COLORS.textSecondary}
        />
        <Text style={styles.recipeCount}>
          {mealPlan.recipeIds.length}品のレシピ
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(mealPlan)}
        >
          <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
          <Text style={styles.editButtonText}>編集</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>削除</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    marginHorizontal: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealType: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  date: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  name: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  recipeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  recipeCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    gap: SPACING.xs,
  },
  editButton: {
    backgroundColor: `${COLORS.primary}15`,
  },
  deleteButton: {
    backgroundColor: `${COLORS.error}15`,
  },
  editButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  deleteButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: '500',
  },
});

export default MealCard;
