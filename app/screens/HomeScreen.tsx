import { View, Text, Button } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 32 }}>Poly Words</Text>
      <Button title="Play" onPress={() => navigation.navigate('Game')} />
    </View>
  );
}