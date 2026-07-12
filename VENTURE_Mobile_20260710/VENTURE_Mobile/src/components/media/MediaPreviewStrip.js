/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 *
 *  Horizontal scroll strip of selected media thumbnails.
 *  Appears after user selects media. Supports remove and add-more.
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';

const THUMB = 84;
const { width: W } = Dimensions.get('window');

function formatDuration(ms) {
  if (!ms) return null;
  const sec = Math.round(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MediaPreviewStrip({ media, onRemove, onAdd, canAddMore, picking }) {
  if (!media?.length && !picking) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {media.map((item, index) => {
          const isVideo = item.type === 'video';
          const thumbSrc = isVideo ? item.thumbnailUri : item.uri;
          const dur = isVideo ? formatDuration(item.duration) : null;
          const isMain = index === 0;

          return (
            <View key={item.uri + index} style={[styles.thumb, isMain && styles.thumbMain]}>
              {thumbSrc ? (
                <Image
                  source={{ uri: thumbSrc }}
                  style={styles.thumbImg}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="image-outline" size={24} color={Colors.textMuted} />
                </View>
              )}

              {/* Video badge */}
              {isVideo && (
                <View style={styles.videoBadge}>
                  <Ionicons name="play" size={8} color="#fff" />
                  {dur && <Text style={styles.videoDur}>{dur}</Text>}
                </View>
              )}

              {/* Main badge */}
              {isMain && media.length > 1 && (
                <View style={styles.mainBadge}>
                  <Text style={styles.mainBadgeText}>COVER</Text>
                </View>
              )}

              {/* Remove button */}
              <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(index)}>
                <View style={styles.removeBg}>
                  <Ionicons name="close" size={12} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add more */}
        {canAddMore && (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
            <Ionicons name="add" size={24} color={Colors.primary} />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Count */}
      <View style={styles.countRow}>
        <Ionicons name="layers-outline" size={12} color={Colors.textMuted} />
        <Text style={styles.countText}>{media.length} item{media.length !== 1 ? 's' : ''} selected</Text>
        {media.length > 1 && (
          <Text style={styles.hintText}> · First photo is your cover</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  scroll: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },

  thumb: {
    width: THUMB, height: THUMB, borderRadius: 10, overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    borderWidth: 1, borderColor: Colors.border,
  },
  thumbMain: {
    width: THUMB + 12, height: THUMB + 12,
    borderColor: Colors.primary, borderWidth: 2,
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  videoBadge: {
    position: 'absolute', bottom: 4, left: 4,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  videoDur: { color: '#fff', fontSize: 9, fontWeight: '700' },

  mainBadge: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: Colors.primary, borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  mainBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },

  removeBtn: { position: 'absolute', top: 4, right: 4 },
  removeBg: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },

  addBtn: {
    width: THUMB, height: THUMB, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addText: { color: Colors.primary, fontSize: 10, fontWeight: '700' },

  countRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingBottom: 4,
  },
  countText: { ...Typography.caption, color: Colors.textMuted },
  hintText: { ...Typography.caption, color: Colors.textMuted },
});
