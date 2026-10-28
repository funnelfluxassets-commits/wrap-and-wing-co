import { useState, useEffect } from 'react';

export interface StoreOperatingStatus {
  isOpen: boolean;
  reason: 'open' | 'sunday_closed' | 'before_opening' | 'after_closing';
  badgeText: string;
  bannerTitle: string;
  bannerMessage: string;
  nextOpen: string;
  buttonText: string;
  hoursDescription: string;
}

const HOURS_DESCRIPTION = 'Monday – Saturday: 9:00 AM – 6:00 PM (Sunday: Closed)';

/**
 * Calculates whether Wrap & Wings Co flagship (Pinetown) is currently within operating hours.
 * Operating hours:
 * - Monday – Saturday: 09:00 AM – 06:00 PM (09:00 - 18:00 SAST)
 * - Sunday: Closed all day
 *
 * Uses South Africa Standard Time (Africa/Johannesburg, UTC+2).
 */
export function getStoreOperatingStatus(customDate?: Date): StoreOperatingStatus {
  const dateObj = customDate || new Date();

  // Convert to South Africa Standard Time (SAST, UTC+2)
  const sastString = dateObj.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' });
  const sast = new Date(sastString);

  const day = sast.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = sast.getHours();
  const minute = sast.getMinutes();
  const minutesSinceMidnight = hour * 60 + minute;

  const OPENING_MINUTES = 9 * 60; // 09:00 AM (540 mins)
  const CLOSING_MINUTES = 18 * 60; // 06:00 PM (1080 mins)

  // 1. Sunday: Closed all day
  if (day === 0) {
    return {
      isOpen: false,
      reason: 'sunday_closed',
      badgeText: 'Closed Today (Sunday)',
      bannerTitle: 'Store Closed on Sundays',
      bannerMessage:
        'Wrap & Wings Co is closed on Sundays. Online orders will resume on Monday at 9:00 AM.',
      nextOpen: 'Monday at 9:00 AM',
      buttonText: 'STORE CLOSED • OPENS MON 9:00 AM',
      hoursDescription: HOURS_DESCRIPTION,
    };
  }

  // 2. Monday to Saturday: Before 9:00 AM
  if (minutesSinceMidnight < OPENING_MINUTES) {
    return {
      isOpen: false,
      reason: 'before_opening',
      badgeText: 'Opens Today at 9:00 AM',
      bannerTitle: 'Store Opens at 9:00 AM',
      bannerMessage:
        'We are preparing the flame grill! Online orders will open at 9:00 AM today.',
      nextOpen: 'Today at 9:00 AM',
      buttonText: 'OPENS TODAY AT 9:00 AM',
      hoursDescription: HOURS_DESCRIPTION,
    };
  }

  // 3. Monday to Saturday: After 6:00 PM (18:00)
  if (minutesSinceMidnight >= CLOSING_MINUTES) {
    const isSaturday = day === 6;
    const nextOpen = isSaturday ? 'Monday at 9:00 AM' : 'Tomorrow at 9:00 AM';
    return {
      isOpen: false,
      reason: 'after_closing',
      badgeText: isSaturday ? 'Closed • Opens Mon 9:00 AM' : 'Closed • Opens Tomorrow 9:00 AM',
      bannerTitle: 'Store Closed for the Day',
      bannerMessage: `The kitchen has closed for the day at 6:00 PM. Online orders will reopen on ${nextOpen}.`,
      nextOpen,
      buttonText: `STORE CLOSED • OPENS ${isSaturday ? 'MON' : 'TOMORROW'} 9:00 AM`,
      hoursDescription: HOURS_DESCRIPTION,
    };
  }

  // 4. Currently Open (Monday to Saturday between 09:00 AM and 06:00 PM)
  return {
    isOpen: true,
    reason: 'open',
    badgeText: 'Open Now • Closes 6:00 PM',
    bannerTitle: 'Store is Open',
    bannerMessage:
      'Flame grill is fired up and ready! Store is open for collections and table orders until 6:00 PM today.',
    nextOpen: 'Closes at 6:00 PM',
    buttonText: 'PROCEED TO CHECKOUT',
    hoursDescription: HOURS_DESCRIPTION,
  };
}

