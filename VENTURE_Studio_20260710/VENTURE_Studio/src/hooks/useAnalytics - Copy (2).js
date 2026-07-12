/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import { useState } from 'react';
import { useAsync } from './useAsync';
import analyticsService from '../services/analyticsService';

const MOCK = {
  stats: [
    { label: 'Total Views', value: '847K', change: '+12.4%' },
    { label: 'Watch Time', value: '4,820 hrs', change: '+8.2%' },
    { label: 'Avg View Duration', value: '6m 42s', change: '+5.1%' },
    { label: 'Click-Through Rate', value: '7.8%', change: '+1.2%' },
  ],
  viewsData: [
    { date: 'Jun 1', views: 8400, unique: 6200 },
    { date: 'Jun 5', views: 11200, unique: 8800 },
    { date: 'Jun 10', views: 9600, unique: 7400 },
    { date: 'Jun 15', views: 14800, unique: 11200 },
    { date: 'Jun 20', views: 18200, unique: 14600 },
    { date: 'Jun 25', views: 16400, unique: 12800 },
    { date: 'Jun 30', views: 21000, unique: 17200 },
  ],
  revenueData: [
    { month: 'Jan', ads: 420, subs: 840, tips: 180 },
    { month: 'Feb', ads: 380, subs: 920, tips: 240 },
    { month: 'Mar', ads: 510, subs: 1080, tips: 320 },
    { month: 'Apr', ads: 480, subs: 1240, tips: 280 },
    { month: 'May', ads: 620, subs: 1480, tips: 440 },
    { month: 'Jun', ads: 740, subs: 1720, tips: 380 },
  ],
  topContent: [
    { name: 'Warzone Solo Win', views: 142000 },
    { name: 'Diamond Push', views: 98000 },
    { name: 'Tournament Highlights', views: 67000 },
    { name: 'New Map First Look', views: 45000 },
    { name: 'Setup Tour', views: 28000 },
  ],
  trafficSources: [
    { name: 'Search', value: 38, color: '#7C3AED' },
    { name: 'Browse', value: 27, color: '#06B6D4' },
    { name: 'External', value: 18, color: '#F59E0B' },
    { name: 'Notifications', value: 17, color: '#10B981' },
  ],
};

export function useAnalytics(range = '30d') {
  return useAsync(() => analyticsService.getOverview(range), MOCK, [range]);
}
