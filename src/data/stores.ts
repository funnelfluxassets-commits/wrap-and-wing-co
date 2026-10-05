import { StoreLocation } from '../types';

// Testing WhatsApp number for order dispatch (+27 83 276 3273)
export const ORDER_WHATSAPP_NUMBER = '27832763273';

export const STORES: StoreLocation[] = [
  {
    id: 'store-pinetown-flagship',
    name: 'Wrap & Wings Co - Pinetown Flagship',
    mall: 'Uniland Centre (Shop 1)',
    address: 'Shop 1, Uniland Centre, Pinetown',
    city: 'Pinetown, Durban, KZN',
    landmark: 'Behind Hollywoodbets',
    phone: '068 886 3892',
    whatsapp: ORDER_WHATSAPP_NUMBER,
    hours: 'Monday – Sunday: 9:00 AM – 6:00 PM',
    isOpen: true,
    mapQuery: 'Wrap+and+Wing+Co+Pinetown',
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1163.082511830803!2d30.85500734324751!3d-29.811872099023525!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1ef6ff609bbeefc7%3A0xb1b982704527f3d7!2sWrap%20and%20Wing%20Co!5e1!3m2!1sen!2sza!4v1791152071878!5m2!1sen!2sza',
    googleMapsUrl: 'https://maps.google.com/?cid=12806509971261314007',
    status: 'active',
  },
  {
    id: 'store-westville',
    name: 'Wrap & Wings Co - Westville',
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
    name: 'Wrap & Wings Co - Umhlanga',
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
