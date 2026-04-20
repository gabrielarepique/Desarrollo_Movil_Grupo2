import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatDisplayDate } from '../utils/habitUtils';

export default function HistoryView({ visible, habit, history, onToggle, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Historial</Text>
          <Text style={styles.subtitle}>{habit?.name || 'Hábito seleccionado'}</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            {history.map((entry) => (
              <View key={entry.dateKey} style={styles.row}>
                <View>
                  <Text style={styles.dateText}>{formatDisplayDate(entry.date)}</Text>
                  <Text style={styles.stateText}>
                    {entry.completed ? 'Completado' : 'Pendiente'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleButton, entry.completed && styles.toggleButtonActive]}
                  onPress={() => onToggle(entry.dateKey, !entry.completed)}
                >
                  <Text style={[styles.toggleText, entry.completed && styles.toggleTextActive]}>
                    {entry.completed ? 'Desmarcar' : 'Marcar'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            {history.length === 0 ? <Text style={styles.emptyText}>No hay registros aún.</Text> : null}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A73E8',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
  },
  scrollArea: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4FF',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#223',
    textTransform: 'capitalize',
  },
  stateText: {
    fontSize: 13,
    color: '#778',
    marginTop: 4,
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D0E4FF',
    backgroundColor: '#FFF',
  },
  toggleButtonActive: {
    backgroundColor: '#F0FFF4',
    borderColor: '#A8E6BB',
  },
  toggleText: {
    color: '#1A73E8',
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#2E7D32',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 20,
  },
  closeButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  closeText: {
    color: '#FFF',
    fontWeight: '700',
  },
});
