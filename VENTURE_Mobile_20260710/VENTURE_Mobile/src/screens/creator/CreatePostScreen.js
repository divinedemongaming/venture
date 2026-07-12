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
  KeyboardAvoidingView, Platform, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';
import { useMediaPicker } from '../../hooks/useMediaPicker';
import MediaPickerSheet from '../../components/media/MediaPickerSheet';
import MediaPreviewStrip from '../../components/media/MediaPreviewStrip';
import FeelingActivityPicker from '../../components/media/FeelingActivityPicker';
import TagPeopleSheet from '../../components/media/TagPeopleSheet';

const BG_THEMES = [
  { key: null,       gradient: null,                   label: 'None' },
  { key: 'purple',   gradient: ['#7C3AED', '#4C1D95'], label: 'Purple' },
  { key: 'ocean',    gradient: ['#0EA5E9', '#0C4A6E'], label: 'Ocean' },
  { key: 'fire',     gradient: ['#F59E0B', '#DC2626'], label: 'Fire' },
  { key: 'forest',   gradient: ['#10B981', '#064E3B'], label: 'Forest' },
  { key: 'midnight', gradient: ['#1E1B4B', '#0F172A'], label: 'Night' },
  { key: 'rose',     gradient: ['#F43F5E', '#881337'], label: 'Rose' },
  { key: 'gaming',   gradient: ['#06B6D4', '#7C3AED'], label: 'Gaming' },
];

const VISIBILITY_OPTIONS = [
  { key: 'PUBLIC',           label: 'Public',           icon: 'earth-outline',       sub: 'Anyone on VENTURE' },
  { key: 'FOLLOWERS_ONLY',   label: 'Followers Only',   icon: 'people-outline',      sub: 'Your followers only' },
  { key: 'SUBSCRIBERS_ONLY', label: 'Subscribers Only', icon: 'star-outline',        sub: 'Paid subscribers only' },
  { key: 'UNLISTED',         label: 'Unlisted',         icon: 'link-outline',        sub: 'Only via direct link' },
  { key: 'PRIVATE',          label: 'Only Me',          icon: 'lock-closed-outline', sub: 'Completely private' },
];

const CONTENT_RATINGS = [
  { key: 'EVERYONE', label: 'Everyone',   color: '#10B981', icon: 'happy-outline' },
  { key: 'TEEN',     label: 'Teen 13+',   color: '#F59E0B', icon: 'person-outline' },
  { key: 'MATURE',   label: 'Mature 18+', color: '#EF4444', icon: 'warning-outline' },
];

const GAMES = ['Fortnite','Valorant','Apex Legends','Warzone','Minecraft','League of Legends','Rocket League','COD','FIFA','NBA 2K','GTA V','Elden Ring','Overwatch 2','Diablo IV','Other'];

const CTA_TYPES = [
  { key: 'SUBSCRIBE', label: 'Subscribe', icon: 'star' },
  { key: 'FOLLOW',    label: 'Follow',    icon: 'person-add' },
  { key: 'TIP',       label: 'Send a Tip',icon: 'cash' },
  { key: 'VISIT_LINK',label: 'Visit Link',icon: 'link' },
  { key: 'WATCH_NEXT',label: 'Watch Next',icon: 'play-circle' },
];

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

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

