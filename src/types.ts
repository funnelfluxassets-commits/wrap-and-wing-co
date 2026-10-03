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
  icon: string;
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
  id: string; // unique cart line item id
  menuItem: MenuItem;
  quantity: number;
  customization?: CartCustomization;
  itemTotal: number;
}

export type OrderMode = 'collection' | 'delivery';

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
}

export type PaymentGatewayType = 'payfast' | 'yoco' | 'whatsapp' | 'cod';
