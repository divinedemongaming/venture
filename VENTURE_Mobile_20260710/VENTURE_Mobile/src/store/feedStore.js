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
import { create } from 'zustand';

export const useFeedStore = create((set, get) => ({
  posts: [],
  reels: [],
  stories: [],
  liveStreams: [],
  trending: null,
  isLoading: false,
  hasMore: true,

  setPosts: (posts) => set({ posts }),
  appendPosts: (newPosts) => set(state => ({ posts: [...state.posts, ...newPosts] })),
  setReels: (reels) => set({ reels }),
  appendReels: (newReels) => set(state => ({ reels: [...state.reels, ...newReels] })),
  setStories: (stories) => set({ stories }),
  setLiveStreams: (liveStreams) => set({ liveStreams }),
  setTrending: (trending) => set({ trending }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasMore: (hasMore) => set({ hasMore }),

  updatePostLike: (postId, liked, likesCount) => set(state => ({
    posts: state.posts.map(p => p.id === postId ? { ...p, liked, likesCount } : p)
  })),

  removePost: (postId) => set(state => ({
    posts: state.posts.filter(p => p.id !== postId)
  })),
}));
