/**
 * ============================================================
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  This software is the exclusive intellectual property of
 *  DivineDemonGaming Inc. Unauthorized copying, distribution,
 *  modification, or use of this software, in whole or in part,
 *  is strictly prohibited without written permission from
 *  DivineDemonGaming Inc.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 * ============================================================
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import VentureButton from '../../components/common/VentureButton';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { importAPI } from '../../services/api';

const PLATFORM_ICONS = {
  youtube: { icon: 'logo-youtube', color: '#FF0000', component: 'Ionicons' },
  twitch: { icon: 'logo-twitch', color: '#9147FF', component: 'Ionicons' },
  twitter: { icon: 'logo-twitter', color: '#1DA1F2', component: 'Ionicons' },
  instagram: { icon: 'logo-instagram', color: '#E1306C', component: 'Ionicons' },
  tiktok: { icon: 'musical-notes', color: '#FFF', component: 'Ionicons' },
};

export default function ImportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [platforms, setPlatforms] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [importType, setImportType] = useState('followers');
  const [loading, setLoading] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeJob?.status === 'processing') {
      const interval = setInterval(async () => {
        try {
          const { data } = await importAPI.getStatus(activeJob.id);
          setActiveJob(data);
          Animated.timing(progressAnim, { toValue: data.progress / 100, duration: 500, useNativeDriver: false }).start();
          if (data.status === 'complete' || data.status === 'failed') {
            clearInterval(interval);
            if (data.status === 'complete') {
              Alert.alert('Import Complete!', `Successfully imported content from ${data.platform}. Check your profile to see your imported posts.`);
            }
          }
        } catch { clearInterval(interval); }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeJob?.status]);

  const loadData = async () => {
    try {
      const [platformsRes, historyRes] = await Promise.all([
        importAPI.getPlatforms(),
        importAPI.getHistory()
      ]);
      setPlatforms(platformsRes.data.platforms || []);
      setJobs(historyRes.data || []);
    } catch (err) { console.error(err); }
  };

  const handleStartImport = async () => {
    if (!selectedPlatform) return Alert.alert('Select Platform', 'Please select a platform to import from');
    setLoading(true);
    try {
      const { data } = await importAPI.start({
        platform: selectedPlatform,
        config: { importType }
      });
      setActiveJob(data);
      progressAnim.setValue(0);
      loadData();
    } catch (err) {
      Alert.alert('Import Failed', err.response?.data?.error || 'Failed to start import');
    } finally { setLoading(false); }
  };

  const IMPORT_TYPES = [
    { id: 'followers', label: 'Followers/Subscribers', icon: 'people', desc: 'Invite your existing audience to follow you on VENTURE' },
    { id: 'posts', label: 'Posts & Photos', icon: 'images', desc: 'Import your existing content library' },
    { id: 'videos', label: 'Videos', icon: 'videocam', desc: 'Import uploaded videos and clips' },
    { id: 'all', label: 'Everything', icon: 'download', desc: 'Full account migration — posts, followers, videos' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Community</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient colors={Colors.gradientAccent} style={styles.heroIcon}>
            <Ionicons name="git-merge-outline" size={36} color="#FFF" />
          </LinearGradient>
          <Text style={styles.heroTitle}>Bring Your Community to VENTURE</Text>
          <Text style={styles.heroSubtitle}>Start where you left off. Import followers, content, and more from your existing platforms in minutes.</Text>
        </View>

        {/* Active Job */}
        {activeJob && (activeJob.status === 'processing' || activeJob.status === 'pending') && (
          <View style={styles.activeJobCard}>
            <View style={styles.activeJobHeader}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.activeJobTitle}>Importing from {activeJob.platform}...</Text>
            </View>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
            </View>
            <Text style={styles.progressText}>{activeJob.progress}% complete</Text>
          </View>
        )}

        {/* Platform Select */}
        <Text style={styles.sectionTitle}>Select Platform</Text>
        <View style={styles.platformGrid}>
          {platforms.map(p => {
            const icon = PLATFORM_ICONS[p.id];
            const isSelected = selectedPlatform === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.platformCard, isSelected && styles.platformCardSelected]}
                onPress={() => setSelectedPlatform(p.id)}
                activeOpacity={0.8}
              >
                {isSelected && <View style={styles.platformCheckmark}><Ionicons name="checkmark" size={12} color="#FFF" /></View>}
                <Ionicons name={icon.icon} size={32} color={icon.color} />
                <Text style={styles.platformName}>{p.name}</Text>
                <Text style={styles.platformSupported}>{p.supported.join(', ')}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Import Type */}
        <Text style={styles.sectionTitle}>What to Import</Text>
        <View style={styles.importTypes}>
          {IMPORT_TYPES.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.importTypeCard, importType === t.id && styles.importTypeCardSelected]}
              onPress={() => setImportType(t.id)}
            >
              <LinearGradient
                colors={importType === t.id ? Colors.gradientPrimary : [Colors.surface, Colors.surface]}
                style={styles.importTypeIcon}
              >
                <Ionicons name={t.icon} size={20} color={importType === t.id ? '#FFF' : Colors.textMuted} />
              </LinearGradient>
              <View style={styles.importTypeText}>
                <Text style={[styles.importTypeLabel, importType === t.id && styles.importTypeLabelActive]}>{t.label}</Text>
                <Text style={styles.importTypeDesc}>{t.desc}</Text>
              </View>
              {importType === t.id && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Instructions by platform */}
        {selectedPlatform && (
          <View style={styles.instructionsCard}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.accent} />
            <View style={styles.instructionsText}>
              <Text style={styles.instructionsTitle}>How to Import from {platforms.find(p => p.id === selectedPlatform)?.name}</Text>
              <Text style={styles.instructionsDesc}>
                {selectedPlatform === 'youtube' && '1. Go to YouTube Studio\n2. Download your data from "Data & Privacy"\n3. Upload the JSON file here'}
                {selectedPlatform === 'twitch' && '1. Connect your Twitch account in Settings\n2. We\'ll import your followers and clips automatically'}
                {selectedPlatform === 'instagram' && '1. Go to Instagram Settings → Privacy → Download Data\n2. Request your data and upload the ZIP here'}
                {selectedPlatform === 'twitter' && '1. Go to Twitter Settings → Your Account → Download Archive\n2. Upload the archive ZIP here'}
                {selectedPlatform === 'tiktok' && '1. Go to TikTok Settings → Privacy → Download Your Data\n2. Request your data and upload here'}
              </Text>
            </View>
          </View>
        )}

        {/* CSV Upload for followers */}
        <TouchableOpacity style={styles.uploadCard} onPress={() => {
          Alert.alert('Upload Follower List', 'Upload a CSV or JSON file with your follower list from any platform');
        }}>
          <Ionicons name="cloud-upload-outline" size={24} color={Colors.accent} />
          <Text style={styles.uploadText}>Upload Follower List (CSV/JSON)</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        <VentureButton
          title={loading ? 'Starting Import...' : 'Start Import'}
          onPress={handleStartImport}
          loading={loading}
          fullWidth size="lg"
          style={styles.importBtn}
        />

        {/* Import History */}
        {jobs.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Import History</Text>
            {jobs.map(job => (
              <View key={job.id} style={styles.jobCard}>
                <Ionicons
                  name={PLATFORM_ICONS[job.platform]?.icon || 'globe-outline'}
                  size={20}
                  color={PLATFORM_ICONS[job.platform]?.color || Colors.textMuted}
                />
                <View style={styles.jobInfo}>
                  <Text style={styles.jobPlatform}>{job.platform}</Text>
                  <Text style={styles.jobDate}>{new Date(job.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.jobStatus, job.status === 'complete' && styles.jobStatusDone, job.status === 'failed' && styles.jobStatusFailed]}>
                  <Text style={styles.jobStatusText}>{job.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  scroll: { padding: Spacing.base, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: Spacing.xl },
  heroIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base },
  heroTitle: { color: Colors.textPrimary, fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, textAlign: 'center', marginBottom: Spacing.sm },
  heroSubtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.md, textAlign: 'center', lineHeight: 22 },
  activeJobCard: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.primary + '40' },
  activeJobHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  activeJobTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: Colors.surface, borderRadius: 3, overflow: 'hidden', marginBottom: Spacing.xs },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  progressText: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, marginBottom: Spacing.md, marginTop: Spacing.md },
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  platformCard: { width: '30%', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, borderWidth: 1.5, borderColor: Colors.border, position: 'relative' },
  platformCardSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(124,58,237,0.1)' },
  platformCheckmark: { position: 'absolute', top: 6, right: 6, backgroundColor: Colors.primary, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  platformName: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  platformSupported: { color: Colors.textMuted, fontSize: 9, textAlign: 'center' },
  importTypes: { gap: Spacing.sm, marginBottom: Spacing.xl },
  importTypeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.base, gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.border },
  importTypeCardSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(124,58,237,0.1)' },
  importTypeIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  importTypeText: { flex: 1 },
  importTypeLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.md, fontWeight: '600' },
  importTypeLabelActive: { color: Colors.textPrimary },
  importTypeDesc: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 2 },
  instructionsCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(6,182,212,0.1)', borderRadius: BorderRadius.lg, padding: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.accent + '40' },
  instructionsText: { flex: 1 },
  instructionsTitle: { color: Colors.accent, fontSize: Typography.sizes.sm, fontWeight: '700', marginBottom: Spacing.xs },
  instructionsDesc: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, lineHeight: 20 },
  uploadCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.base, gap: Spacing.md, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  uploadText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.sizes.md, fontWeight: '500' },
  importBtn: { marginBottom: Spacing.xl },
  historySection: {},
  jobCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.sm, gap: Spacing.md },
  jobInfo: { flex: 1 },
  jobPlatform: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '600', textTransform: 'capitalize' },
  jobDate: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  jobStatus: { backgroundColor: Colors.surface, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  jobStatusDone: { backgroundColor: 'rgba(16,185,129,0.2)' },
  jobStatusFailed: { backgroundColor: 'rgba(239,68,68,0.2)' },
  jobStatusText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600', textTransform: 'uppercase' },
});
