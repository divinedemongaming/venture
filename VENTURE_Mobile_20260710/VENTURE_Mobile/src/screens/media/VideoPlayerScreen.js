import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  ActivityIndicator, Dimensions, Share, Platform, Alert,
} from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function formatTime(ms) {
  if (!ms || isNaN(ms)) return '0:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPlayerScreen({ route, navigation }) {
  const {
    videoUrl,
    title = 'Video',
    creator,
    thumbnailUrl,
    postId,
    isKids = false,
  } = route.params || {};

  const insets = useSafeAreaInsets();
  const videoRef = useRef(null);
  const controlsTimer = useRef(null);
  const isKidsMode = useAuthStore(s => s.isKidsMode);

  const [status, setStatus] = useState({});
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);

  const kidsActive = isKids || isKidsMode;

  // Enable audio in silent mode
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    }).catch(() => {});
  }, []);

  // Fetch like state
  useEffect(() => {
    if (!postId || kidsActive) return;
    api.get(`/posts/${postId}`).then(r => {
      setLiked(r.data.post?.isLiked || false);
      setLikeCount(r.data.post?.likeCount || 0);
    }).catch(() => {});
  }, [postId, kidsActive]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    clearTimeout(controlsTimer.current);
    setShowControls(true);
    controlsTimer.current = setTimeout(() => {
      if (status.isPlaying) setShowControls(false);
    }, 3000);
  }, [status.isPlaying]);

  useEffect(() => {
    resetControlsTimer();
    return () => clearTimeout(controlsTimer.current);
  }, [status.isPlaying]);

  // Lock orientation in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [isFullscreen]);

  const handlePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    if (status.isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      // Replay from start if ended
      if (status.positionMillis >= status.durationMillis - 500) {
        await videoRef.current.setPositionAsync(0);
      }
      await videoRef.current.playAsync();
    }
    resetControlsTimer();
  }, [status, resetControlsTimer]);

  const handleSliderChange = useCallback((value) => {
    setSeekValue(value);
  }, []);

  const handleSliderComplete = useCallback(async (value) => {
    if (!videoRef.current || !status.durationMillis) return;
    const pos = value * status.durationMillis;
    await videoRef.current.setPositionAsync(pos);
    setIsSeeking(false);
    resetControlsTimer();
  }, [status.durationMillis, resetControlsTimer]);

  const handleMute = useCallback(() => {
    setMuted(m => !m);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(f => !f);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handleLike = useCallback(async () => {
    if (kidsActive || !postId) return;
    try {
      if (liked) {
        await api.delete(`/posts/${postId}/like`);
        setLiked(false);
        setLikeCount(c => Math.max(0, c - 1));
      } else {
        await api.post(`/posts/${postId}/like`);
        setLiked(true);
        setLikeCount(c => c + 1);
      }
    } catch {
      // silent — UI already toggled, server will reconcile
    }
  }, [liked, postId, kidsActive]);

  const handleShare = useCallback(async () => {
    if (kidsActive) return;
    try {
      await Share.share({
        message: title ? `Watch "${title}" on VENTURE` : 'Watch this on VENTURE',
        url: videoUrl,
      });
    } catch {
      // user dismissed
    }
  }, [title, videoUrl, kidsActive]);

  const handleScreenTap = useCallback(() => {
    setShowControls(v => {
      if (!v) resetControlsTimer();
      return !v;
    });
  }, [resetControlsTimer]);

  const sliderPosition = isSeeking
    ? seekValue
    : status.durationMillis
      ? (status.positionMillis || 0) / status.durationMillis
      : 0;

  if (error) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Ionicons name="alert-circle-outline" size={56} color={Colors.error || '#FF4444'} />
        <Text style={styles.errorText}>Could not load video</Text>
        <Text style={styles.errorSub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => setError(null)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreen]}>
      <StatusBar hidden={isFullscreen} barStyle="light-content" backgroundColor="#000" />

      <TouchableOpacity
        style={styles.videoWrapper}
        activeOpacity={1}
        onPress={handleScreenTap}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping={false}
          isMuted={muted}
          usePoster={!!thumbnailUrl}
          posterSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
          onPlaybackStatusUpdate={s => {
            if (!isSeeking) setStatus(s);
            if (s.error) setError(s.error);
          }}
          onError={e => setError(typeof e === 'string' ? e : 'Playback error')}
        />

        {/* Loading spinner */}
        {status.isBuffering && !status.isPlaying && (
          <View style={styles.spinnerOverlay}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        )}

        {/* Controls overlay */}
        {showControls && (
          <View style={styles.overlay}>
            {/* Top bar */}
            <View style={[styles.topBar, { paddingTop: isFullscreen ? 16 : insets.top + 8 }]}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={styles.titleBlock}>
                {title ? <Text style={styles.titleText} numberOfLines={1}>{title}</Text> : null}
                {creator ? <Text style={styles.creatorText} numberOfLines={1}>{creator}</Text> : null}
              </View>
              {!kidsActive && (
                <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                  <Ionicons name="share-outline" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Center play/pause */}
            <TouchableOpacity style={styles.centerBtn} onPress={handlePlayPause}>
              <Ionicons
                name={status.isPlaying ? 'pause-circle' : 'play-circle'}
                size={72}
                color="rgba(255,255,255,0.9)"
              />
            </TouchableOpacity>

            {/* Bottom controls */}
            <View style={[styles.bottomBar, { paddingBottom: isFullscreen ? 16 : insets.bottom + 8 }]}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={sliderPosition}
                onValueChange={v => { setIsSeeking(true); handleSliderChange(v); }}
                onSlidingComplete={handleSliderComplete}
                minimumTrackTintColor={Colors.primary || '#6C63FF'}
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="#fff"
              />
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>
                  {formatTime(status.positionMillis)} / {formatTime(status.durationMillis)}
                </Text>
                <View style={styles.rightControls}>
                  {!kidsActive && (
                    <TouchableOpacity onPress={handleLike} style={styles.iconBtn}>
                      <Ionicons
                        name={liked ? 'heart' : 'heart-outline'}
                        size={22}
                        color={liked ? '#FF4B77' : '#fff'}
                      />
                      {likeCount > 0 && (
                        <Text style={styles.likeCount}>
                          {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={handleMute} style={styles.iconBtn}>
                    <Ionicons
                      name={muted ? 'volume-mute-outline' : 'volume-high-outline'}
                      size={22}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleFullscreen} style={styles.iconBtn}>
                    <Ionicons
                      name={isFullscreen ? 'contract-outline' : 'expand-outline'}
                      size={22}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreen: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
  },
  videoWrapper: {
    flex: 1,
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  titleBlock: {
    flex: 1,
    marginHorizontal: 8,
  },
  titleText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  creatorText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  centerBtn: {
    alignSelf: 'center',
  },
  bottomBar: {
    paddingHorizontal: 12,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    color: '#fff',
    fontSize: 12,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    padding: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  errorSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 24,
    backgroundColor: Colors.primary || '#6C63FF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
