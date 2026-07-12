/**
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 *
 * PostDetailScreen — Full post view with comments, likes, bookmarks.
 * Opened from HomeScreen, ExploreScreen, ProfileScreen grids.
 *
 * route.params: { postId }
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import moment from 'moment';
import Avatar from '../../components/common/Avatar';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { postsAPI, usersAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function PostDetailScreen({ navigation, route }) {
  const { postId } = route.params || {};
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const commentInputRef = useRef(null);

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [replyTo, setReplyTo] = useState(null); // { commentId, username }

  // ── Load post ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!postId) return;
    const load = async () => {
      try {
        const { data } = await postsAPI.getById(postId);
        setPost(data);
        setLiked(data.liked || false);
        setLikesCount(data.likesCount || 0);
        setBookmarked(data.bookmarked || false);
      } catch {
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [postId]);

  // ── Load comments ─────────────────────────────────────────────────────────
  const loadComments = useCallback(async (reset = false) => {
    if (!postId || commentsLoading) return;
    setCommentsLoading(true);
    try {
      const { data } = await postsAPI.getComments(postId, { cursor: reset ? null : cursor, limit: 20 });
      const items = data.comments || data || [];
      setComments(prev => reset ? items : [...prev, ...items]);
      setCursor(data.nextCursor || null);
      setHasMoreComments(!!data.nextCursor);
    } catch {
      // Keep existing comments on error
    } finally {
      setCommentsLoading(false);
    }
  }, [postId, cursor, commentsLoading]);

  useEffect(() => {
    if (!loading) loadComments(true);
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Like ─────────────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !liked;
    setLiked(next);
    setLikesCount(c => next ? c + 1 : c - 1);
    postsAPI.like(postId).catch(() => {
      setLiked(!next);
      setLikesCount(c => next ? c - 1 : c + 1);
    });
  }, [liked, postId]);

  // ── Bookmark ─────────────────────────────────────────────────────────────
  const handleBookmark = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookmarked(b => !b);
    postsAPI.bookmark(postId).catch(() => setBookmarked(b => !b));
  }, [postId]);

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    Share.share({
      message: post?.content?.slice(0, 120) || 'Check this out on VENTURE',
      url: `venture://post/${postId}`,
    }).catch(() => {});
  }, [post, postId]);

  // ── Submit comment ────────────────────────────────────────────────────────
  const submitComment = useCallback(async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const text = commentText.trim();
    setCommentText('');
    setReplyTo(null);
    try {
      const { data } = await postsAPI.comment(postId, { content: text, parentId: replyTo?.commentId });
      setComments(prev => [data, ...prev]);
    } catch {
      setCommentText(text); // restore on error
    } finally {
      setSubmitting(false);
    }
  }, [commentText, submitting, postId, replyTo]);

  // ── Navigate to video player ──────────────────────────────────────────────
  const handleWatchVideo = useCallback(() => {
    if (!post?.mediaUrls?.[0]) return;
    navigation.navigate('VideoPlayer', {
      videoUrl: post.mediaUrls[0],
      title: post.content?.slice(0, 60),
      creator: post.author,
      thumbnailUrl: post.thumbnailUrl,
      postId: post.id,
    });
  }, [post, navigation]);

  // ── Render comment ────────────────────────────────────────────────────────
  const renderComment = useCallback(({ item }) => (
    <View style={styles.comment}>
      <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { username: item.author?.username })}>
        <Avatar user={item.author} size="sm" />
      </TouchableOpacity>
      <View style={styles.commentBubble}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.author?.displayName || item.author?.username}</Text>
          {item.author?.isVerified && (
            <Ionicons name="checkmark-circle" size={12} color={Colors.primary} style={{ marginLeft: 4 }} />
          )}
          <Text style={styles.commentTime}>{moment(item.createdAt).fromNow()}</Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentLike} onPress={() => postsAPI.likeComment?.(item.id).catch(() => {})}>
            <Ionicons name="heart-outline" size={13} color={Colors.textMuted} />
            {item.likesCount > 0 && <Text style={styles.commentLikeCount}>{item.likesCount}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setReplyTo({ commentId: item.id, username: item.author?.username });
            commentInputRef.current?.focus();
          }}>
            <Text style={styles.replyBtn}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!post) return null;

  const isVideo = post.mediaTypes?.[0] === 'video';

  // ── Header component for FlatList ─────────────────────────────────────────
  const ListHeader = (
    <View>
      {/* Back button */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Post</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Author */}
      <View style={styles.authorRow}>
        <TouchableOpacity
          style={styles.authorLeft}
          onPress={() => navigation.navigate('UserProfile', { username: post.author?.username })}
        >
          <Avatar user={post.author} size="md" showLive showOnline />
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{post.author?.displayName || post.author?.username}</Text>
              {post.author?.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={styles.username}>@{post.author?.username} · {moment(post.createdAt).fromNow()}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.followBtn}>
          <Text style={styles.followBtnText}>Follow</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!!post.content && <Text style={styles.content}>{post.content}</Text>}

      {/* Media */}
      {post.mediaUrls?.length > 0 && (
        <TouchableOpacity
          style={styles.mediaContainer}
          onPress={isVideo ? handleWatchVideo : undefined}
          activeOpacity={isVideo ? 0.85 : 1}
        >
          <Image
            source={{ uri: post.thumbnailUrl || post.mediaUrls[0] }}
            style={styles.mediaImage}
            contentFit="cover"
          />
          {isVideo && (
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle" size={60} color="rgba(255,255,255,0.9)" />
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <View style={styles.tagsRow}>
          {post.tags.map(t => (
            <TouchableOpacity key={t} style={styles.tag} onPress={() => navigation.navigate('Search', { query: t })}>
              <Text style={styles.tagText}>#{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={liked ? '#FF4D6D' : Colors.textMuted} />
          <Text style={[styles.actionCount, liked && { color: '#FF4D6D' }]}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => commentInputRef.current?.focus()}>
          <Ionicons name="chatbubble-outline" size={24} color={Colors.textMuted} />
          <Text style={styles.actionCount}>{post.commentsCount || comments.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { marginLeft: 'auto' }]} onPress={handleBookmark}>
          <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={24} color={bookmarked ? Colors.primary : Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Comments header */}
      <View style={styles.commentsDivider}>
        <Text style={styles.commentsTitle}>Comments</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <FlatList
        data={comments}
        keyExtractor={item => item.id}
        renderItem={renderComment}
        ListHeaderComponent={ListHeader}
        onEndReached={() => { if (hasMoreComments) loadComments(false); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          commentsLoading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.primary} />
          ) : comments.length === 0 ? (
            <View style={styles.noComments}>
              <Text style={styles.noCommentsText}>No comments yet. Be the first! 💬</Text>
            </View>
          ) : <View style={{ height: 80 }} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 64 }}
        showsVerticalScrollIndicator={false}
      />

      {/* ─── Comment Input ─── */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        {replyTo && (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText}>Replying to @{replyTo.username}</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Ionicons name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <Avatar user={user} size="sm" />
          <TextInput
            ref={commentInputRef}
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor={Colors.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={submitComment}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!commentText.trim() || submitting) && styles.sendBtnDisabled]}
            onPress={submitComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: { padding: 4, width: 40 },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  authorRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  authorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  displayName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  username: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  followBtn: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  followBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },

  content: {
    fontSize: 16, color: Colors.textPrimary, lineHeight: 24,
    paddingHorizontal: 16, paddingBottom: 12,
  },

  mediaContainer: { width: '100%', aspectRatio: 1, marginBottom: 4 },
  mediaImage: { width: '100%', height: '100%' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: `${Colors.primary}22` },
  tagText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  actionBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 20,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },

  commentsDivider: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  commentsTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  comment: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border + '40',
  },
  commentBubble: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  commentTime: { fontSize: 12, color: Colors.textMuted, marginLeft: 'auto' },
  commentText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 },
  commentLike: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentLikeCount: { fontSize: 12, color: Colors.textMuted },
  replyBtn: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  noComments: { alignItems: 'center', paddingVertical: 40 },
  noCommentsText: { fontSize: 15, color: Colors.textMuted },

  inputBar: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: 16, paddingTop: 10,
  },
  replyBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8,
  },
  replyBannerText: { fontSize: 13, color: Colors.textMuted },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  commentInput: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: Colors.textPrimary,
    maxHeight: 100, minHeight: 40,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
