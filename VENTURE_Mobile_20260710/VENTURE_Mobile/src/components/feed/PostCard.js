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
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Share
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import moment from 'moment';
import Avatar from '../common/Avatar';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { postsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function PostCard({ post, onPress, onProfilePress, onLikeChange }) {
  const [liked, setLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(post.bookmarked || false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = useCallback(async () => {
    if (isLiking) return;
    setIsLiking(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    try {
      await postsAPI.like(post.id);
      onLikeChange?.(post.id, newLiked);
    } catch {
      setLiked(!newLiked);
      setLikesCount(prev => newLiked ? prev - 1 : prev + 1);
    } finally { setIsLiking(false); }
  }, [liked, isLiking, post.id]);

  const handleBookmark = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookmarked(b => !b);
    postsAPI.bookmark(post.id).catch(() => setBookmarked(b => !b));
  };

  const handleShare = async () => {
    await Share.share({
      message: `Check out this post on VENTURE: ${post.content?.slice(0, 100) || 'Media post'}`,
      url: `venture://post/${post.id}`
    });
  };

  const hasMedia = post.mediaUrls?.length > 0;
  const isVideo = post.mediaTypes?.[0] === 'video';

  return (
    <TouchableOpacity
      style={[styles.card, Shadows.sm]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.authorRow} onPress={onProfilePress} activeOpacity={0.8}>
          <Avatar user={post.author} size="md" showLive showOnline />
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{post.author?.displayName}</Text>
              {post.author?.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} style={styles.verifiedIcon} />
              )}
              {post.author?.isCreator && (
                <LinearGradient colors={Colors.gradientPrimary} style={styles.creatorBadge}>
                  <Text style={styles.creatorBadgeText}>CREATOR</Text>
                </LinearGradient>
              )}
            </View>
            <Text style={styles.username}>@{post.author?.username} · {moment(post.createdAt).fromNow()}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Game tag */}
      {post.gameTag && (
        <View style={styles.gameTag}>
          <Ionicons name="game-controller" size={12} color={Colors.accent} />
          <Text style={styles.gameTagText}>{post.gameTag}</Text>
        </View>
      )}

      {/* Content */}
      {post.content && (
        <Text style={styles.content} numberOfLines={6}>{post.content}</Text>
      )}

      {/* Media */}
      {hasMedia && (
        <View style={styles.mediaContainer}>
          {post.mediaUrls.length === 1 ? (
            <View style={styles.singleMedia}>
              <Image
                source={{ uri: post.mediaUrls[0] }}
                style={styles.singleImage}
                contentFit="cover"
              />
              {isVideo && (
                <View style={styles.playOverlay}>
                  <Ionicons name="play-circle" size={56} color="rgba(255,255,255,0.9)" />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.mediaGrid}>
              {post.mediaUrls.slice(0, 4).map((url, i) => (
                <View key={i} style={[styles.gridItem, post.mediaUrls.length === 3 && i === 0 && styles.gridItemLarge]}>
                  <Image source={{ uri: url }} style={styles.gridImage} contentFit="cover" />
                  {i === 3 && post.mediaUrls.length > 4 && (
                    <View style={styles.moreOverlay}>
                      <Text style={styles.moreOverlayText}>+{post.mediaUrls.length - 4}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <View style={styles.tags}>
          {post.tags.slice(0, 4).map(tag => (
            <TouchableOpacity key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? Colors.danger : Colors.textSecondary}
          />
          <Text style={[styles.actionCount, liked && styles.actionCountLiked]}>{formatCount(likesCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.actionCount}>{formatCount(post.commentsCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Ionicons name="arrow-redo-outline" size={22} color={Colors.textSecondary} />
          <Text style={styles.actionCount}>{formatCount(post.sharesCount)}</Text>
        </TouchableOpacity>

        <View style={styles.actionsSpacer} />

        <TouchableOpacity style={styles.actionBtn} onPress={handleBookmark}>
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={bookmarked ? Colors.primary : Colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={styles.viewCount}>
          <Ionicons name="eye-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.viewCountText}>{formatCount(post.viewsCount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const formatCount = (n) => {
  if (!n) return '0';
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
  return n.toString();
};

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, marginHorizontal: Spacing.base, marginBottom: Spacing.md, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  authorRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  authorInfo: { marginLeft: Spacing.sm, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  displayName: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },
  verifiedIcon: { marginLeft: 4 },
  creatorBadge: { marginLeft: 6, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  creatorBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  username: { color: Colors.textMuted, fontSize: Typography.sizes.sm, marginTop: 1 },
  moreBtn: { padding: Spacing.sm },
  gameTag: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base, marginBottom: Spacing.sm, backgroundColor: Colors.surface, alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  gameTagText: { color: Colors.accent, fontSize: Typography.sizes.xs, fontWeight: '600', marginLeft: 4 },
  content: { color: Colors.textPrimary, fontSize: Typography.sizes.md, lineHeight: 22, marginHorizontal: Spacing.base, marginBottom: Spacing.sm },
  mediaContainer: { marginHorizontal: Spacing.base, marginBottom: Spacing.sm, borderRadius: BorderRadius.md, overflow: 'hidden' },
  singleMedia: { position: 'relative' },
  singleImage: { width: '100%', height: width * 0.75, borderRadius: BorderRadius.md },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  gridItem: { width: (width - 32 - 2) / 2, height: (width - 32 - 2) / 2, position: 'relative', overflow: 'hidden', borderRadius: BorderRadius.sm },
  gridItemLarge: { width: '100%', height: width * 0.4 },
  gridImage: { width: '100%', height: '100%' },
  moreOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  moreOverlayText: { color: '#FFF', fontSize: Typography.sizes.xl, fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: Spacing.base, marginBottom: Spacing.sm, gap: 6 },
  tag: { backgroundColor: 'rgba(124,58,237,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.sm },
  tagText: { color: Colors.primaryLight, fontSize: Typography.sizes.sm, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: Spacing.base },
  actionCount: { color: Colors.textMuted, fontSize: Typography.sizes.sm, marginLeft: 4 },
  actionCountLiked: { color: Colors.danger },
  actionsSpacer: { flex: 1 },
  viewCount: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewCountText: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
});
