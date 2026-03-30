import { View, StyleSheet } from 'react-native';

interface CardProps {
  children: React.ReactNode;
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
});

export function Card({ children }: CardProps) {
  return (
    <View className="rounded-card bg-white p-4" style={styles.shadow}>
      {children}
    </View>
  );
}
