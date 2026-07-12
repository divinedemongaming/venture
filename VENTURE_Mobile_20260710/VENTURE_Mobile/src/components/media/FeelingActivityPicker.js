/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 *
 *  Feeling / Activity selector modal — Facebook-style.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable,
  FlatList, TouchableOpacity, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';

const FEELINGS = [
  { key: 'happy',     emoji: '😊', label: 'Happy' },
  { key: 'loved',     emoji: '🥰', label: 'Loved' },
  { key: 'blessed',   emoji: '🙏', label: 'Blessed' },
  { key: 'excited',   emoji: '🤩', label: 'Excited' },
  { key: 'grateful',  emoji: '🫶', label: 'Grateful' },
  { key: 'proud',     emoji: '💪', label: 'Proud' },
  { key: 'motivated', emoji: '🔥', label: 'Motivated' },
  { key: 'chill',     emoji: '😎', label: 'Chill' },
  { key: 'nostalgic', emoji: '🌅', label: 'Nostalgic' },
  { key: 'tired',     emoji: '😴', label: 'Tired' },
  { key: 'hyped',     emoji: '⚡', label: 'Hyped' },
  { key: 'grind',     emoji: '💻', label: 'In the Grind' },
  { key: 'winning',   emoji: '🏆', label: 'Winning' },
  { key: 'annoyed',   emoji: '😤', label: 'Annoyed' },
  { key: 'vibing',    emoji: '🎵', label: 'Vibing' },
  { key: 'focused',   emoji: '🎯', label: 'Focused' },
];

const ACTIVITIES = [
  { key: 'playing',    emoji: '🎮', label: 'Playing' },
  { key: 'watching',   emoji: '📺', label: 'Watching' },
  { key: 'streaming',  emoji: '🔴', label: 'Streaming' },
  { key: 'eating',     emoji: '🍕', label: 'Eating' },
  { key: 'traveling',  emoji: '✈️',  label: 'Traveling' },
  { key: 'working_out',emoji: '🏋️', label: 'Working Out' },
  { key: 'reading',    emoji: '📚', label: 'Reading' },
  { key: 'listening',  emoji: '🎧', label: 'Listening to' },
  { key: 'celebrating',emoji: '🥳', label: 'Celebrating' },
  { key: 'with',       emoji: '👥', label: 'With' },
  { key: 'thinking',   emoji: '💭', label: 'Thinking about' },
  { key: 'craving',    emoji: '😋', label: 'Craving' },
];

export default function FeelingActivityPicker({ visible, current, onSelect, onClose }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('feelings');
  const [search, setSearch] = useState('');

  const data = tab === 'feelings' ? FEELINGS : ACTIVITIES;
  const filtered = search
    ? data.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
    : data;

  function handleSelect(item) {
    onSelect({ ...item, category: tab });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>How are you feeling?</Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search feelings & activities..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {['feelings', 'activities'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, tab === t && styles.tabActive]}
                onPress={() => { setTab(t); setSearch(''); }}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Grid */}
          <FlatList
            data={filtered}
            numColumns={4}
            keyExtractor={i => i.key}
            contentContainerStyle={styles.grid}
            style={{ maxHeight: 280 }}
            renderItem={({ item }) => {
              const isSelected = current?.key === item.key;
              return (
                <TouchableOpacity
                  style={[styles.item, isSelected && styles.itemActive]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.emoji}>{item.emoji}</Text>
                  <Text style={[styles.itemLabel, isSelected && styles.itemLabelActive]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>No results for "{search}"</Text>
            }
          />

          {current && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => { onSelect(null); onClose(); }}>
              <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
              <Text style={styles.clearText}>Remove Feeling</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.base,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { ...Typography.h3, color: Colors.textPrimary },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.background, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  searchInput: { flex: 1, ...Typography.body, color: Colors.textPrimary },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { ...Typography.body, color: Colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  grid: { gap: 4, paddingBottom: 8 },
  item: {
    flex: 1, alignItems: 'center', padding: 10,
    borderRadius: 10, margin: 2,
    borderWidth: 1, borderColor: 'transparent',
  },
  itemActive: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '60' },
  emoji: { fontSize: 24, marginBottom: 4 },
  itemLabel: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  itemLabelActive: { color: Colors.primary, fontWeight: '600' },
  empty: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', padding: 20 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  clearText: { ...Typography.body, color: Colors.danger },
});
