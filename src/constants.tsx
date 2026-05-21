import { Cpu, Presentation, Smile, Users, Music, Trophy, LayoutGrid } from 'lucide-react';

export const EVENT_CATEGORIES = [
  { id: 'Electronic', label: 'Electronic', icon: Cpu, description: 'Digital & Tech Events' },
  { id: 'Conference', label: 'Conference', icon: Presentation, description: 'Professional Summits' },
  { id: 'Comedy', label: 'Comedy', icon: Smile, description: 'Stand-up & Shows' },
  { id: 'Networking', label: 'Networking', icon: Users, description: 'Business & Social' },
  { id: 'Music', label: 'Music', icon: Music, description: 'Concerts & Festivals' },
  { id: 'Sports', label: 'Sports', icon: Trophy, description: 'Athletic Matches' },
  { id: 'Other', label: 'Other', icon: LayoutGrid, description: 'Diverse Experiences' },
];

export type EventCategory = 'Electronic' | 'Conference' | 'Comedy' | 'Networking' | 'Music' | 'Sports' | 'Other';

export const SUPPORT_WHATSAPP_NUMBER = '6289531105993'; // Replace with real support number
export const SUPPORT_MESSAGE = 'Hello Tiketmu Support, I need assistance regarding my account or ticket purchase.';
