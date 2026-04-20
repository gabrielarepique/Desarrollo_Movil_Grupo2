import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, mapFirebaseError } from '../firebase';
import {
  buildHabitHistory,
  calculateProgress,
  filterHabits,
  getDateKey,
  getHabitDefaults,
  sanitizeHabitPayload,
  validateHabit,
} from '../utils/habitUtils';

const INITIAL_FILTERS = {
  categoryId: '',
  status: '',
  frequency: '',
};

export function useHabits(userId, categories) {
  const [habits, setHabits] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [loading, setLoading] = useState(Boolean(userId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setHabits([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const habitsQuery = query(collection(db, 'habits'), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      habitsQuery,
      (snapshot) => {
        const nextHabits = snapshot.docs
          .map((document) => ({ id: document.id, ...document.data() }))
          .sort((a, b) => {
            const aTime =
              typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : 0;
            const bTime =
              typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : 0;
            return bTime - aTime;
          });

        setHabits(nextHabits);
        setError('');
        setLoading(false);
      },
      (snapshotError) => {
        setError(mapFirebaseError(snapshotError, 'No pudimos cargar tus hábitos.'));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const filteredHabits = useMemo(() => filterHabits(habits, filters), [filters, habits]);

  const createHabit = useCallback(
    async (values) => {
      const validationError = validateHabit(values);
      if (validationError) {
        throw new Error(validationError);
      }

      const payload = sanitizeHabitPayload(values, categories);
      setSaving(true);
      try {
        await addDoc(collection(db, 'habits'), {
          ...payload,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (creationError) {
        throw new Error(mapFirebaseError(creationError, 'No pudimos crear el hábito.'));
      } finally {
        setSaving(false);
      }
    },
    [categories, userId]
  );

  const updateHabit = useCallback(
    async (habitId, values) => {
      const validationError = validateHabit(values);
      if (validationError) {
        throw new Error(validationError);
      }

      const payload = sanitizeHabitPayload(values, categories);
      setSaving(true);
      try {
        await updateDoc(doc(db, 'habits', habitId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } catch (updateError) {
        throw new Error(mapFirebaseError(updateError, 'No pudimos actualizar el hábito.'));
      } finally {
        setSaving(false);
      }
    },
    [categories]
  );

  const deleteHabit = useCallback(async (habitId) => {
    try {
      await deleteDoc(doc(db, 'habits', habitId));
    } catch (deleteError) {
      throw new Error(mapFirebaseError(deleteError, 'No pudimos eliminar el hábito.'));
    }
  }, []);

  const toggleHabitLog = useCallback(
    async (habitId, dateKey, nextValue) => {
      const previousHabit = habits.find((habit) => habit.id === habitId);
      const previousValue = Boolean(previousHabit?.logs?.[dateKey]);

      setHabits((currentHabits) =>
        currentHabits.map((habit) =>
          habit.id === habitId
            ? {
                ...habit,
                logs: {
                  ...(habit.logs || {}),
                  [dateKey]: nextValue,
                },
              }
            : habit
        )
      );

      try {
        await updateDoc(doc(db, 'habits', habitId), {
          [`logs.${dateKey}`]: nextValue,
          updatedAt: serverTimestamp(),
        });
      } catch (toggleError) {
        setHabits((currentHabits) =>
          currentHabits.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  logs: {
                    ...(habit.logs || {}),
                    [dateKey]: previousValue,
                  },
                }
              : habit
          )
        );

        throw new Error(mapFirebaseError(toggleError, 'No pudimos guardar el registro.'));
      }
    },
    [habits]
  );

  const toggleToday = useCallback(
    async (habit) => {
      const dateKey = getDateKey(new Date());
      const nextValue = !Boolean(habit.logs?.[dateKey]);
      return toggleHabitLog(habit.id, dateKey, nextValue);
    },
    [toggleHabitLog]
  );

  const getProgress = useCallback((habit, windowSize) => calculateProgress(habit, windowSize), []);
  const getHistory = useCallback((habit, days = 30) => buildHabitHistory(habit, days), []);

  return {
    habits,
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
    defaultHabit: getHabitDefaults(),
    clearFilters: () => setFilters(INITIAL_FILTERS),
  };
}
