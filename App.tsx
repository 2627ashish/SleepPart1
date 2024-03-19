import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import VitalsScreen from './src/Precomponents/Vitals';

export default function App() {

  return (
    <View>
      <VitalsScreen />
    </View>
  );
}