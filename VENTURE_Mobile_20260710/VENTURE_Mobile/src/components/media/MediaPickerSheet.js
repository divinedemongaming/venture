/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 *
 *  Bottom-sheet media source selector.
 *  Pops up when user taps the media area — lets them choose
 *  camera (photo/video), gallery, or remove.
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Pressable, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';

const OPTIONS = [
  {
    key: 'camera_photo',
    icon: 'camera-outline',
    color: Colors.primary,
    label: 'Take Photo',
    sub: 'Open camera and snap a photo',
  },
  {
    key: 'camera_video',
    icon: 'videocam-outline',
    color: '#06B6D4',
    label: 'Record Video',
    sub: 'Shoot a video up to 10 minutes',
  },
  {
    key: 'gallery',
    icon: 'images-outline',
    color: '#F59E0B',
    label: 'Choose from Gallery',
    sub: 'Pick photos and videos from your library',
  },
];

export default function MediaPickerSheet({
  visible,
  onClose,
  onCameraPhoto,
  onCameraVideo,
  onGallery,
  loading,
  hasMedia,
  onRemoveAll,
  // mode: 'all' | 'photo' | 'video' — hides irrelevant options
  mode = 'all',
}) {
  const insets = useSafeAreaInsets();

  function handleSelect(key) {
    onClose();
    // Small delay so sheet closes before native picker opens (avoids flicker)
    setTimeout(() => {
      if (key === 'camera_photo') onCameraPhoto?.();
      else if (key === 'camera_video') onCameraVideo?.();
      else if (key === 'gallery') onGallery?.();
    }, 180);
  }

  const visibleOptions = OPTIONS.filter(o => {
    if (mode === 'photo') return o.key !== 'camera_video';
    if (mode === 'video') return o.key !== 'camera_photo';
    return true;
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.title}>Add Media</Text>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>Processing media…</Text>
            </View>
          )}

          {visibleOptions.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={styles.option}
              onPress={() => handleSelect(opt.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: opt.color + '20' }]}>
                <Ionicons name={opt.icon} size={22} color={opt.color} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionSub}>{opt.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}

          {hasMedia && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => { onClose(); onRemoveAll?.(); }}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                <Text style={styles.removeText}>Remove All Media</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.base,
    borderTopWidth: 1, borderColor: Colors.border,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 16,
  },
  title: {
    ...Typography.h3, color: Colors.textPrimary,
    marginBottom: 16, textAlign: 'center',
  },
  loadingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 12,
  },
  loadingText: { ...Typography.body, color: Colors.textMuted },

  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, paddingHorizontal: 4,
  },
  optionIcon: {
    width: 46, height: 46, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionLabel: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  optionSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },

  removeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12,
  },
  removeText: { ...Typography.body, color: Colors.danger, fontWeight: '600' },

  cancelBtn: {
    marginTop: 4, paddingVertical: 14,
    backgroundColor: Colors.background, borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: { ...Typography.body, color: Colors.textSecondary, fontWeight: '600' },
});
