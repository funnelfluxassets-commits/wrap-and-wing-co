import { StoreLocation } from '../types';

export const STORES: StoreLocation[] = [
  {
    id: 'store-pinetown-flagship',
    name: 'Wrap & Wing Co - Pinetown Flagship',
    mall: 'Uniland Centre (Shop 1)',
    address: 'Shop 1, Uniland Centre, Pinetown',
    city: 'Pinetown, Durban, KZN',
    landmark: 'Behind Hollywoodbets',
    phone: '068 886 3892',
    whatsapp: '27688863892',
    hours: 'Monday – Sunday: 9:00 AM – 6:00 PM',
    isOpen: true,
    mapQuery: 'Uniland+Centre+Pinetown+KwaZulu-Natal',
    status: 'active',
  },
  {
    id: 'store-westville',
    name: 'Wrap & Wing Co - Westville',
    mall: 'Westville Junction',
    address: 'Westville, Durban',
    city: 'Westville, KZN',
    landmark: 'Opening Soon',
    phone: '068 886 3892',
    whatsapp: '27688863892',
    hours: 'Coming Soon',
    isOpen: false,
    mapQuery: 'Westville+Durban',
    status: 'coming_soon',
  },
  {
    id: 'store-umhlanga',
    name: 'Wrap & Wing Co - Umhlanga',
    mall: 'Umhlanga Village',
    address: 'Umhlanga, Durban North',
    city: 'Umhlanga, KZN',
    landmark: 'Opening Soon',
    phone: '068 886 3892',
    whatsapp: '27688863892',
    hours: 'Coming Soon',
    isOpen: false,
    mapQuery: 'Umhlanga+Durban',
    status: 'coming_soon',
  },
];

export const SOCIAL_LINKS = {
  tiktok: 'https://www.tiktok.com/@wrapwings.co',
  facebook: 'https://www.facebook.com/wrapandwingsco',
  whatsappDirect: 'https://wa.me/27688863892',
  phoneDirect: 'tel:0688863892',
};
