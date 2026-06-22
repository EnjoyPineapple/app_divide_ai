import { StyleSheet, Text, View } from 'react-native';
import { getColor } from '../utils/colors';

export default function Avatar({ name, index, size = 40 }) {
  const color = getColor(index);
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <View style={[
      styles.avatar,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: color.bg }
    ]}>
      <Text style={[styles.text, { color: color.text, fontSize: size * 0.38 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700' },
});
