const DAY_MS = 24 * 60 * 60 * 1000;

export const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'annual', label: 'Anual' },
];

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Completado' },
];

export const WEEKDAY_OPTIONS = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'X' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
];

export const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => ({
  value: index + 1,
  label: String(index + 1),
}));

export const MONTH_OPTIONS = [
  { value: 0, label: 'Ene' },
  { value: 1, label: 'Feb' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Abr' },
  { value: 4, label: 'May' },
  { value: 5, label: 'Jun' },
  { value: 6, label: 'Jul' },
  { value: 7, label: 'Ago' },
  { value: 8, label: 'Sep' },
  { value: 9, label: 'Oct' },
  { value: 10, label: 'Nov' },
  { value: 11, label: 'Dic' },
];

export function normalizeDate(date = new Date()) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function addDays(date, amount) {
  return new Date(normalizeDate(date).getTime() + amount * DAY_MS);
}

export function getDateKey(date = new Date()) {
  const normalized = normalizeDate(date);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, '0');
  const day = String(normalized.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDisplayDate(date) {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatLongDate(date) {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getHabitDefaults() {
  const today = normalizeDate(new Date());
  return {
    name: '',
    description: '',
    categoryId: '',
    categoryName: '',
    frequency: 'daily',
    status: 'active',
    target: 1,
    weekDays: [today.getDay()],
    monthDays: [today.getDate()],
    yearMonths: [today.getMonth()],
    annualDay: today.getDate(),
    logs: {},
  };
}

export function sanitizeHabitPayload(values, categories = []) {
  const defaults = getHabitDefaults();
  const selectedCategory = categories.find((category) => category.id === values.categoryId);
  const categoryName = values.categoryName?.trim() || selectedCategory?.name || '';
  const payload = {
    name: values.name?.trim() || '',
    description: values.description?.trim() || '',
    categoryId: values.categoryId || '',
    categoryName,
    frequency: values.frequency || defaults.frequency,
    status: values.status || defaults.status,
    target: Math.max(1, Number(values.target) || 1),
    weekDays: [...new Set((values.weekDays || defaults.weekDays).map(Number))].sort(),
    monthDays: [...new Set((values.monthDays || defaults.monthDays).map(Number))].sort((a, b) => a - b),
    yearMonths: [...new Set((values.yearMonths || defaults.yearMonths).map(Number))].sort((a, b) => a - b),
    annualDay: Math.min(31, Math.max(1, Number(values.annualDay) || defaults.annualDay)),
    logs: values.logs || {},
  };

  if (payload.frequency === 'weekly' && payload.weekDays.length === 0) {
    payload.weekDays = defaults.weekDays;
  }

  if (payload.frequency === 'monthly' && payload.monthDays.length === 0) {
    payload.monthDays = defaults.monthDays;
  }

  if (payload.frequency === 'annual' && payload.yearMonths.length === 0) {
    payload.yearMonths = defaults.yearMonths;
  }

  return payload;
}

export function validateHabit(values) {
  if (!values.name?.trim()) {
    return 'El nombre del hábito es obligatorio.';
  }

  if (!values.categoryName?.trim() && !values.categoryId) {
    return 'Selecciona una categoría o crea una nueva.';
  }

  if (Number(values.target) <= 0) {
    return 'La meta debe ser mayor a cero.';
  }

  if (values.frequency === 'weekly' && (!values.weekDays || values.weekDays.length === 0)) {
    return 'Selecciona al menos un día para la frecuencia semanal.';
  }

  if (values.frequency === 'monthly' && (!values.monthDays || values.monthDays.length === 0)) {
    return 'Selecciona al menos un día para la frecuencia mensual.';
  }

  if (values.frequency === 'annual' && (!values.yearMonths || values.yearMonths.length === 0)) {
    return 'Selecciona al menos un mes para la frecuencia anual.';
  }

  return '';
}

export function isHabitApplicableOnDate(habit, date) {
  const normalized = normalizeDate(date);
  const dateKey = getDateKey(normalized);
  const createdAt =
    typeof habit.createdAt?.toDate === 'function'
      ? normalizeDate(habit.createdAt.toDate())
      : habit.createdAt
        ? normalizeDate(new Date(habit.createdAt))
        : null;

  if (createdAt && normalized < createdAt) {
    return false;
  }

  if (habit.status === 'paused') {
    return false;
  }

  if (habit.status === 'completed' && !habit.logs?.[dateKey]) {
    return false;
  }

  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return (habit.weekDays || []).includes(normalized.getDay());
    case 'monthly':
      return (habit.monthDays || []).includes(normalized.getDate());
    case 'annual':
      return (
        (habit.yearMonths || []).includes(normalized.getMonth()) &&
        Number(habit.annualDay || 1) === normalized.getDate()
      );
    default:
      return true;
  }
}

export function getCompletionState(habit, date) {
  const dateKey = getDateKey(date);
  return Boolean(habit.logs?.[dateKey]);
}

export function buildHabitHistory(habit, days = 30) {
  const today = normalizeDate(new Date());
  const history = [];

  for (let offset = 0; offset < days; offset += 1) {
    const date = addDays(today, -offset);
    if (isHabitApplicableOnDate(habit, date)) {
      history.push({
        date,
        dateKey: getDateKey(date),
        completed: getCompletionState(habit, date),
      });
    }
  }

  return history;
}

export function calculateProgress(habit, windowSize = 7) {
  const today = normalizeDate(new Date());
  let applicableDays = 0;
  let completedDays = 0;

  for (let offset = 0; offset < windowSize; offset += 1) {
    const date = addDays(today, -offset);
    if (isHabitApplicableOnDate(habit, date)) {
      applicableDays += 1;
      if (getCompletionState(habit, date)) {
        completedDays += 1;
      }
    }
  }

  return {
    applicableDays,
    completedDays,
    percent: applicableDays > 0 ? Math.round((completedDays / applicableDays) * 100) : 0,
  };
}

export function filterHabits(habits, filters) {
  return habits.filter((habit) => {
    const categoryOk = !filters.categoryId || habit.categoryId === filters.categoryId;
    const statusOk = !filters.status || habit.status === filters.status;
    const frequencyOk = !filters.frequency || habit.frequency === filters.frequency;
    return categoryOk && statusOk && frequencyOk;
  });
}

export function getHabitsForToday(habits) {
  const today = normalizeDate(new Date());
  return habits.filter((habit) => isHabitApplicableOnDate(habit, today));
}

export function buildWeeklyMatrix(habits) {
  const today = normalizeDate(new Date());
  const start = addDays(today, -6);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));

  const rows = habits.map((habit) => ({
    habit,
    days: days.map((date) => ({
      date,
      applies: isHabitApplicableOnDate(habit, date),
      completed: getCompletionState(habit, date),
    })),
  }));

  return { days, rows };
}

export function buildMonthlyCalendar(habits) {
  const today = normalizeDate(new Date());
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const totalDays = end.getDate();

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), index + 1);
    const applicableHabits = habits.filter((habit) => isHabitApplicableOnDate(habit, date));
    const completedHabits = applicableHabits.filter((habit) => getCompletionState(habit, date));
    const percent =
      applicableHabits.length > 0
        ? Math.round((completedHabits.length / applicableHabits.length) * 100)
        : 0;

    return {
      date,
      dayNumber: index + 1,
      applicableCount: applicableHabits.length,
      completedCount: completedHabits.length,
      percent,
    };
  });
}

