import { View, StyleSheet } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
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

export function Card({ children, className }: CardProps) {
  return (
    <View className={`rounded-card bg-white p-4 ${className ?? ''}`} style={styles.shadow}>
      {children}
    </View>
  );
}
