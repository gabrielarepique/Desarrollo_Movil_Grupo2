import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CalendarViews from '../components/CalendarViews';
import HabitForm from '../components/HabitForm';
import HabitList from '../components/HabitList';
import HistoryView from '../components/HistoryView';
import { useCategories } from '../hooks/useCategories';
import { useHabits } from '../hooks/useHabits';
import { useUser } from '../hooks/useUser';
import { formatLongDate, getHabitsForToday } from '../utils/habitUtils';

const VIEW_OPTIONS = [
  { value: 'daily', label: 'Diaria' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'annual', label: 'Anual' },
];

export default function HomeScreen() {
  const { user, displayName, photoURL, initials, logout } = useUser();
  const { categories, error: categoryError, createCategory } = useCategories(user?.uid);
  const {
    filteredHabits,
    filters,
    setFilters,
    loading,
    saving,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitLog,
    toggleToday,
    getProgress,
    getHistory,
    defaultHabit,
  } = useHabits(user?.uid, categories);

  const [formVisible, setFormVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [historyHabit, setHistoryHabit] = useState(null);
  const [currentView, setCurrentView] = useState('daily');
  const [progressWindow, setProgressWindow] = useState(7);
  const [refreshing, setRefreshing] = useState(false);

  const summary = useMemo(() => {
    const todaysHabits = getHabitsForToday(filteredHabits);
    const doneToday = todaysHabits.filter((habit) => getProgress(habit, 1).completedDays > 0).length;
    return {
      total: todaysHabits.length,
      completed: doneToday,
      percent: todaysHabits.length > 0 ? Math.round((doneToday / todaysHabits.length) * 100) : 0,
    };
  }, [filteredHabits, getProgress]);

  const history = historyHabit ? getHistory(historyHabit, 30) : [];

  const openCreate = () => {
    setEditingHabit(defaultHabit);
    setFormVisible(true);
  };

  const openEdit = (habit) => {
    setEditingHabit(habit);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setEditingHabit(null);
  };

  const handleSubmitHabit = async (values) => {
    try {
      if (editingHabit?.id) {
        await updateHabit(editingHabit.id, values);
      } else {
        await createHabit(values);
      }
      closeForm();
    } catch (submitError) {
      Alert.alert('No pudimos guardar', submitError.message);
    }
  };

  const handleAddCategory = async (name) => {
    try {
      return await createCategory(name);
    } catch (creationError) {
      Alert.alert('No pudimos crear la categoria', creationError.message);
      return null;
    }
  };

  const handleDeleteHabit = (habit) => {
    Alert.alert('Eliminar habito', `Seguro que quieres eliminar "${habit.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHabit(habit.id);
          } catch (deleteError) {
            Alert.alert('No pudimos eliminar', deleteError.message);
          }
        },
      },
    ]);
  };

  const handleToggleToday = async (habit) => {
    try {
      await toggleToday(habit);
    } catch (toggleError) {
      Alert.alert('No pudimos actualizar el registro', toggleError.message);
    }
  };

  const handleToggleHistory = async (dateKey, nextValue) => {
    if (!historyHabit) {
      return;
    }

    try {
      await toggleHabitLog(historyHabit.id, dateKey, nextValue);
      setHistoryHabit((current) =>
        current
          ? {
              ...current,
              logs: {
                ...(current.logs || {}),
                [dateKey]: nextValue,
              },
            }
          : current
      );
    } catch (toggleError) {
      Alert.alert('No pudimos actualizar el historial', toggleError.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesion', 'Deseas cerrar sesion?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Cargando habitos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.userRow}>
              {photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              <View style={styles.headerCopy}>
                <Text style={styles.headerTitle}>¡Bienvenido {displayName}!</Text>
                <Text style={styles.headerDate}>{formatLongDate(new Date())}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {(error || categoryError) ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error || categoryError}</Text>
          </View>
        ) : null}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryNumber}>{summary.completed}</Text> /{' '}
            <Text style={styles.summaryNumber}>{summary.total}</Text> habitos aplicables hoy
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${summary.percent}%` }]} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Vistas</Text>
          <View style={styles.tabs}>
            {VIEW_OPTIONS.map((option) => {
              const active = currentView === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setCurrentView(option.value)}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <CalendarViews habits={filteredHabits} currentView={currentView} />
        </View>

        <View style={styles.listSection}>
          <HabitList
            habits={filteredHabits}
            categories={categories}
            filters={filters}
            onFiltersChange={setFilters}
            onEdit={openEdit}
            onDelete={handleDeleteHabit}
            onToggleToday={handleToggleToday}
            onOpenHistory={setHistoryHabit}
            progressWindow={progressWindow}
            onProgressWindowChange={setProgressWindow}
            getProgress={getProgress}
          />
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <HabitForm
        visible={formVisible}
        onClose={closeForm}
        onSubmit={handleSubmitHabit}
        categories={categories}
        onAddCategory={handleAddCategory}
        initialValues={editingHabit || defaultHabit}
        submitting={saving}
      />

      <HistoryView
        visible={Boolean(historyHabit)}
        habit={historyHabit}
        history={history}
        onToggle={handleToggleHistory}
        onClose={() => setHistoryHabit(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  scrollContent: { paddingBottom: 120 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
  },
  loadingText: { marginTop: 12, color: '#666', fontSize: 15 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0EDFF',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  userRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
    justifyContent: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A73E8',
  },
  headerDate: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
    textTransform: 'capitalize',
  },
  logoutBtn: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCCCC',
    alignSelf: 'flex-start',
  },
  logoutText: { color: '#E53935', fontWeight: '700', fontSize: 13 },
  errorCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  errorText: {
    color: '#C62828',
    fontSize: 13,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#1A73E8',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  summaryText: { fontSize: 15, color: '#444', marginBottom: 10 },
  summaryNumber: { fontWeight: '800', color: '#1A73E8', fontSize: 17 },
  progressBar: {
    height: 8,
    backgroundColor: '#E0EDFF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#1A73E8', borderRadius: 4 },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#1A73E8',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A73E8',
    marginBottom: 12,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D0E4FF',
    backgroundColor: '#FFF',
  },
  tabActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  tabText: {
    color: '#1A73E8',
    fontWeight: '700',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#FFF',
  },
  listSection: {
    marginHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A73E8',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: { color: '#FFF', fontSize: 32, lineHeight: 36, fontWeight: '300' },
});
