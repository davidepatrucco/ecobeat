import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RewardsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0ea5e9' }}>
          🎁 Premi
        </Text>
        <Text style={{ marginTop: 16, textAlign: 'center', color: '#737373' }}>
          Riscatta i tuoi punti con premi sostenibili
        </Text>
      </View>
    </SafeAreaView>
  );
}
