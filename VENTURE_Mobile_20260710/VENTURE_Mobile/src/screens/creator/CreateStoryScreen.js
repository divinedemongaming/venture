/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Switch, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';
import { useMediaPicker } from '../../hooks/useMediaPicker';
import MediaPickerSheet from '../../components/media/MediaPickerSheet';

const STORY_DURATIONS = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '1 min' },
];

const VISIBILITY_OPTIONS = [
  { key: 'PUBLIC',         label: 'Everyone',      icon: 'earth-outline',      desc: 'All VENTURE users' },
  { key: 'FOLLOWERS_ONLY', label: 'Followers',     icon: 'people-outline',     desc: 'Only your followers' },
  { key: 'CLOSE_FRIENDS',  label: 'Close Friends', icon: 'heart-outline',      desc: 'Your close-friends list' },
  { key: 'PRIVATE',        label: 'Only Me',       icon: 'lock-closed-outline',desc: 'Private — no one else' },
];

const CONTENT_RATINGS = [
  { key: 'EVERYONE', label: 'Everyone',   color: '#10B981', icon: 'happy-outline' },
  { key: 'TEEN',     label: 'Teen 13+',   color: '#F59E0B', icon: 'person-outline' },
  { key: 'MATURE',   label: 'Mature 18+', color: '#EF4444', icon: 'warning-outline' },
];

function SwitchRow({ label, sub, value, onPress, disabled, last }) {
  return (
    <>
      <View style={[styles.switchRow, disabled && { opacity: 0.4 }]}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>{label}</Text>
          {sub ? <Text style={styles.switchSub}>{sub}</Text> : null}
        </View>
        <Switch value={value} onValueChange={onPress} disabled={disabled}
          trackColor={{ false: '#333', true: '#7C3AED' }} thumbColor="#fff" />
      </View>
      {!last && <View style={styles.switchDivider} />}
    </>
  );
}

