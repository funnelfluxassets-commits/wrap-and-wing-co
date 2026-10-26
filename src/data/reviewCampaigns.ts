import { ReviewCampaignWeek, ReviewDrawEntry } from '../types';

export const REVIEW_CAMPAIGNS: ReviewCampaignWeek[] = [
  {
    id: 'week-1',
    weekNumber: 1,
    title: 'Week 1: Chicken Shwarma Wrap Combo',
    prize: 'Full Chicken Shwarma Wrap Meal + Crispy Side',
    startDate: '2026-10-19',
    endDate: '2026-10-25',
    status: 'completed',
    winnerName: 'Nokphiwe Mbokazi',
    winnerSlip: '37',
    bannerImage: '/images/menu/thumbs/wrap-and-side-1.webp',
  },
  {
    id: 'week-2',
    weekNumber: 2,
    title: 'Week 2: 3 Flame-Grilled Wings + Side',
    prize: '3 Flame-Grilled Wings + A Regular Side Combo',
    startDate: '2026-10-26',
    endDate: '2026-11-01',
    status: 'active',
    bannerImage: '/images/menu/wings-3.webp',
  },
  {
    id: 'week-3',
    weekNumber: 3,
    title: 'Week 3: Flame-Grilled Burger + Fries',
    prize: 'Signature Flame-Grilled Burger + Crispy Fries Combo',
    startDate: '2026-11-02',
    endDate: '2026-11-08',
    status: 'upcoming',
    bannerImage: '/images/menu/burger-and-chips.webp',
  },
  {
    id: 'week-4',
    weekNumber: 4,
    title: 'Week 4: 1/4 Chicken + Side Meal',
    prize: 'Flame-Grilled 1/4 Chicken + Side Combo',
    startDate: '2026-11-09',
    endDate: '2026-11-15',
    status: 'upcoming',
    bannerImage: '/images/menu/quarter-chicken.webp',
  },
];

/**
 * Returns the currently active campaign week
 */
export function getCurrentCampaignWeek(): ReviewCampaignWeek {
  const active = REVIEW_CAMPAIGNS.find((c) => c.status === 'active');
  return active || REVIEW_CAMPAIGNS[1]; // default to week-2
}

/**
 * Determines which campaign week an entry belongs to.
 * Uses explicit campaignWeekId if present, otherwise falls back to createdAt timestamp.
 */
export function getEntryCampaignWeekId(entry: Pick<ReviewDrawEntry, 'createdAt'> & { campaignWeekId?: string }): string {
  if (entry.campaignWeekId) {
    return entry.campaignWeekId;
  }

  try {
    const entryDate = new Date(entry.createdAt);
    // Cut-off timestamps (South Africa time UTC+2)
    // Week 1 ended Sunday 25 Oct 23:59:59 (2026-10-26T00:00:00+02:00)
    const week2Start = new Date('2026-10-26T00:00:00+02:00');
    const week3Start = new Date('2026-11-02T00:00:00+02:00');
    const week4Start = new Date('2026-11-09T00:00:00+02:00');

    if (entryDate < week2Start) {
      return 'week-1';
    } else if (entryDate < week3Start) {
      return 'week-2';
    } else if (entryDate < week4Start) {
      return 'week-3';
    } else {
      return 'week-4';
    }
  } catch {
    return 'week-2';
  }
}
