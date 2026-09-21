import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../ThemeContext';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export function NumberStepper({ label, value, min, max, suffix, onChange }: Props) {
  const { colors: c } = useAppTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      <View style={[styles.control, { borderColor: c.border, backgroundColor: c.surface }]}>
        <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={[styles.button, { backgroundColor: c.surfaceSoft }]}><Text style={[styles.buttonText, { color: c.primaryDark }]}>−</Text></Pressable>
        <View style={styles.valueWrap}>
          <Text style={[styles.value, { color: c.text }]}>{value}</Text>
          {suffix ? <Text style={[styles.suffix, { color: c.muted }]}>{suffix}</Text> : null}
        </View>
        <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={[styles.button, { backgroundColor: c.surfaceSoft }]}><Text style={[styles.buttonText, { color: c.primaryDark }]}>+</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: '900' },
  control: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingHorizontal: 8 },
  button: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 24, fontWeight: '900', lineHeight: 26 },
  valueWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 },
  value: { fontSize: 20, fontWeight: '900' },
  suffix: { fontSize: 12, fontWeight: '700' },
});
