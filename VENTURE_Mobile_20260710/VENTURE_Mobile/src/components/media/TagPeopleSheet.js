/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 *
 *  Tag people in a post — searches users, shows selected tags.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable,
  FlatList, TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';

export default function TagPeopleSheet({ visible, tagged, onSave, onClose }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(tagged ?? []);
  const [loading, setLoading] = useState(false);

  // Sync when modal opens
  useEffect(() => { if (visible) setSelected(tagged ?? []); }, [visible]);

  // Search users
  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(search)}&limit=20`);
        setResults(res.data?.users ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  function toggle(user) {
    setSelected(prev => {
      const exists = prev.some(u => u.id === user.id);
      if (exists) return prev.filter(u => u.id !== user.id);
      if (prev.length >= 20) return prev; // max 20 tags
      return [...prev, user];
    });
  }

  function isTagged(user) {
    return selected.some(u => u.id === user.id);
  }

  function handleSave() {
    onSave(selected);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Tag People</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.doneText}>Done ({selected.length})</Text>
            </TouchableOpacity>
          </View>

          {/* Selected tags */}
          {selected.length > 0 && (
            <View style={styles.taggedRow}>
              {selected.map(u => (
                <TouchableOpacity key={u.id} style={styles.tagChip} onPress={() => toggle(u)}>
                  <Text style={styles.tagChipText}>@{u.username}</Text>
                  <Ionicons name="close" size={12} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or username..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {loading && <ActivityIndicator size="small" color={Colors.primary} />}
          </View>

          {/* Results */}
          <FlatList
            data={results}
            keyExtractor={u => u.id}
            style={{ maxHeight: 320 }}
            contentContainerStyle={{ gap: 2 }}
            renderItem={({ item }) => {
              const tagged = isTagged(item);
              return (
                <TouchableOpacity style={styles.result} onPress={() => toggle(item)}>
                  <View style={styles.avatar}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitial}>{item.username?.[0]?.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.displayName}>{item.displayName || item.username}</Text>
                    <Text style={styles.username}>@{item.username}</Text>
                  </View>
                  <View style={[styles.checkbox, tagged && styles.checkboxActive]}>
                    {tagged && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              search.length > 0 && !loading ? (
                <Text style={styles.noResults}>No users found for "{search}"</Text>
              ) : search.length === 0 ? (
                <Text style={styles.noResults}>Start typing to search for people</Text>
              ) : null
            }
          />
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
  cancelText: { ...Typography.body, color: Colors.textMuted },
  doneText: { ...Typography.body, color: Colors.primary, fontWeight: '700' },

  taggedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary + '18', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  tagChipText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.background, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  searchInput: { flex: 1, ...Typography.body, color: Colors.textPrimary },

  result: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 2 },
  avatar: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, backgroundColor: Colors.primary + '30', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { ...Typography.body, color: Colors.primary, fontWeight: '700' },
  displayName: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  username: { ...Typography.caption, color: Colors.textMuted },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  noResults: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', padding: 20 },
});
