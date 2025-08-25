import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChallengesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#eab308' }}>
          🏆 Sfide
        </Text>
        <Text style={{ marginTop: 16, textAlign: 'center', color: '#737373' }}>
          Partecipa alle sfide e guadagna punti e badge
        </Text>
      </View>
    </SafeAreaView>
  );
}
