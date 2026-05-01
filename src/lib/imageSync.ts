import { getSupabase, BUCKET_NAME } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export const FALLBACK_IMAGES: Record<string, string[]> = {
  Electronic: [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1514525253361-bee8a187499b?auto=format&fit=crop&q=80&w=800'
  ],
  Conference: [
    'https://images.unsplash.com/photo-1540575861501-7ad0582371f3?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800'
  ],
  Comedy: [
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&q=80&w=800'
  ],
  Networking: [
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=800'
  ],
  Music: [
    'https://images.unsplash.com/photo-1459749411177-042180ceea72?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800'
  ],
  Sports: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800'
  ],
  Other: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800'
  ]
};

export const getFallbackImage = (category: string) => {
  const images = FALLBACK_IMAGES[category] || FALLBACK_IMAGES['Other'];
  return images[Math.floor(Math.random() * images.length)];
};

export const isSupabaseUrl = (url: string) => {
  return url.includes('.supabase.co/storage/v1/object/public/');
};

/**
 * Downloads an image from a URL and uploads it to Supabase Storage.
 * Note: This usually fails due to CORS if done from the browser directly for most Unsplash images.
 * In a real app, you'd do this from the backend or using a proxy.
 * However, we will implement it such that if it fails, we at least tried 
 * and can fallback to the original URL if needed.
 */
export const syncExternalImageToSupabase = async (url: string, category: string): Promise<string> => {
  if (isSupabaseUrl(url)) return url;
  
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured, skipping image sync.');
    return url || getFallbackImage(category);
  }
  
  const fileName = `${uuidv4()}.jpg`;
  const filePath = `posters/${fileName}`;

  try {
    // Attempt to fetch the image. 
    // This will likely fail for many external URLs due to CORS in the browser.
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch external image');
    
    const blob = await response.blob();
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.warn('Image sync to Supabase failed, using original or fallback:', error);
    // If it's a generic Unsplash placeholder, return it if we can't sync.
    // Or if it's empty, get a fallback.
    if (!url || url.includes('placeholder')) {
      return getFallbackImage(category);
    }
    return url;
  }
};