export interface DeliveryOperatingStatus {
  isOpen: boolean;
  reason: 'open' | 'sunday_closed' | 'before_opening' | 'after_delivery_cutoff';
  badgeText: string;
  message: string;
  cutoffText: string;
}

/**
 * Calculates whether Delivery is currently active.
 * Delivery hours:
 * - Monday – Saturday: 09:00 AM – 05:00 PM (17:00 SAST)
 * - Closes at 17:00 (1 hour before the 18:00 store close)
 * - Sunday: Closed all day
 */
export function getDeliveryOperatingStatus(customDate?: Date): DeliveryOperatingStatus {
  const dateObj = customDate || new Date();
  const sastString = dateObj.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' });
  const sast = new Date(sastString);

  const day = sast.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = sast.getHours();
  const minute = sast.getMinutes();
  const minutesSinceMidnight = hour * 60 + minute;

  const OPENING_MINUTES = 9 * 60; // 09:00 AM (540 mins)
  const DELIVERY_CUTOFF_MINUTES = 17 * 60; // 05:00 PM (1020 mins) - 1 hour before store close

  // 1. Sunday: Closed all day
  if (day === 0) {
    return {
      isOpen: false,
      reason: 'sunday_closed',
      badgeText: 'Closed Sundays',
      message: 'Doorstep Delivery is closed on Sundays. Reopens Monday at 9:00 AM.',
      cutoffText: 'Closed Sundays',
    };
  }

  // 2. Before 9:00 AM
  if (minutesSinceMidnight < OPENING_MINUTES) {
    return {
      isOpen: false,
      reason: 'before_opening',
      badgeText: 'Delivery Opens 9:00 AM',
      message: 'Doorstep Delivery opens today at 9:00 AM.',
      cutoffText: 'Opens 9:00 AM',
    };
  }

  // 3. After 5:00 PM (17:00) - Closes 1 hour before store close
  if (minutesSinceMidnight >= DELIVERY_CUTOFF_MINUTES) {
    const isSaturday = day === 6;
    const nextDay = isSaturday ? 'Monday at 9:00 AM' : 'tomorrow at 9:00 AM';
    return {
      isOpen: false,
      reason: 'after_delivery_cutoff',
      badgeText: 'Delivery Closed (Cutoff 5:00 PM)',
      message: `Doorstep Delivery has closed for today at 5:00 PM (1 hour before shop close). It will reopen on ${nextDay}. Collection and Dine-In remain open until 6:00 PM!`,
      cutoffText: 'Closed (Cutoff 5:00 PM)',
    };
  }

  // 4. Currently Open for Delivery (Mon-Sat 09:00 to 17:00)
  return {
    isOpen: true,
    reason: 'open',
    badgeText: 'Delivery Available • Closes 5:00 PM',
    message: 'Doorstep Delivery is currently active and open until 5:00 PM today.',
    cutoffText: 'Closes 5:00 PM',
  };
}

/**
 * React hook that dynamically returns the store operating status and refreshes every 30 seconds.
 */
export function useStoreOperatingStatus(): StoreOperatingStatus {
  const [status, setStatus] = useState<StoreOperatingStatus>(() => getStoreOperatingStatus());

  useEffect(() => {
    // Refresh status every 30 seconds to catch 09:00 opening and 18:00 closing smoothly
    const interval = setInterval(() => {
      setStatus(getStoreOperatingStatus());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return status;
}

/**
 * React hook that dynamically returns the delivery operating status and refreshes every 30 seconds.
 */
export function useDeliveryOperatingStatus(): DeliveryOperatingStatus {
  const [status, setStatus] = useState<DeliveryOperatingStatus>(() => getDeliveryOperatingStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getDeliveryOperatingStatus());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
