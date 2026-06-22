import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COINS = [
  { emoji: '💸', dy: 0 },
  { emoji: '🪙', dy: -14 },
  { emoji: '💵', dy: 10 },
  { emoji: '💸', dy: -6 },
  { emoji: '🪙', dy: 12 },
  { emoji: '💰', dy: -10 },
];

function AnimationPlayer({ fromName, toName }) {
  const progresses = useRef(COINS.map(() => new Animated.Value(0))).current;
  const piggyScale = useRef(new Animated.Value(1)).current;
  const piggyY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(
      110,
      progresses.map(p =>
        Animated.timing(p, { toValue: 1, duration: 620, useNativeDriver: true })
      )
    ).start();

    setTimeout(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(piggyScale, { toValue: 1.55, friction: 3, tension: 50, useNativeDriver: true }),
          Animated.timing(piggyY, { toValue: -8, duration: 120, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(piggyScale, { toValue: 0.85, friction: 3, tension: 50, useNativeDriver: true }),
          Animated.timing(piggyY, { toValue: 4, duration: 100, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(piggyScale, { toValue: 1.15, friction: 3, tension: 50, useNativeDriver: true }),
          Animated.timing(piggyY, { toValue: -2, duration: 80, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(piggyScale, { toValue: 1, friction: 3, tension: 50, useNativeDriver: true }),
          Animated.timing(piggyY, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]),
      ]).start();
    }, 110 * COINS.length + 380);
  }, []);

  return (
    <View style={styles.playerRow}>
      <View style={styles.side}>
        <Text style={styles.personEmoji}>🙋</Text>
        <Text style={styles.sideName} numberOfLines={1}>{fromName.split(' ')[0]}</Text>
        <Text style={styles.sideLabel}>paga</Text>
      </View>

      <View style={styles.track}>
        {COINS.map((coin, i) => {
          const tx = progresses[i].interpolate({ inputRange: [0, 1], outputRange: [0, 110] });
          const ty = progresses[i].interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [coin.dy, coin.dy - 26, coin.dy],
          });
          const op = progresses[i].interpolate({ inputRange: [0, 0.08, 0.9, 1], outputRange: [0, 1, 1, 0] });
          const sc = progresses[i].interpolate({ inputRange: [0, 0.12, 0.88, 1], outputRange: [0, 1.3, 1, 0] });
          return (
            <Animated.Text
              key={i}
              style={[styles.coin, { transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }], opacity: op }]}
            >
              {coin.emoji}
            </Animated.Text>
          );
        })}
      </View>

      <View style={styles.side}>
        <Animated.Text style={[styles.piggyEmoji, { transform: [{ scale: piggyScale }, { translateY: piggyY }] }]}>
          🐷
        </Animated.Text>
        <Text style={styles.sideName} numberOfLines={1}>{toName.split(' ')[0]}</Text>
        <Text style={styles.sideLabel}>recebe</Text>
      </View>
    </View>
  );
}

export default function MoneyAnimation({ fromName, toName }) {
  const [key, setKey] = useState(0);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Animação do pagamento</Text>
      <AnimationPlayer key={key} fromName={fromName} toName={toName} />
      <TouchableOpacity style={styles.replayBtn} onPress={() => setKey(k => k + 1)}>
        <Text style={styles.replayText}>▶ Repetir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  title: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  playerRow: { flexDirection: 'row', alignItems: 'center', height: 88 },
  side: { width: 68, alignItems: 'center' },
  personEmoji: { fontSize: 30 },
  piggyEmoji: { fontSize: 34 },
  sideName: { fontSize: 11, fontWeight: '700', color: '#111827', marginTop: 3, textAlign: 'center' },
  sideLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  track: { flex: 1, height: 64, position: 'relative' },
  coin: { position: 'absolute', fontSize: 22, left: 0, top: 20 },
  replayBtn: {
    alignSelf: 'center',
    marginTop: 6,
    paddingVertical: 5,
    paddingHorizontal: 18,
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
  },
  replayText: { fontSize: 12, color: '#16A34A', fontWeight: '700' },
});
