import React from 'react';

export type FlavourId = 'lemony' | 'mild' | 'bbq' | 'sweet_chilli' | 'hot';

export interface Flavour {
  id: FlavourId;
  name: string;
  emoji: string;
  color: string;
  bgClass: string;
  textClass: string;
  description: string;
}

export type CategoryId =
  | 'wraps'
  | 'wings'
  | 'chicken'
  | 'burgers'
  | 'sandwiches'
  | 'seafood'
  | 'sides'
  | 'kids'
  | 'drinks';

export interface MenuCategory {
  id: CategoryId;
  name: string;
  icon: string | React.ReactNode;
  description: string;
}

export interface MenuItem {
  id: string;
  categoryId: CategoryId;
  name: string;
  description: string;
  price: number;
  image?: string;
  popular?: boolean;
  isSpicy?: boolean;
  hasFlavourChoice?: boolean;
  includesSide?: boolean;
  sideOptions?: string[];
  badge?: string;
}

export interface CartCustomization {
  flavour?: FlavourId;
  side?: string;
  notes?: string;
  extras?: { name: string; price: number }[];
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  customization?: CartCustomization;
  itemTotal: number;
}

export type OrderMode = 'collection' | 'delivery' | 'dine-in';

export interface StoreLocation {
  id: string;
  name: string;
  mall: string;
  address: string;
  city: string;
  landmark: string;
  phone: string;
  whatsapp: string;
  hours: string;
  isOpen: boolean;
  mapQuery: string;
  mapEmbedUrl?: string;
  googleMapsUrl?: string;
  status: 'active' | 'coming_soon';
}

export interface DeliveryDetails {
  customerName: string;
  phone: string;
  address: string;
  suburb: string;
  complexOrUnit?: string;
  gateCode?: string;
  notes?: string;
  preferredTime?: string;
  createdAt?: string;
  tableNumber?: string;
  latitude?: number;
  longitude?: number;
}

export type PaymentGatewayType = 'payfast' | 'yoco' | 'whatsapp' | 'cod';

export type OrderStatus = 'received' | 'cooking' | 'ready' | 'dispatched' | 'completed' | 'cancelled';

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  label: string;
  note?: string;
  epochTime?: number;
}

export interface LiveOrder {
  orderId: string;
  orderMode: OrderMode;
  tableNumber?: string;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tip?: number;
  grandTotal: number;
  customer: DeliveryDetails;
  store: StoreLocation;
  paymentMethod: PaymentGatewayType;
  paymentStatus: 'paid' | 'pending';
  preferredTime: string;
  createdAt: string;
  estimatedMinutes: number;
  timeline: OrderTimelineEvent[];
  cookingStartedAt?: number;
  completedAt?: number;
  driverId?: string;
  driverName?: string;
  driverAcceptedAt?: number;
  driverLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    updatedAt: number;
  };
}

export interface DriverProfile {
  id: string; // e.g. 'DRV-01', 'DRV-02'
  driverNumber: number; // 1, 2, etc.
  name: string;
  phone: string;
  pin: string; // 4-digit PIN for Driver Portal access
  idOrPassportNumber?: string;
  residentialAddress?: string;
  vehicleType: 'motorcycle' | 'light_vehicle' | 'car';
  vehicleDetails: string;
  vehicleReg: string;
  licenceCode: string; // 'Code 8 / Code B (Light Vehicle)' | 'Code A / A1 (Motorcycle)'
  licenceNumber?: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchCode: string;
  active: boolean;
  onboardingCompleted?: boolean;
  signedAgreementDate?: string;
}

export type PageView =
  | 'menu'
  | 'story'
  | 'team'
  | 'kitchen'
  | 'delivery'
  | 'track'
  | 'contact'
  | 'review'
  | 'admin'
  | 'driver-agreement';

export type StaffRole = 'kitchen' | 'driver' | 'admin';

export interface ReviewCampaignWeek {
  id: string; // e.g. 'week-1', 'week-2', 'week-3'
  weekNumber: number;
  title: string;
  prize: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'completed' | 'active' | 'upcoming';
  winnerName?: string;
  winnerSlip?: string;
  bannerImage?: string;
}

export interface ReviewDrawEntry {
  id: string;
  fullName: string;
  phone: string;
  receiptNumber: string;
  googleReviewName: string;
  rating?: number;
  comments?: string;
  createdAt: string;
  status?: 'pending' | 'verified' | 'winner' | 'uncompleted' | 'excluded' | 'invalid';
  campaignWeekId?: string;
}