export function buildAnnualSummary(habits) {
  const year = new Date().getFullYear();
  return MONTH_OPTIONS.map((month) => {
    const lastDay = new Date(year, month.value + 1, 0).getDate();
    let applicable = 0;
    let completed = 0;

    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(year, month.value, day);
      habits.forEach((habit) => {
        if (isHabitApplicableOnDate(habit, date)) {
          applicable += 1;
          if (getCompletionState(habit, date)) {
            completed += 1;
          }
        }
      });
    }

    return {
      ...month,
      applicable,
      completed,
      percent: applicable > 0 ? Math.round((completed / applicable) * 100) : 0,
    };
  });
}

export function getFriendlyFrequency(habit) {
  switch (habit.frequency) {
    case 'daily':
      return 'Todos los días';
    case 'weekly':
      return `Semanal • ${(habit.weekDays || [])
        .map((day) => WEEKDAY_OPTIONS.find((option) => option.value === day)?.label)
        .filter(Boolean)
        .join(', ')}`;
    case 'monthly':
      return `Mensual • días ${(habit.monthDays || []).join(', ')}`;
    case 'annual':
      return `Anual • día ${habit.annualDay} en ${(habit.yearMonths || [])
        .map((month) => MONTH_OPTIONS.find((option) => option.value === month)?.label)
        .filter(Boolean)
        .join(', ')}`;
    default:
      return habit.frequency;
  }
}
