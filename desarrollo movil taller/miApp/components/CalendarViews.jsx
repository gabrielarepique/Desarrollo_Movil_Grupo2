import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  buildAnnualSummary,
  buildMonthlyCalendar,
  buildWeeklyMatrix,
  formatDisplayDate,
  getHabitsForToday,
} from '../utils/habitUtils';

export default function CalendarViews({ habits, currentView }) {
  const todayHabits = getHabitsForToday(habits);
  const weeklyData = buildWeeklyMatrix(habits);
  const monthlyData = buildMonthlyCalendar(habits);
  const annualData = buildAnnualSummary(habits);

  if (currentView === 'daily') {
    return (
      <View style={styles.block}>
        {todayHabits.length === 0 ? (
          <Text style={styles.emptyText}>No hay hábitos programados para hoy.</Text>
        ) : (
          todayHabits.map((habit) => (
            <View key={habit.id} style={styles.inlineCard}>
              <Text style={styles.cardTitle}>{habit.name}</Text>
              <Text style={styles.cardMeta}>{habit.categoryName || 'Sin categoría'}</Text>
            </View>
          ))
        )}
      </View>
    );
  }

  if (currentView === 'weekly') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.weekTable}>
          <View style={styles.weekHeaderRow}>
            <Text style={[styles.weekCell, styles.weekHabitCell]}>Hábito</Text>
            {weeklyData.days.map((day) => (
              <Text key={day.toISOString()} style={styles.weekCell}>
                {formatDisplayDate(day)}
              </Text>
            ))}
          </View>
          {weeklyData.rows.map((row) => (
            <View key={row.habit.id} style={styles.weekRow}>
              <Text style={[styles.weekCell, styles.weekHabitCell]}>{row.habit.name}</Text>
              {row.days.map((day) => (
                <View key={`${row.habit.id}-${day.date.toISOString()}`} style={styles.weekDotCell}>
                  <View
                    style={[
                      styles.statusDot,
                      !day.applies && styles.statusDotMuted,
                      day.applies && day.completed && styles.statusDotDone,
                    ]}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (currentView === 'monthly') {
    return (
      <View style={styles.calendarGrid}>
        {monthlyData.map((entry) => (
          <View key={entry.dayNumber} style={styles.calendarCell}>
            <Text style={styles.calendarDay}>{entry.dayNumber}</Text>
            <View
              style={[
                styles.calendarIndicator,
                entry.percent >= 100
                  ? styles.calendarIndicatorDone
                  : entry.applicableCount > 0
                    ? styles.calendarIndicatorPending
                    : styles.calendarIndicatorMuted,
              ]}
            />
            <Text style={styles.calendarMeta}>
              {entry.completedCount}/{entry.applicableCount}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.block}>
      {annualData.map((month) => (
        <View key={month.value} style={styles.annualRow}>
          <Text style={styles.annualLabel}>{month.label}</Text>
          <View style={styles.annualBar}>
            <View style={[styles.annualFill, { width: `${month.percent}%` }]} />
          </View>
          <Text style={styles.annualPercent}>{month.percent}%</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 10,
  },
  inlineCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0EDFF',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#223',
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#778',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
  weekTable: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0EDFF',
    overflow: 'hidden',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F9FF',
  },
  weekRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EEF4FF',
  },
  weekCell: {
    width: 92,
    padding: 10,
    color: '#445',
    fontSize: 12,
    textAlign: 'center',
  },
  weekHabitCell: {
    width: 120,
    fontWeight: '700',
    textAlign: 'left',
  },
  weekDotCell: {
    width: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F4C7C3',
  },
  statusDotDone: {
    backgroundColor: '#43A047',
  },
  statusDotMuted: {
    backgroundColor: '#D8E5FA',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarCell: {
    width: '13.5%',
    minWidth: 54,
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0EDFF',
  },
  calendarDay: {
    fontSize: 14,
    fontWeight: '700',
    color: '#223',
  },
  calendarIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginVertical: 6,
  },
  calendarIndicatorDone: {
    backgroundColor: '#43A047',
  },
  calendarIndicatorPending: {
    backgroundColor: '#F57C00',
  },
  calendarIndicatorMuted: {
    backgroundColor: '#D8E5FA',
  },
  calendarMeta: {
    fontSize: 10,
    color: '#667',
  },
  annualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  annualLabel: {
    width: 34,
    fontSize: 13,
    color: '#445',
    fontWeight: '700',
  },
  annualBar: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#E0EDFF',
  },
  annualFill: {
    height: '100%',
    backgroundColor: '#1A73E8',
  },
  annualPercent: {
    width: 40,
    textAlign: 'right',
    color: '#445',
    fontWeight: '700',
  },
});
