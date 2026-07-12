/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 *
 *  Shared media picker hook — camera, gallery, permissions, thumbnails.
 *  All three create screens (Post, Reel, Story) use this.
 */
import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { getVideoThumbnailAsync } from 'expo-video-thumbnails';
import { Alert, Platform } from 'react-native';

// ─── Permission helper ─────────────────────────────────────────────────────────

async function requestPermission(type) {
  if (type === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

function permissionDeniedAlert(type) {
  Alert.alert(
    `${type === 'camera' ? 'Camera' : 'Photos'} Access Needed`,
    `VENTURE needs ${type === 'camera' ? 'camera' : 'photo library'} access to let you share content. Enable it in Settings.`,
    [{ text: 'OK' }]
  );
}

// ─── Thumbnail helper ──────────────────────────────────────────────────────────

async function buildVideoThumb(uri) {
  try {
    const { uri: thumb } = await getVideoThumbnailAsync(uri, { time: 500 });
    return thumb;
  } catch {
    return null;
  }
}

// ─── MediaItem shape ───────────────────────────────────────────────────────────
// { uri, type: 'image'|'video', width, height, duration?, thumbnailUri?, fileName? }

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useMediaPicker({
  maxItems = 10,
  mediaTypes = 'all',   // 'all' | 'images' | 'videos'
  allowsMultiple = true,
  onAdd,
} = {}) {
  const [media, setMedia] = useState([]);  // MediaItem[]
  const [picking, setPicking] = useState(false);

  // Map mediaTypes string → ImagePicker enum
  function getMediaTypes() {
    if (mediaTypes === 'images') return ImagePicker.MediaTypeOptions.Images;
    if (mediaTypes === 'videos') return ImagePicker.MediaTypeOptions.Videos;
    return ImagePicker.MediaTypeOptions.All;
  }

  // ── Open Gallery ─────────────────────────────────────────────────────────────

  const openGallery = useCallback(async () => {
    if (picking) return;
    const granted = await requestPermission('library');
    if (!granted) { permissionDeniedAlert('library'); return; }

    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: getMediaTypes(),
        allowsMultipleSelection: allowsMultiple,
        selectionLimit: maxItems - media.length,
        quality: 0.92,
        videoMaxDuration: 600, // 10 min cap
        exif: false,
        orderedSelection: true,
      });

      if (!result.canceled && result.assets?.length) {
        const newItems = await Promise.all(
          result.assets.map(async asset => ({
            uri: asset.uri,
            type: asset.type ?? (asset.uri.includes('.mp4') || asset.uri.includes('.mov') ? 'video' : 'image'),
            width: asset.width,
            height: asset.height,
            duration: asset.duration,
            thumbnailUri: asset.type === 'video' ? await buildVideoThumb(asset.uri) : null,
            fileName: asset.fileName,
          }))
        );
        const updated = [...media, ...newItems].slice(0, maxItems);
        setMedia(updated);
        onAdd?.(updated);
      }
    } finally {
      setPicking(false);
    }
  }, [picking, media, maxItems, allowsMultiple, mediaTypes]);

  // ── Open Camera ──────────────────────────────────────────────────────────────

  const openCamera = useCallback(async (mode = 'photo') => {
    if (picking) return;
    const granted = await requestPermission('camera');
    if (!granted) { permissionDeniedAlert('camera'); return; }

    setPicking(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: mode === 'video'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
        quality: 0.92,
        videoMaxDuration: 60,
        cameraType: ImagePicker.CameraType.back,
        allowsEditing: mode === 'photo',  // native crop on photo
        aspect: mode === 'photo' ? undefined : [9, 16],
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const item = {
          uri: asset.uri,
          type: asset.type ?? (mode === 'video' ? 'video' : 'image'),
          width: asset.width,
          height: asset.height,
          duration: asset.duration,
          thumbnailUri: asset.type === 'video' ? await buildVideoThumb(asset.uri) : null,
          fileName: asset.fileName,
        };
        const updated = [...media, item].slice(0, maxItems);
        setMedia(updated);
        onAdd?.(updated);
      }
    } finally {
      setPicking(false);
    }
  }, [picking, media, maxItems]);

  // ── Reorder (drag-to-sort) ───────────────────────────────────────────────────

  const moveItem = useCallback((from, to) => {
    setMedia(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }, []);

  // ── Remove ───────────────────────────────────────────────────────────────────

  const removeItem = useCallback((index) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ── Clear ────────────────────────────────────────────────────────────────────

  const clear = useCallback(() => setMedia([]), []);

  return {
    media,
    picking,
    hasMedia: media.length > 0,
    openGallery,
    openCamera,
    removeItem,
    moveItem,
    clear,
    canAddMore: media.length < maxItems,
  };
}
