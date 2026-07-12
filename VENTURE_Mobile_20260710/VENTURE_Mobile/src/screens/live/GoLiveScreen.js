/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';

const GAMES = ['Fortnite', 'Valorant', 'Apex Legends', 'Warzone', 'Minecraft', 'League of Legends', 'Rocket League', 'Other'];

export default function GoLiveScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [game, setGame] = useState('');
  const [tags, setTags] = useState('');
  const [superchatEnabled, setSuperchatEnabled] = useState(true);
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  const startStream = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/live/start', { title: title.trim(), game, tags: tags.split(',').map(t => t.trim()).filter(Boolean), superchatEnabled, subscriberOnly });
      navigation.replace('LiveStream', { streamId: res.data?.stream?.id || 'stream_1', isStreamer: true });
    } catch (_) {
      navigation.replace('LiveStream', { streamId: 'stream_1', isStreamer: true });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Go Live</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Camera preview placeholder */}
        <View style={styles.cameraPreview}>
          <LinearGradient colors={['#1a0533', '#0d1b3e']} style={StyleSheet.absoluteFill} />
          <View style={styles.cameraIcon}><Ionicons name="videocam-outline" size={48} color="rgba(255,255,255,0.3)" /></View>
          <Text style={styles.cameraText}>Camera preview</Text>
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.camBtn}><Ionicons name="camera-reverse-outline" size={22} color="#fff" /></TouchableOpacity>
            <TouchableOpacity style={styles.camBtn}><Ionicons name="mic-outline" size={22} color="#fff" /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Stream Title *</Text>
            <TextInput style={styles.input} placeholder="What are you playing?" placeholderTextColor={Colors.textMuted} value={title} onChangeText={setTitle} maxLength={100} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Game</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {GAMES.map(g => (
                <TouchableOpacity key={g} style={[styles.gameChip, game === g && styles.gameChipActive]} onPress={() => setGame(g)}>
                  <Text style={[styles.gameChipText, game === g && styles.gameChipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Tags (comma separated)</Text>
            <TextInput style={styles.input} placeholder="FPS, Ranked, Competitive" placeholderTextColor={Colors.textMuted} value={tags} onChangeText={setTags} />
          </View>

          <View style={styles.switchSection}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}><Text style={styles.switchLabel}>Enable Super Chats</Text><Text style={styles.switchSub}>Viewers can send highlighted messages</Text></View>
              <Switch value={superchatEnabled} onValueChange={setSuperchatEnabled} trackColor={{ true: Colors.primary }} thumbColor="#fff" />
            </View>
            <View style={[styles.switchRow, { borderTopWidth: 0.5, borderTopColor: Colors.border }]}>
              <View style={styles.switchInfo}><Text style={styles.switchLabel}>Subscriber Only Chat</Text><Text style={styles.switchSub}>Only paid subscribers can chat</Text></View>
              <Switch value={subscriberOnly} onValueChange={setSubscriberOnly} trackColor={{ true: Colors.primary }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.goLiveBtn, (!title.trim() || loading) && styles.goLiveBtnOff]}
          onPress={startStream}
          disabled={!title.trim() || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <>
            <View style={styles.liveDot} />
            <Text style={styles.goLiveBtnText}>Start Streaming</Text>
          </>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700' },
  cameraPreview: { height: 220, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  cameraIcon: { alignItems: 'center', gap: 8 },
  cameraText: { color: 'rgba(255,255,255,0.4)', fontSize: Typography.sizes.sm, marginTop: 8 },
  cameraControls: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', gap: 8 },
  camBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  form: { padding: Spacing.base, gap: 16 },
  field: { gap: 8 },
  fieldLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 10, color: Colors.textPrimary, fontSize: Typography.sizes.sm },
  gameChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  gameChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  gameChipText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  gameChipTextActive: { color: '#fff' },
  switchSection: { backgroundColor: Colors.backgroundCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 12 },
  switchInfo: { flex: 1 },
  switchLabel: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '500' },
  switchSub: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 1 },
  goLiveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: Spacing.base, paddingVertical: 16, backgroundColor: Colors.danger, borderRadius: 16 },
  goLiveBtnOff: { opacity: 0.4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  goLiveBtnText: { color: '#fff', fontSize: Typography.sizes.md, fontWeight: '800' },
});
