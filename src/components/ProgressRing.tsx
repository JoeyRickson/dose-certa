import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '../ThemeContext';

interface Props {
  progress: number;
  size?: number;
  stroke?: number;
  mainText: string;
  subText: string;
}

export function ProgressRing({ progress, size = 150, stroke = 12, mainText, subText }: Props) {
  const { colors: c } = useAppTheme();
  const safe = Math.max(0, Math.min(1, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safe);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={c.primarySoft} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={c.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.mainText, { color: c.text }]}>{mainText}</Text>
        <Text style={[styles.subText, { color: c.muted }]}>{subText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  mainText: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subText: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 2 },
});
