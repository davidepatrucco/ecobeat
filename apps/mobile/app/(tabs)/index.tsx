import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>
                Ciao, Davide! 👋
              </Text>
              <Text style={styles.level}>
                Livello: Eco Starter
              </Text>
            </View>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>🌱 120 punti</Text>
            </View>
          </View>
        </View>

        {/* Impact Card */}
        <View style={styles.impactCard}>
          <Text style={styles.impactLabel}>
            Questa settimana hai risparmiato
          </Text>
          <Text style={styles.impactValue}>
            4.5 kg CO₂
          </Text>
          <View style={styles.impactFooter}>
            <Text style={styles.impactFooterText}>
              🌍 Equivale a piantare 2 alberi!
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>
            Azioni rapide
          </Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
              <MaterialIcons name="eco" size={32} color="#22c55e" />
              <Text style={styles.actionText}>
                Aggiungi{'\n'}attività
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
              <MaterialIcons name="lightbulb" size={32} color="#0ea5e9" />
              <Text style={styles.actionTextSecondary}>
                Consiglio{'\n'}del giorno
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.accentAction]}>
              <MaterialIcons name="emoji-events" size={32} color="#eab308" />
              <Text style={styles.actionTextAccent}>
                Sfide{'\n'}attive
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>
            Attività recenti
          </Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityContent}>
                <View style={styles.activityIcon}>
                  <MaterialIcons name="directions-bike" size={20} color="#22c55e" />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>
                    Viaggio in bici
                  </Text>
                  <Text style={styles.activitySubtitle}>
                    5 km • -1.2 kg CO₂
                  </Text>
                </View>
              </View>
              <Text style={styles.activityPoints}>+10 punti</Text>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityContent}>
                <View style={[styles.activityIcon, { backgroundColor: '#dcfce7' }]}>
                  <MaterialIcons name="restaurant" size={20} color="#16a34a" />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>
                    Pasto vegetariano
                  </Text>
                  <Text style={styles.activitySubtitle}>
                    Pranzo • -1.7 kg CO₂
                  </Text>
                </View>
              </View>
              <Text style={styles.activityPoints}>+15 punti</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  level: {
    color: '#dcfce7',
    fontSize: 14,
  },
  pointsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pointsText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  impactCard: {
    marginHorizontal: 16,
    marginTop: -16, // Ridotto da -32 a -16 per evitare sovrapposizione
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  impactLabel: {
    textAlign: 'center',
    color: '#737373',
    fontSize: 14,
    marginBottom: 8,
  },
  impactValue: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 16,
  },
  impactFooter: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
  },
  impactFooterText: {
    textAlign: 'center',
    color: '#15803d',
    fontSize: 14,
  },
  quickActions: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: '#f0fdf4',
  },
  secondaryAction: {
    backgroundColor: '#f0f9ff',
  },
  accentAction: {
    backgroundColor: '#fefce8',
  },
  actionText: {
    color: '#15803d',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  actionTextSecondary: {
    color: '#0369a1',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  actionTextAccent: {
    color: '#a16207',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  recentActivity: {
    paddingHorizontal: 16,
    marginTop: 32,
    paddingBottom: 32,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: '500',
    color: '#171717',
    fontSize: 16,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#737373',
    marginTop: 2,
  },
  activityPoints: {
    color: '#16a34a',
    fontWeight: '500',
  },
});
