import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ActivitiesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#22c55e' }}>
          🌱 Attività
        </Text>
        <Text style={{ marginTop: 16, textAlign: 'center', color: '#737373' }}>
          Qui potrai tracciare le tue attività sostenibili quotidiane
        </Text>
      </View>
    </SafeAreaView>
  );
}