export default function CreateStoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { media, picking, hasMedia, openGallery, openCamera, removeItem, clear } = useMediaPicker({ maxItems: 1, mediaTypes: 'all' });
  const [pickerSheet, setPickerSheet] = useState(false);

  const [duration, setDuration] = useState(15);
  const [visibility, setVisibility] = useState('PUBLIC');
  const [contentRating, setContentRating] = useState('EVERYONE');
  const [madeForKids, setMadeForKids] = useState(false);
  const [ageRestricted, setAgeRestricted] = useState(false);

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date(Date.now() + 3600000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [countdownMsg, setCountdownMsg] = useState('');
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const [commentsMode, setCommentsMode] = useState('OPEN');
  const [allowRemix, setAllowRemix] = useState(true);
  const [tipsEnabled, setTipsEnabled] = useState(false);

  const [loading, setLoading] = useState(false);

  function handleMadeForKids(val) {
    setMadeForKids(val);
    if (val) { setCommentsMode('DISABLED'); setTipsEnabled(false); }
  }

  async function handlePost() {
    if (!hasMedia) return Alert.alert('No media', 'Select a photo or video for your story.');
    setLoading(true);
    try {
      const item = media[0];
      const formData = new FormData();
      formData.append('media', { uri: item.uri, type: item.type === 'video' ? 'video/mp4' : 'image/jpeg', name: item.fileName || ('story.' + (item.type === 'video' ? 'mp4' : 'jpg')) });
      const payload = {
        duration, visibility, contentRating, madeForKids, ageRestricted,
        commentsMode, allowRemix, tipsEnabled,
        scheduledAt: isScheduled ? scheduleDate.toISOString() : null,
        dropCountdownMsg: isScheduled ? countdownMsg : null,
        timezone,
      };
      formData.append('data', JSON.stringify(payload));
      await api.post('/stories', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not post story. Try again.');
      setLoading(false);
    }
  }

  const firstItem = media[0];
  const isVideo = firstItem?.type === 'video';
  const previewUri = isVideo ? firstItem?.thumbnailUri ?? firstItem?.uri : firstItem?.uri;
  const scheduledLabel = isScheduled ? scheduleDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={24} color="#F8FAFC" /></TouchableOpacity>
        <Text style={styles.headerTitle}>New Story</Text>
        <TouchableOpacity style={[styles.shareBtn, (!hasMedia || loading) && styles.shareBtnOff]} onPress={handlePost} disabled={loading || !hasMedia}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.shareBtnText}>{isScheduled ? 'Schedule' : 'Share'}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>

        {/* Summary pills */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryPill}><Ionicons name="eye-outline" size={11} color="#94A3B8" /><Text style={styles.summaryText}>{VISIBILITY_OPTIONS.find(v => v.key === visibility)?.label}</Text></View>
          <View style={styles.summaryPill}><Ionicons name="shield-checkmark-outline" size={11} color="#94A3B8" /><Text style={styles.summaryText}>{CONTENT_RATINGS.find(r => r.key === contentRating)?.label}</Text></View>
          {scheduledLabel && <View style={[styles.summaryPill, { borderColor: 'rgba(124,58,237,0.6)' }]}><Ionicons name="calendar-outline" size={11} color="#7C3AED" /><Text style={[styles.summaryText, { color: '#7C3AED' }]}>{scheduledLabel}</Text></View>}
        </View>

        {/* Media area */}
        <TouchableOpacity style={styles.mediaArea} onPress={() => setPickerSheet(true)} activeOpacity={0.85}>
          {hasMedia && previewUri ? (
            <>
              <Image source={{ uri: previewUri }} style={styles.mediaPreview} contentFit="cover" />
              {isVideo && (
                <View style={styles.videoBadge}>
                  <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.9)" />
                </View>
              )}
              <TouchableOpacity style={styles.changeMedia} onPress={() => setPickerSheet(true)}>
                <Ionicons name="swap-horizontal-outline" size={14} color="#fff" />
                <Text style={styles.changeMediaText}>Change</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.mediaEmpty}>
              <LinearGradient colors={['#1a1a2e', '#0A0A0F']} style={StyleSheet.absoluteFill} />
              <View style={styles.mediaEmptyBtns}>
                <View style={styles.mediaEmptyIcon}><Ionicons name="camera-outline" size={26} color="#7C3AED" /></View>
                <View style={styles.mediaEmptyIcon}><Ionicons name="images-outline" size={26} color="#06B6D4" /></View>
                <View style={styles.mediaEmptyIcon}><Ionicons name="videocam-outline" size={26} color="#10B981" /></View>
              </View>
              <Text style={styles.mediaEmptyLabel}>{"Take a photo, record a video,\nor pick from your gallery"}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Duration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}><Ionicons name="timer-outline" size={15} color="#7C3AED" /><Text style={styles.cardTitle}>Duration</Text></View>
          <View style={styles.durationRow}>
            {STORY_DURATIONS.map(d => (
              <TouchableOpacity key={d.value} style={[styles.durationBtn, duration === d.value && styles.durationBtnActive]} onPress={() => setDuration(d.value)}>
                <Text style={[styles.durationLabel, duration === d.value && styles.durationLabelActive]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Audience */}
        <View style={styles.card}>
          <View style={styles.cardHeader}><Ionicons name="eye-outline" size={15} color="#7C3AED" /><Text style={styles.cardTitle}>Audience</Text></View>
          {VISIBILITY_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.key} style={[styles.optRow, visibility === opt.key && styles.optRowActive]} onPress={() => setVisibility(opt.key)}>
              <View style={[styles.optIcon, visibility === opt.key && styles.optIconActive]}><Ionicons name={opt.icon} size={15} color={visibility === opt.key ? '#7C3AED' : '#94A3B8'} /></View>
              <View style={{ flex: 1 }}><Text style={[styles.optLabel, visibility === opt.key && styles.optLabelActive]}>{opt.label}</Text><Text style={styles.optDesc}>{opt.desc}</Text></View>
              {visibility === opt.key && <Ionicons name="checkmark-circle" size={17} color="#7C3AED" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Content rating */}
        <View style={styles.card}>
          <View style={styles.cardHeader}><Ionicons name="shield-checkmark-outline" size={15} color="#7C3AED" /><Text style={styles.cardTitle}>Content Rating</Text></View>
          <View style={styles.ratingRow}>
            {CONTENT_RATINGS.map(r => (<TouchableOpacity key={r.key} style={[styles.ratingChip, contentRating === r.key && { borderColor: r.color, backgroundColor: r.color + '18' }]} onPress={() => setContentRating(r.key)}><Ionicons name={r.icon} size={15} color={contentRating === r.key ? r.color : '#94A3B8'} /><Text style={[styles.ratingText, contentRating === r.key && { color: r.color }]}>{r.label}</Text></TouchableOpacity>))}
          </View>
          <View style={styles.switchCard}><SwitchRow label="Made for Kids" sub="Limits comments and monetization" value={madeForKids} onPress={handleMadeForKids} /><SwitchRow label="Age Restricted (18+)" sub="Viewers must confirm age" value={ageRestricted} onPress={v => { setAgeRestricted(v); if (v) setMadeForKids(false); }} disabled={madeForKids} last /></View>
        </View>

        {/* Schedule */}
        <View style={styles.card}>
          <View style={styles.cardHeader}><Ionicons name="calendar-outline" size={15} color="#7C3AED" /><Text style={styles.cardTitle}>Schedule</Text></View>
          <View style={styles.switchCard}><SwitchRow label="Schedule Story" sub="Post at a specific date and time" value={isScheduled} onPress={setIsScheduled} last /></View>
          {isScheduled && (
            <View style={{ marginTop: 10, gap: 8 }}>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={16} color="#7C3AED" />
                <Text style={styles.dateBtnText}>{scheduleDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + '  \u00b7  ' + scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
              </TouchableOpacity>
              <Text style={{ color: '#64748B', fontSize: 11 }}>Timezone: {timezone}</Text>
              <TextInput style={styles.input} placeholder='Countdown message e.g. "Story dropping soon!"' placeholderTextColor="#94A3B8" value={countdownMsg} onChangeText={setCountdownMsg} maxLength={120} />
              {showDatePicker && <DateTimePicker value={scheduleDate} mode="datetime" minimumDate={new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) setScheduleDate(d); }} themeVariant="dark" />}
            </View>
          )}
        </View>

        {/* Interaction */}
        <View style={styles.card}>
          <View style={styles.cardHeader}><Ionicons name="chatbubbles-outline" size={15} color="#7C3AED" /><Text style={styles.cardTitle}>Interaction</Text></View>
          <Text style={styles.subLabel}>Comments</Text>
          <View style={styles.commentRow}>
            {[['OPEN','chatbubbles-outline','Open'],['REVIEW','eye-outline','Review First'],['DISABLED','close-circle-outline','Off']].map(([key, icon, label]) => (
              <TouchableOpacity key={key} style={[styles.commentChip, commentsMode === key && styles.commentChipActive, madeForKids && key !== 'DISABLED' && { opacity: 0.4 }]} onPress={() => !madeForKids && setCommentsMode(key)}>
                <Ionicons name={icon} size={14} color={commentsMode === key ? '#7C3AED' : '#94A3B8'} />
                <Text style={[styles.commentChipText, commentsMode === key && styles.commentChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.switchCard}><SwitchRow label="Allow Remixes" sub="Others can remix this story" value={allowRemix} onPress={setAllowRemix} last /></View>
        </View>

        {/* Monetization */}
        <View style={styles.card}>
          <View style={styles.cardHeader}><Ionicons name="cash-outline" size={15} color="#7C3AED" /><Text style={styles.cardTitle}>Monetization</Text></View>
          <View style={styles.switchCard}><SwitchRow label="Enable Tips" sub="Viewers can send tips on this story" value={tipsEnabled && !madeForKids} onPress={v => !madeForKids && setTipsEnabled(v)} disabled={madeForKids} last /></View>
        </View>

      </ScrollView>

      <MediaPickerSheet visible={pickerSheet} onClose={() => setPickerSheet(false)} onCameraPhoto={() => openCamera('photo')} onCameraVideo={() => openCamera('video')} onGallery={() => openGallery()} loading={picking} hasMedia={hasMedia} onRemoveAll={clear} mode="all" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '700' },
  shareBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  shareBtnOff: { opacity: 0.4 },
  shareBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  summaryBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  summaryPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#111118', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#1E293B' },
  summaryText: { color: '#94A3B8', fontSize: 11 },
  mediaArea: { marginHorizontal: 16, marginBottom: 12, height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1E293B' },
  mediaPreview: { width: '100%', height: '100%' },
  videoBadge: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -16 }, { translateY: -16 }] },
  changeMedia: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  changeMediaText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  mediaEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  mediaEmptyBtns: { flexDirection: 'row', gap: 12 },
  mediaEmptyIcon: { width: 58, height: 58, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1E293B' },
  mediaEmptyLabel: { color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: '#111118', borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 14, borderWidth: 1, borderColor: '#1E293B' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  cardTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#0A0A0F', borderWidth: 1, borderColor: '#1E293B' },
  durationBtnActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.18)' },
  durationLabel: { color: '#94A3B8', fontSize: 14 },
  durationLabelActive: { color: '#7C3AED', fontWeight: '700' },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 10, marginBottom: 5, borderWidth: 1, borderColor: 'transparent' },
  optRowActive: { backgroundColor: 'rgba(124,58,237,0.1)', borderColor: 'rgba(124,58,237,0.4)' },
  optIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' },
  optIconActive: { backgroundColor: 'rgba(124,58,237,0.2)' },
  optLabel: { color: '#94A3B8', fontSize: 14 },
  optLabelActive: { color: '#F8FAFC', fontWeight: '600' },
  optDesc: { color: '#64748B', fontSize: 11, marginTop: 1 },
  ratingRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  ratingChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#1E293B' },
  ratingText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  switchCard: { backgroundColor: '#0A0A0F', borderRadius: 10, borderWidth: 1, borderColor: '#1E293B', overflow: 'hidden' },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  switchInfo: { flex: 1 },
  switchLabel: { color: '#F8FAFC', fontSize: 14, fontWeight: '500' },
  switchSub: { color: '#64748B', fontSize: 12, marginTop: 1 },
  switchDivider: { height: 0.5, backgroundColor: '#1E293B', marginLeft: 14 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#0A0A0F', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(124,58,237,0.6)' },
  dateBtnText: { flex: 1, color: '#7C3AED', fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: '#0A0A0F', borderRadius: 10, borderWidth: 1, borderColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 10, color: '#F8FAFC', fontSize: 14 },
  subLabel: { color: '#64748B', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  commentRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  commentChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: '#1E293B' },
  commentChipActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.15)' },
  commentChipText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  commentChipTextActive: { color: '#7C3AED' },
});
