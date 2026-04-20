import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  FREQUENCY_OPTIONS,
  MONTH_DAY_OPTIONS,
  MONTH_OPTIONS,
  STATUS_OPTIONS,
  WEEKDAY_OPTIONS,
  getHabitDefaults,
} from '../utils/habitUtils';

function ChipSelector({ options, values, onToggle }) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const active = values.includes(option.value);
        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onToggle(option.value)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function HabitForm({
  visible,
  onClose,
  onSubmit,
  categories,
  onAddCategory,
  initialValues,
  submitting,
}) {
  const [form, setForm] = useState(getHabitDefaults());
  const [newCategory, setNewCategory] = useState('');
  const editing = Boolean(initialValues?.id);

  useEffect(() => {
    if (visible) {
      setForm({ ...getHabitDefaults(), ...initialValues });
      setNewCategory('');
    }
  }, [initialValues, visible]);

  const selectedCategoryId = form.categoryId;
  const canAddCategory = newCategory.trim().length > 0;

  const categoryLabel = useMemo(() => {
    return categories.find((category) => category.id === selectedCategoryId)?.name || '';
  }, [categories, selectedCategoryId]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleArrayValue = (field, value) => {
    setForm((current) => {
      const currentValues = current[field] || [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return { ...current, [field]: nextValues };
    });
  };

  const handleAddCategory = async () => {
    const createdCategory = await onAddCategory(newCategory.trim());
    if (createdCategory) {
      setForm((current) => ({
        ...current,
        categoryId: createdCategory.id,
        categoryName: createdCategory.name,
      }));
      setNewCategory('');
    }
  };

  const handleSubmit = async () => {
    const selectedName =
      categoryLabel || categories.find((category) => category.id === form.categoryId)?.name || '';
    await onSubmit({
      ...form,
      categoryName: selectedName || form.categoryName,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{editing ? 'Editar Hábito' : 'Nuevo Hábito'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre del hábito *"
              placeholderTextColor="#AAA"
              value={form.name}
              onChangeText={(value) => updateField('name', value)}
              maxLength={60}
            />

            <TextInput
              style={[styles.input, styles.multiLineInput]}
              placeholder="Descripción"
              placeholderTextColor="#AAA"
              value={form.description}
              onChangeText={(value) => updateField('description', value)}
              multiline
            />

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.chipRow}>
              {categories.map((category) => {
                const active = form.categoryId === category.id;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => {
                      updateField('categoryId', category.id);
                      updateField('categoryName', category.name);
                    }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.inlineRow}>
              <TextInput
                style={[styles.input, styles.inlineInput]}
                placeholder="Nueva categoría"
                placeholderTextColor="#AAA"
                value={newCategory}
                onChangeText={setNewCategory}
              />
              <TouchableOpacity
                style={[styles.inlineButton, !canAddCategory && styles.disabledButton]}
                onPress={handleAddCategory}
                disabled={!canAddCategory}
              >
                <Text style={styles.inlineButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Frecuencia</Text>
            <View style={styles.chipRow}>
              {FREQUENCY_OPTIONS.map((option) => {
                const active = form.frequency === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => updateField('frequency', option.value)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {form.frequency === 'weekly' ? (
              <>
                <Text style={styles.label}>Días aplicables</Text>
                <ChipSelector
                  options={WEEKDAY_OPTIONS}
                  values={form.weekDays || []}
                  onToggle={(value) => toggleArrayValue('weekDays', value)}
                />
              </>
            ) : null}

            {form.frequency === 'monthly' ? (
              <>
                <Text style={styles.label}>Días del mes</Text>
                <ChipSelector
                  options={MONTH_DAY_OPTIONS}
                  values={form.monthDays || []}
                  onToggle={(value) => toggleArrayValue('monthDays', value)}
                />
              </>
            ) : null}

            {form.frequency === 'annual' ? (
              <>
                <Text style={styles.label}>Meses</Text>
                <ChipSelector
                  options={MONTH_OPTIONS}
                  values={form.yearMonths || []}
                  onToggle={(value) => toggleArrayValue('yearMonths', value)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Día del año"
                  placeholderTextColor="#AAA"
                  value={String(form.annualDay || '')}
                  onChangeText={(value) => updateField('annualDay', value.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </>
            ) : null}

            <Text style={styles.label}>Meta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 3"
              placeholderTextColor="#AAA"
              value={String(form.target ?? 1)}
              onChangeText={(value) => updateField('target', value.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Estado</Text>
            <View style={styles.chipRow}>
              {STATUS_OPTIONS.map((option) => {
                const active = form.status === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => updateField('status', option.value)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A73E8',
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#446',
    marginBottom: 10,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F5F9FF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D0E4FF',
  },
  multiLineInput: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D0E4FF',
  },
  chipActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  chipText: {
    color: '#1A73E8',
    fontWeight: '700',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#FFF',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  inlineInput: {
    flex: 1,
  },
  inlineButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  disabledButton: {
    backgroundColor: '#A5C8FF',
  },
  inlineButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1A73E8',
  },
  saveText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
