/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import { useCallback } from 'react';
import { useAsync } from './useAsync';
import monetizationService from '../services/monetizationService';

const MOCK = {
  balance: 1040.00,
  monthlyEarnings: 2840,
  subscribers: 148,
  tipsReceived: 380,
  adRevenue: 740,
  revenueChart: [
    { month: 'Jan', total: 1440 }, { month: 'Feb', total: 1540 },
    { month: 'Mar', total: 1910 }, { month: 'Apr', total: 2000 },
    { month: 'May', total: 2540 }, { month: 'Jun', total: 2840 },
  ],
  revenueSplit: [
    { label: 'Subscriptions', pct: 61, color: '#7C3AED' },
    { label: 'Ad Revenue', pct: 26, color: '#06B6D4' },
    { label: 'Tips & Donations', pct: 13, color: '#F59E0B' },
  ],
  transactions: [
    { id: 'TXN-001', type: 'Ad Revenue', amount: '+$284.00', date: 'Jun 30', status: 'Paid' },
    { id: 'TXN-002', type: 'Subscription', amount: '+$720.00', date: 'Jun 28', status: 'Paid' },
    { id: 'TXN-003', type: 'Tip', amount: '+$50.00', date: 'Jun 25', status: 'Paid' },
    { id: 'TXN-004', type: 'Ad Revenue', amount: '+$162.00', date: 'Jun 20', status: 'Paid' },
    { id: 'TXN-005', type: 'Payout', amount: '-$1,800.00', date: 'Jun 15', status: 'Processed' },
  ],
  tiers: [
    { id: 't1', name: 'Fan', price: '$4.99/mo', perks: ['Ad-free viewing', 'Fan badge', 'Monthly shoutout'], color: '#64748B' },
    { id: 't2', name: 'Supporter', price: '$9.99/mo', perks: ['All Fan perks', 'Exclusive content', 'Early access', 'Discord role'], color: '#7C3AED', popular: true },
    { id: 't3', name: 'Legend', price: '$24.99/mo', perks: ['All Supporter perks', '1-on-1 game sessions', 'Custom emotes', 'Priority chat'], color: '#F59E0B' },
  ],
};

export function useMonetization() {
  const result = useAsync(() => monetizationService.getOverview(), MOCK);

  const requestPayout = useCallback(async (amount) => {
    try {
      await monetizationService.requestPayout(amount);
      result.refetch();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error };
    }
  }, [result.refetch]);

  return { ...result, requestPayout };
}
