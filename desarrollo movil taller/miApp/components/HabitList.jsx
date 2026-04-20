import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  FREQUENCY_OPTIONS,
  STATUS_OPTIONS,
  getDateKey,
  getFriendlyFrequency,
} from '../utils/habitUtils';

const PROGRESS_WINDOWS = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
];

function FilterRow({ title, options, selectedValue, onSelect, allowEmpty = true }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterChips}>
        {allowEmpty ? (
          <TouchableOpacity
            style={[styles.filterChip, !selectedValue && styles.filterChipActive]}
            onPress={() => onSelect('')}
          >
            <Text style={[styles.filterChipText, !selectedValue && styles.filterChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
        ) : null}
        {options.map((option) => {
          const active = selectedValue === option.value;
          return (
            <TouchableOpacity
              key={String(option.value)}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => onSelect(option.value)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function HabitList({
  habits,
  categories,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onToggleToday,
  onOpenHistory,
  progressWindow,
  onProgressWindowChange,
  getProgress,
}) {
  const todayKey = getDateKey(new Date());
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const [draftProgressWindow, setDraftProgressWindow] = useState(progressWindow);

  useEffect(() => {
    if (!filtersVisible) {
      setDraftFilters(filters);
      setDraftProgressWindow(progressWindow);
    }
  }, [filters, progressWindow, filtersVisible]);

  const activeFiltersCount = useMemo(
    () => [filters.categoryId, filters.status, filters.frequency].filter(Boolean).length,
    [filters]
  );

  const handleApplyFilters = () => {
    onFiltersChange(draftFilters);
    onProgressWindowChange(draftProgressWindow);
    setFiltersVisible(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      categoryId: '',
      status: '',
      frequency: '',
    };
    setDraftFilters(clearedFilters);
    setDraftProgressWindow(7);
    onFiltersChange(clearedFilters);
    onProgressWindowChange(7);
    setFiltersVisible(false);
  };

  return (
    <View>
      <View style={styles.toolbar}>
        <Text style={styles.sectionTitle}>Habitos</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFiltersVisible(true)}>
          <Text style={styles.filterButtonText}>
            Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {habits.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No encontramos habitos con esos filtros.</Text>
          <Text style={styles.emptySubtitle}>Prueba con otra categoria, frecuencia o estado.</Text>
        </View>
      ) : null}

      {habits.map((habit) => {
        const progress = getProgress(habit, progressWindow);
        const doneToday = Boolean(habit.logs?.[todayKey]);

        return (
          <View key={habit.id} style={[styles.habitCard, doneToday && styles.habitCardDone]}>
            <View style={styles.habitHeader}>
              <View style={styles.habitInfo}>
                <Text style={[styles.habitName, doneToday && styles.habitNameDone]}>{habit.name}</Text>
                <Text style={styles.habitMeta}>
                  {habit.categoryName || 'Sin categoria'} • {getFriendlyFrequency(habit)}
                </Text>
                <Text style={styles.habitMeta}>Estado: {habit.status}</Text>
              </View>
              <TouchableOpacity
                style={[styles.doneBtn, doneToday && styles.doneBtnDisabled]}
                onPress={() => onToggleToday(habit)}
              >
                <Text style={styles.doneBtnText}>{doneToday ? 'Hecho' : 'Marcar'}</Text>
              </TouchableOpacity>
            </View>

            {habit.description ? <Text style={styles.description}>{habit.description}</Text> : null}

            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                Progreso {progressWindow}d: {progress.completedDays}/{progress.applicableDays}
              </Text>
              <Text style={styles.progressPercent}>{progress.percent}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress.percent}%` }]} />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onOpenHistory(habit)}>
                <Text style={styles.actionText}>Historial</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(habit)}>
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(habit)}>
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <Modal
        visible={filtersVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFiltersVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Filtros</Text>

              <FilterRow
                title="Categoria"
                options={categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
                selectedValue={draftFilters.categoryId}
                onSelect={(value) => setDraftFilters((current) => ({ ...current, categoryId: value }))}
              />
              <FilterRow
                title="Estado"
                options={STATUS_OPTIONS}
                selectedValue={draftFilters.status}
                onSelect={(value) => setDraftFilters((current) => ({ ...current, status: value }))}
              />
              <FilterRow
                title="Frecuencia"
                options={FREQUENCY_OPTIONS}
                selectedValue={draftFilters.frequency}
                onSelect={(value) =>
                  setDraftFilters((current) => ({ ...current, frequency: value }))
                }
              />
              <FilterRow
                title="Resumen"
                options={PROGRESS_WINDOWS}
                selectedValue={draftProgressWindow}
                onSelect={setDraftProgressWindow}
                allowEmpty={false}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setFiltersVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A73E8',
  },
  filterButton: {
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: '#D0E4FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterButtonText: {
    color: '#1A73E8',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 26,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#444',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  habitCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0EDFF',
    shadowColor: '#1A73E8',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  habitCardDone: {
    backgroundColor: '#F0FFF4',
    borderColor: '#A8E6BB',
  },
  habitHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  habitNameDone: {
    color: '#2E7D32',
  },
  habitMeta: {
    fontSize: 12,
    color: '#778',
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
  },
  doneBtn: {
    backgroundColor: '#1A73E8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  doneBtnDisabled: {
    backgroundColor: '#43A047',
  },
  doneBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#445',
  },
  progressPercent: {
    fontSize: 13,
    color: '#1A73E8',
    fontWeight: '800',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0EDFF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1A73E8',
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: '#D0E4FF',
  },
  actionText: {
    color: '#1A73E8',
    fontWeight: '700',
    fontSize: 13,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  deleteText: {
    color: '#E53935',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A73E8',
    marginBottom: 18,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#556',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D0E4FF',
    backgroundColor: '#FFF',
  },
  filterChipActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  filterChipText: {
    color: '#1A73E8',
    fontWeight: '700',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  clearButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
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
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  applyButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1A73E8',
  },
  applyButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
