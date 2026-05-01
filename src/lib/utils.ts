import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string, locale: string = 'id-ID') {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  }).format(date);
}

export function formatDateTime(dateString: string, locale: string = 'id-ID') {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Jakarta'
  };

  const formatted = new Intl.DateTimeFormat(locale, options).format(date);
  if (locale.startsWith('id')) {
    return `${formatted.replace(',', ' •')} WIB`;
  }
  return formatted;
}

/**
 * Returns UTC Date object representing start of day (00:00:00) in Jakarta
 */
export function getJakartaStartOfDay(dateInput?: string | Date) {
  const d = dateInput ? new Date(dateInput) : new Date();
  
  // Format to Jakarta YYYY-MM-DD
  const jakartaDateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  
  // Create a Date object for 00:00:00 in Jakarta by parse 'YYYY-MM-DDT00:00:00+07:00'
  return new Date(`${jakartaDateStr}T00:00:00+07:00`);
}

/**
 * Returns UTC Date object representing end of day (23:59:59) in Jakarta
 */
export function getJakartaEndOfDay(dateInput?: string | Date) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const jakartaDateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  return new Date(`${jakartaDateStr}T23:59:59.999+07:00`);
}

/**
 * Get current Jakarta date as YYYY-MM-DD
 */
export function getJakartaTodayString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

export function formatTimeAgo(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

export function formatTicketId(id: string) {
  if (!id) return '';
  const cleanId = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const part1 = cleanId.slice(0, 4);
  const part2 = cleanId.slice(-4);
  return `TKT-${part1}-${part2}`;
}

export const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';
export const DEFAULT_EVENT_IMAGE = '/images/default-event.jpg';

export function getAvatar(path: string | null | undefined) {
  if (!path) return DEFAULT_AVATAR;

  // 1. Full URL
  if (path.startsWith('http')) return path;

  // 2. Base64
  if (path.startsWith('data:')) return path;

  // 3. Local backend uploads (/uploads/...)
  if (path.startsWith('/uploads')) return path;

  return path;
}

export function getImageUrl(path: string | null | undefined, category: string = 'Other') {
  const CATEGORY_FALLBACKS: Record<string, string> = {
    'Electronic': 'https://images.unsplash.com/photo-1459749411177-042180ceea72?auto=format&fit=crop&q=80&w=800',
    'Conference': 'https://images.unsplash.com/photo-1540575861501-7ad058139a30?auto=format&fit=crop&q=80&w=800',
    'Comedy': 'https://images.unsplash.com/photo-1514525253361-b83f4b06003e?auto=format&fit=crop&q=80&w=800',
    'Music': 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
    'Sports': 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800',
    'Other': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'
  };

  if (!path) {
    return CATEGORY_FALLBACKS[category] || DEFAULT_EVENT_IMAGE;
  }

  // 1. Full URL
  if (path.startsWith('http')) return path;

  // 2. Base64
  if (path.startsWith('data:')) return path;

  // 3. Local backend uploads (/uploads/...) or public images (/images/...)
  if (path.startsWith('/uploads') || path.startsWith('/images/')) {
    return path;
  }

  // 4. Relative paths that might be just filenames (assume upload)
  if (path.includes('.') && !path.includes('/')) {
    return `/uploads/${path}`;
  }

  return path;
}