export default function CreatePostScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { media, picking, hasMedia, openGallery, openCamera, removeItem, clear, canAddMore } = useMediaPicker({ maxItems: 10 });
  const [pickerSheet, setPickerSheet] = useState(false);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [game, setGame] = useState('');
  const [bgTheme, setBgTheme] = useState(null);
  const [altText, setAltText] = useState('');
  const [feeling, setFeeling] = useState(null);
  const [showFeeling, setShowFeeling] = useState(false);
  const [taggedPeople, setTaggedPeople] = useState([]);
  const [showTagPeople, setShowTagPeople] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [visibility, setVisibility] = useState('PUBLIC');
  const [contentRating, setContentRating] = useState('EVERYONE');
  const [madeForKids, setMadeForKids] = useState(false);
  const [ageRestricted, setAgeRestricted] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(new Date(Date.now() + 3600000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dropMsg, setDropMsg] = useState('');
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [commentsMode, setCommentsMode] = useState('OPEN');
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowRemix, setAllowRemix] = useState(true);
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [paidUnlock, setPaidUnlock] = useState(false);
  const [paidUnlockPrice, setPaidUnlockPrice] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [featuredOnProfile, setFeaturedOnProfile] = useState(false);
  const [ctaType, setCtaType] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [loading, setLoading] = useState(false);

  function handleMadeForKids(val) {
    setMadeForKids(val);
    if (val) { setTipsEnabled(false); setCommentsMode('DISABLED'); }
  }

  async function handleAddLocation() {
    if (location) { setLocation(null); return; }
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Location Access', 'Enable location permission in Settings.'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync(pos.coords);
      const label = [geo.city, geo.region, geo.country].filter(Boolean).join(', ');
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label });
    } catch { Alert.alert('Location error', 'Could not get your location. Try again.'); }
    finally { setLocationLoading(false); }
  }

  async function handleSubmit(publishNow = true) {
    if (!hasMedia && !caption.trim()) return Alert.alert('Nothing to post', 'Add a photo, video, or write something.');
    setLoading(true);
    try {
      const formData = new FormData();
      media.forEach((item, i) => {
        formData.append('media', { uri: item.uri, type: item.type === 'video' ? 'video/mp4' : 'image/jpeg', name: item.fileName || ('media_' + i + (item.type === 'video' ? '.mp4' : '.jpg')) });
      });
      const payload = {
        content: caption, tags: hashtags.split(/[\s,]+/).filter(Boolean),
        gameTag: game, bgTheme, visibility, contentRating, madeForKids, ageRestricted,
        commentsMode, allowDuet, allowRemix, tipsEnabled, isExclusive,
        paidUnlockPrice: paidUnlock ? parseFloat(paidUnlockPrice) || null : null,
        featuredOnProfile, altText: altText.trim() || null,
        feeling: feeling ? { emoji: feeling.emoji, label: feeling.label } : null,
        taggedUserIds: taggedPeople.map(u => u.id),
        location: location ? { lat: location.lat, lng: location.lng, label: location.label } : null,
        isPublished: publishNow && !isScheduled,
        scheduledFor: isScheduled ? scheduledFor.toISOString() : null,
        timezone, dropCountdownMsg: dropMsg || null,
        callToAction: ctaType ? { type: ctaType, label: ctaLabel, url: ctaUrl } : null,
      };
      formData.append('data', JSON.stringify(payload));
      await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to post. Try again.');
      setLoading(false);
    }
  }

  const selVis = VISIBILITY_OPTIONS.find(v => v.key === visibility);
  const selRating = CONTENT_RATINGS.find(r => r.key === contentRating);
  const activeBg = BG_THEMES.find(t => t.key === bgTheme);
  const isTextOnly = !hasMedia;

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={24} color="#F8FAFC" /></TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.draftBtn} onPress={() => handleSubmit(false)}><Text style={styles.draftBtnText}>Draft</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.shareBtn, loading && styles.shareBtnOff]} onPress={() => handleSubmit(true)} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.shareBtnText}>{isScheduled ? 'Schedule' : 'Post'}</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 48 }} showsVerticalScrollIndicator={false}>

        {isTextOnly ? (
          <TouchableOpacity onPress={() => setPickerSheet(true)} activeOpacity={0.85}>
            <View style={styles.textPostArea}>
              {activeBg && activeBg.gradient ? <LinearGradient colors={activeBg.gradient} style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111118' }]} />}
              {caption.length > 0
                ? <Text style={[styles.textPostPreview, activeBg && { color: '#fff' }]}>{caption}</Text>
                : (
                  <View style={styles.addMediaPrompt}>
                    <View style={styles.addMediaBtns}>
                      <View style={styles.addMediaIcon}><Ionicons name="camera-outline" size={26} color="#7C3AED" /></View>
                      <View style={styles.addMediaIcon}><Ionicons name="images-outline" size={26} color="#06B6D4" /></View>
                      <View style={styles.addMediaIcon}><Ionicons name="videocam-outline" size={26} color="#10B981" /></View>
                    </View>
                    <Text style={styles.addMediaLabel}>{"Tap to take a photo, record a video,\nor choose from your gallery"}</Text>
                  </View>
                )}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setPickerSheet(true)} activeOpacity={1}>
            <MediaPreviewStrip media={media} onRemove={removeItem} onAdd={() => setPickerSheet(true)} canAddMore={canAddMore} picking={picking} />
          </TouchableOpacity>
        )}

        {isTextOnly && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bgRow}>
            {BG_THEMES.map(t => (
              <TouchableOpacity key={String(t.key)} style={[styles.bgSwatch, bgTheme === t.key && styles.bgSwatchActive]} onPress={() => setBgTheme(t.key)}>
                {t.gradient ? <LinearGradient colors={t.gradient} style={styles.bgGradient} /> : <View style={[styles.bgGradient, { backgroundColor: '#111118', borderWidth: 1, borderColor: '#333' }]}><Ionicons name="close" size={12} color="#666" /></View>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.contextBar}>
          <TouchableOpacity style={[styles.contextBtn, feeling && styles.contextBtnActive]} onPress={() => setShowFeeling(true)}>
            <Text style={styles.ctxEmoji}>{feeling ? feeling.emoji : '\u{1F60A}'}</Text>
            <Text style={[styles.ctxText, feeling && styles.ctxTextActive]}>{feeling ? feeling.label : 'Feeling'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contextBtn, taggedPeople.length > 0 && styles.contextBtnActive]} onPress={() => setShowTagPeople(true)}>
            <Ionicons name="people-outline" size={15} color={taggedPeople.length > 0 ? '#7C3AED' : '#94A3B8'} />
            <Text style={[styles.ctxText, taggedPeople.length > 0 && styles.ctxTextActive]}>{taggedPeople.length > 0 ? taggedPeople.length + ' Tagged' : 'Tag People'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contextBtn, location && styles.contextBtnActive]} onPress={handleAddLocation}>
            {locationLoading ? <ActivityIndicator size="small" color="#7C3AED" /> : <Ionicons name="location-outline" size={15} color={location ? '#7C3AED' : '#94A3B8'} />}
            <Text style={[styles.ctxText, location && styles.ctxTextActive]} numberOfLines={1}>{location ? location.label.split(',')[0] : 'Location'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.captionArea}>
          <TextInput
            style={[styles.captionInput, isTextOnly && activeBg && activeBg.gradient && { fontSize: 20, textAlign: 'center', fontWeight: '600' }]}
            placeholder={isTextOnly ? "What's on your mind?" : 'Write a caption...'}
            placeholderTextColor="#94A3B8"
            value={caption} onChangeText={setCaption} multiline maxLength={2200}
          />
          <View style={styles.captionMeta}>
            <View style={styles.hashtagBtn}><Ionicons name="pricetag-outline" size={14} color="#7C3AED" /><Text style={styles.hashtagBtnTxt}>#</Text></View>
            <Text style={styles.charCount}>{caption.length}/2200</Text>
          </View>
          <TextInput style={styles.hashtagInput} placeholder="#gaming #clips #venture #fyp" placeholderTextColor="#94A3B8" value={hashtags} onChangeText={setHashtags} />
        </View>

        {hasMedia && <Section title="Accessibility"><TextInput style={styles.input} placeholder="Alt text for screen readers..." placeholderTextColor="#94A3B8" value={altText} onChangeText={setAltText} maxLength={200} /></Section>}

        <Section title="Game Tag">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {GAMES.map(g => (<TouchableOpacity key={g} style={[styles.chip, game === g && styles.chipActive]} onPress={() => setGame(game === g ? '' : g)}><Text style={[styles.chipText, game === g && styles.chipTextActive]}>{g}</Text></TouchableOpacity>))}
          </ScrollView>
        </Section>

        <Section title="Who Can See This">
          {VISIBILITY_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.key} style={[styles.optRow, visibility === opt.key && styles.optRowActive]} onPress={() => setVisibility(opt.key)}>
              <View style={[styles.optIcon, visibility === opt.key && styles.optIconActive]}><Ionicons name={opt.icon} size={16} color={visibility === opt.key ? '#7C3AED' : '#94A3B8'} /></View>
              <View style={{ flex: 1 }}><Text style={[styles.optLabel, visibility === opt.key && styles.optLabelActive]}>{opt.label}</Text><Text style={styles.optSub}>{opt.sub}</Text></View>
              {visibility === opt.key && <Ionicons name="checkmark-circle" size={18} color="#7C3AED" />}
            </TouchableOpacity>
          ))}
        </Section>

        <Section title="Audience Settings">
          <View style={styles.ratingRow}>
            {CONTENT_RATINGS.map(r => (<TouchableOpacity key={r.key} style={[styles.ratingChip, contentRating === r.key && { borderColor: r.color, backgroundColor: r.color + '18' }]} onPress={() => setContentRating(r.key)}><Ionicons name={r.icon} size={15} color={contentRating === r.key ? r.color : '#94A3B8'} /><Text style={[styles.ratingText, contentRating === r.key && { color: r.color }]}>{r.label}</Text></TouchableOpacity>))}
          </View>
          <View style={styles.switchCard}><SwitchRow label="Made for Kids" sub="Disables comments and monetization" value={madeForKids} onPress={handleMadeForKids} /><SwitchRow label="Age Restricted (18+)" sub="Viewers confirm age to watch" value={ageRestricted} onPress={setAgeRestricted} disabled={madeForKids} last /></View>
        </Section>

        <Section title="Publish Settings">
          <View style={styles.switchCard}><SwitchRow label="Schedule Drop" sub={isScheduled ? scheduledFor.toLocaleDateString() + ' at ' + scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set a specific date and time'} value={isScheduled} onPress={setIsScheduled} last /></View>
          {isScheduled && (<View style={styles.scheduleBox}>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={17} color="#7C3AED" />
              <Text style={styles.dateBtnText}>{scheduledFor.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + '  \u00b7  ' + scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
            </TouchableOpacity>
            <Text style={styles.timezoneNote}>Timezone: {timezone}</Text>
            <TextInput style={styles.input} placeholder='Countdown message e.g. "Dropping Saturday night"' placeholderTextColor="#94A3B8" value={dropMsg} onChangeText={setDropMsg} maxLength={80} />
            {showDatePicker && <DateTimePicker value={scheduledFor} mode="datetime" minimumDate={new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) setScheduledFor(d); }} themeVariant="dark" />}
          </View>)}
        </Section>

        <Section title="Comments and Interaction">
          <View style={styles.commentRow}>
            {[['OPEN','chatbubbles-outline','Open'],['REVIEW','eye-outline','Review First'],['DISABLED','close-circle-outline','Off']].map(([key, icon, label]) => (
              <TouchableOpacity key={key} style={[styles.commentChip, commentsMode === key && styles.commentChipActive, madeForKids && key !== 'DISABLED' && { opacity: 0.4 }]} onPress={() => !madeForKids && setCommentsMode(key)}>
                <Ionicons name={icon} size={15} color={commentsMode === key ? '#7C3AED' : '#94A3B8'} />
                <Text style={[styles.commentChipText, commentsMode === key && styles.commentChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {commentsMode === 'REVIEW' && <Text style={styles.reviewNote}>Comments go to your review queue before appearing publicly.</Text>}
          <View style={styles.switchCard}><SwitchRow label="Allow Duets" sub="Others can create side-by-side duets" value={allowDuet} onPress={setAllowDuet} /><SwitchRow label="Allow Remixes" sub="Others can remix and share" value={allowRemix} onPress={setAllowRemix} last /></View>
        </Section>

        <Section title="Monetization">
          <View style={styles.switchCard}><SwitchRow label="Enable Tips" sub="Viewers can send tips" value={tipsEnabled && !madeForKids} onPress={v => !madeForKids && setTipsEnabled(v)} disabled={madeForKids} /><SwitchRow label="Subscribers Only" sub="Only paid subscribers can view" value={isExclusive} onPress={v => { setIsExclusive(v); if (v) setPaidUnlock(false); }} /><SwitchRow label="Paid Unlock" sub="One-time price to unlock" value={paidUnlock} onPress={v => { setPaidUnlock(v); if (v) setIsExclusive(false); }} last /></View>
          {paidUnlock && (<View style={styles.priceRow}><Text style={styles.priceSym}>$</Text><TextInput style={styles.priceInput} placeholder="0.99" placeholderTextColor="#94A3B8" value={paidUnlockPrice} onChangeText={setPaidUnlockPrice} keyboardType="decimal-pad" /><Text style={styles.priceSub}>min $0.99 · 85% to you</Text></View>)}
        </Section>

        <Section title="Distribution">
          <View style={styles.switchCard}><SwitchRow label="Featured on Profile" sub="Pinned at top of your profile grid" value={featuredOnProfile} onPress={setFeaturedOnProfile} last /></View>
          <Text style={styles.subLabel}>End Screen Call to Action</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <TouchableOpacity style={[styles.chip, !ctaType && styles.chipActive]} onPress={() => setCtaType('')}><Text style={[styles.chipText, !ctaType && styles.chipTextActive]}>None</Text></TouchableOpacity>
            {CTA_TYPES.map(c => (<TouchableOpacity key={c.key} style={[styles.chip, ctaType === c.key && styles.chipActive]} onPress={() => setCtaType(c.key)}><Ionicons name={c.icon} size={13} color={ctaType === c.key ? '#7C3AED' : '#94A3B8'} /><Text style={[styles.chipText, ctaType === c.key && styles.chipTextActive]}>{c.label}</Text></TouchableOpacity>))}
          </ScrollView>
          {ctaType === 'VISIT_LINK' && <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="https://..." placeholderTextColor="#94A3B8" value={ctaUrl} onChangeText={setCtaUrl} keyboardType="url" autoCapitalize="none" />}
          {ctaType && <TextInput style={[styles.input, { marginTop: 6 }]} placeholder="Button label (e.g. Subscribe for more)" placeholderTextColor="#94A3B8" value={ctaLabel} onChangeText={setCtaLabel} maxLength={40} />}
        </Section>

        <View style={styles.summaryBar}>
          <View style={styles.summaryPill}><Ionicons name={selVis?.icon ?? 'earth-outline'} size={11} color="#94A3B8" /><Text style={styles.summaryText}>{selVis?.label}</Text></View>
          <View style={styles.summaryPill}><Ionicons name={selRating?.icon ?? 'happy-outline'} size={11} color={selRating?.color ?? '#10B981'} /><Text style={[styles.summaryText, { color: selRating?.color }]}>{selRating?.label}</Text></View>
          {isScheduled && <View style={styles.summaryPill}><Ionicons name="calendar-outline" size={11} color="#7C3AED" /><Text style={[styles.summaryText, { color: '#7C3AED' }]}>{scheduledFor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text></View>}
          {feeling && <View style={styles.summaryPill}><Text style={{ fontSize: 11 }}>{feeling.emoji}</Text><Text style={styles.summaryText}>{feeling.label}</Text></View>}
          {location && <View style={styles.summaryPill}><Ionicons name="location-outline" size={11} color="#94A3B8" /><Text style={styles.summaryText}>{location.label.split(',')[0]}</Text></View>}
          {taggedPeople.length > 0 && <View style={styles.summaryPill}><Ionicons name="people-outline" size={11} color="#94A3B8" /><Text style={styles.summaryText}>{taggedPeople.length} tagged</Text></View>}
        </View>

      </ScrollView>

      <MediaPickerSheet visible={pickerSheet} onClose={() => setPickerSheet(false)} onCameraPhoto={() => openCamera('photo')} onCameraVideo={() => openCamera('video')} onGallery={() => openGallery()} loading={picking} hasMedia={hasMedia} onRemoveAll={clear} mode="all" />
      <FeelingActivityPicker visible={showFeeling} current={feeling} onSelect={setFeeling} onClose={() => setShowFeeling(false)} />
      <TagPeopleSheet visible={showTagPeople} tagged={taggedPeople} onSave={setTaggedPeople} onClose={() => setShowTagPeople(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  draftBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: '#1E293B' },
  draftBtnText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  shareBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16 },
  shareBtnOff: { opacity: 0.4 },
  shareBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  textPostArea: { height: 200, marginHorizontal: 16, marginVertical: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: '#1E293B', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  textPostPreview: { color: '#F8FAFC', fontSize: 18, textAlign: 'center', paddingHorizontal: 24 },
  addMediaPrompt: { alignItems: 'center', gap: 12 },
  addMediaBtns: { flexDirection: 'row', gap: 12 },
  addMediaIcon: { width: 58, height: 58, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1E293B' },
  addMediaLabel: { color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  bgRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  bgSwatch: { width: 36, height: 36, borderRadius: 10 },
  bgSwatchActive: { transform: [{ scale: 1.2 }] },
  bgGradient: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  contextBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderTopWidth: 0.5, borderTopColor: '#1E293B' },
  contextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10, backgroundColor: '#111118', borderWidth: 1, borderColor: '#1E293B' },
  contextBtnActive: { borderColor: 'rgba(124,58,237,0.5)', backgroundColor: 'rgba(124,58,237,0.1)' },
  ctxEmoji: { fontSize: 15 },
  ctxText: { color: '#94A3B8', fontSize: 11, fontWeight: '500' },
  ctxTextActive: { color: '#7C3AED', fontWeight: '600' },
  captionArea: { paddingHorizontal: 16, paddingTop: 10 },
  captionInput: { color: '#F8FAFC', fontSize: 15, minHeight: 80, textAlignVertical: 'top', lineHeight: 22 },
  captionMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  hashtagBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hashtagBtnTxt: { color: '#7C3AED', fontSize: 12, fontWeight: '700' },
  charCount: { color: '#64748B', fontSize: 11 },
  hashtagInput: { color: '#94A3B8', fontSize: 13, borderTopWidth: 0.5, borderTopColor: '#1E293B', paddingTop: 8, marginTop: 6 },
  section: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, borderTopWidth: 0.5, borderTopColor: '#1E293B', marginTop: 8 },
  sectionTitle: { color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  subLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: '#1E293B', backgroundColor: '#111118' },
  chipActive: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: '#7C3AED' },
  chipText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#7C3AED' },
  input: { backgroundColor: '#111118', borderRadius: 10, borderWidth: 1, borderColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 10, color: '#F8FAFC', fontSize: 14 },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: 'transparent' },
  optRowActive: { backgroundColor: 'rgba(124,58,237,0.1)', borderColor: 'rgba(124,58,237,0.4)' },
  optIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#111118', alignItems: 'center', justifyContent: 'center' },
  optIconActive: { backgroundColor: 'rgba(124,58,237,0.2)' },
  optLabel: { color: '#94A3B8', fontSize: 14 },
  optLabelActive: { color: '#F8FAFC', fontWeight: '600' },
  optSub: { color: '#64748B', fontSize: 12, marginTop: 1 },
  ratingRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  ratingChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#1E293B' },
  ratingText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  switchCard: { backgroundColor: '#111118', borderRadius: 12, borderWidth: 1, borderColor: '#1E293B', overflow: 'hidden' },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  switchInfo: { flex: 1 },
  switchLabel: { color: '#F8FAFC', fontSize: 14, fontWeight: '500' },
  switchSub: { color: '#64748B', fontSize: 12, marginTop: 1 },
  switchDivider: { height: 0.5, backgroundColor: '#1E293B', marginLeft: 16 },
  scheduleBox: { marginTop: 10, gap: 8 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#111118', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(124,58,237,0.6)' },
  dateBtnText: { flex: 1, color: '#7C3AED', fontSize: 14, fontWeight: '600' },
  timezoneNote: { color: '#64748B', fontSize: 11 },
  commentRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  commentChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#1E293B' },
  commentChipActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.15)' },
  commentChipText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  commentChipTextActive: { color: '#7C3AED' },
  reviewNote: { color: '#64748B', fontSize: 12, lineHeight: 16, marginBottom: 10, padding: 10, backgroundColor: '#111118', borderRadius: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  priceSym: { color: '#F8FAFC', fontSize: 22, fontWeight: '700' },
  priceInput: { width: 80, backgroundColor: '#111118', borderRadius: 10, borderWidth: 1, borderColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 10, color: '#F8FAFC', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  priceSub: { flex: 1, color: '#64748B', fontSize: 12 },
  summaryBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginHorizontal: 16, marginTop: 8, padding: 12, backgroundColor: '#111118', borderRadius: 12, borderWidth: 1, borderColor: '#1E293B' },
  summaryPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0A0A0F', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: '#1E293B' },
  summaryText: { color: '#94A3B8', fontSize: 11 },
});
