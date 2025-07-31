import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  createMealPlan,
  updateMealPlan,
  fetchMealPlanById,
  clearError,
} from '../../features/mealPlan/mealPlanSlice';
import { validateMealPlan } from '../../utils/validation';
import {
  MealType,
  CreateMealPlanInput,
  UpdateMealPlanInput,
} from '../../types';
import { COLORS, SPACING, FONT_SIZES, MEAL_TYPES } from '../../constants';
import CustomButton from '../common/CustomButton';

interface MealPlanFormProps {
  mealPlanId?: string;
  initialDate?: string;
  onSave?: (mealPlanId: string) => void;
  onCancel?: () => void;
}

const MealPlanForm: React.FC<MealPlanFormProps> = ({
  mealPlanId,
  initialDate,
  onSave,
  onCancel,
}) => {
  const dispatch = useAppDispatch();
  const { currentMealPlan, loading, error } = useAppSelector(
    (state) => state.mealPlan
  );

  // Form state
  const [name, setName] = useState('');
  const [date, setDate] = useState(initialDate ? new Date(initialDate) : new Date());
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing meal plan for editing
  useEffect(() => {
    if (mealPlanId) {
      dispatch(fetchMealPlanById(mealPlanId));
    }
  }, [mealPlanId, dispatch]);

  // Populate form with existing data
  useEffect(() => {
    if (currentMealPlan && mealPlanId === currentMealPlan.id) {
      setName(currentMealPlan.name);
      setDate(new Date(currentMealPlan.date));
      setMealType(currentMealPlan.mealType);
    }
  }, [currentMealPlan, mealPlanId]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const validateForm = (): boolean => {
    const formData = {
      name: name.trim(),
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      mealType,
      recipeIds: [], // Empty for now, will be handled in recipe selection
    };

    const validation = validateMealPlan(formData);
    setValidationErrors(validation.errors);
    return validation.isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = {
        name: name.trim(),
        date: date.toISOString().split('T')[0],
        mealType,
        recipeIds: currentMealPlan?.recipeIds || [],
      };

      let result;
      if (mealPlanId) {
        // Update existing meal plan
        const updateData: UpdateMealPlanInput = {
          id: mealPlanId,
          ...formData,
        };
        result = await dispatch(updateMealPlan(updateData)).unwrap();
      } else {
        // Create new meal plan
        const createData: CreateMealPlanInput = formData;
        result = await dispatch(createMealPlan(createData)).unwrap();
      }

      Alert.alert(
        '成功',
        mealPlanId ? '献立が更新されました' : '献立が作成されました',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSave) {
                onSave(result.id);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'エラー',
        mealPlanId ? '献立の更新に失敗しました' : '献立の作成に失敗しました'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('確認', '変更を破棄しますか？', [
      {
        text: 'キャンセル',
        style: 'cancel',
      },
      {
        text: '破棄',
        style: 'destructive',
        onPress: () => {
          if (onCancel) {
            onCancel();
          }
        },
      },
    ]);
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        {/* Title */}
        <Text style={styles.title}>
          {mealPlanId ? '献立を編集' : '新しい献立を作成'}
        </Text>

        {/* Error display */}
        {(error || validationErrors.length > 0) && (
          <View style={styles.errorContainer}>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {validationErrors.map((err, index) => (
              <Text key={index} style={styles.errorText}>
                • {err}
              </Text>
            ))}
          </View>
        )}

        {/* Meal Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>献立名 *</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="例: 和風ハンバーグ定食"
            placeholderTextColor={COLORS.textSecondary}
            maxLength={255}
            returnKeyType="next"
          />
        </View>

        {/* Date Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>日付 *</Text>
          <CustomButton
            title={formatDateForDisplay(date)}
            onPress={() => setShowDatePicker(true)}
            variant="secondary"
            style={styles.dateButton}
          />
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date(2030, 11, 31)}
              minimumDate={new Date(2020, 0, 1)}
            />
          )}
        </View>

        {/* Meal Type Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>食事タイプ *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={mealType}
              onValueChange={(itemValue) => setMealType(itemValue as MealType)}
              style={styles.picker}
            >
              <Picker.Item
                label={MEAL_TYPES.breakfast}
                value="breakfast"
                key="breakfast"
              />
              <Picker.Item label={MEAL_TYPES.lunch} value="lunch" key="lunch" />
              <Picker.Item
                label={MEAL_TYPES.dinner}
                value="dinner"
                key="dinner"
              />
            </Picker>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="キャンセル"
            onPress={handleCancel}
            variant="secondary"
            style={styles.cancelButton}
            disabled={isSubmitting || loading}
          />
          <CustomButton
            title={mealPlanId ? '更新' : '保存'}
            onPress={handleSave}
            variant="primary"
            style={styles.saveButton}
            disabled={isSubmitting || loading}
          />
        </View>

        {/* Loading indicator */}
        {(loading || isSubmitting) && (
          <Text style={styles.loadingText}>処理中...</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  form: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: COLORS.error + '20',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginBottom: 2,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    minHeight: 44,
  },
  dateButton: {
    justifyContent: 'flex-start',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    color: COLORS.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.sm,
  },
});

export default MealPlanForm;
