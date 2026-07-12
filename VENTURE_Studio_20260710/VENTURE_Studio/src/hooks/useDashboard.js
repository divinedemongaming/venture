/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import { useAsync } from './useAsync';
import analyticsService from '../services/analyticsService';

const MOCK = {
  stats: { views: 847432, subscribers: 14200, earnings: 2840, avgRating: 4.8 },
  viewsChart: [
    { day: 'Mon', views: 3200 }, { day: 'Tue', views: 4800 },
    { day: 'Wed', views: 4100 }, { day: 'Thu', views: 6200 },
    { day: 'Fri', views: 8400 }, { day: 'Sat', views: 11200 },
    { day: 'Sun', views: 9800 },
  ],
  topContent: [
    { title: 'Epic Warzone Solo Win', views: '142K', earnings: '$284', status: 'Published' },
    { title: 'Ranked Grind — Diamond Push', views: '98K', earnings: '$196', status: 'Published' },
    { title: 'Reaction Stream Highlights', views: '67K', earnings: '$134', status: 'Published' },
    { title: 'New Map First Look', views: '45K', earnings: '$90', status: 'Draft' },
  ],
  pending: { comments: 3, processing: 1, newSubs: 12 },
};

export function useDashboard() {
  return useAsync(() => analyticsService.getDashboard(), MOCK);
}
