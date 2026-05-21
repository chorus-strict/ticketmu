import { ManagedEvent } from '../contexts/ManagementContext';

export type FilterType = 'FEATURED' | 'TRENDING' | 'NEW';

export interface FilterOptions {
  category?: string;
  type?: FilterType;
  status?: string;
}

/**
 * Centralized, defensive, and production-safe event filtering logic.
 * Handles normalization, null-safety, and robust comparison.
 */
export function filterAndSortEvents(
  events: ManagedEvent[] | null | undefined,
  options: FilterOptions = {}
): ManagedEvent[] {
  const { category = 'All', type = 'FEATURED', status = 'LIVE' } = options;

  // 1. Extreme Defensive Array Validation
  if (!events || !Array.isArray(events)) {
    return [];
  }

  try {
    // Deduplicate by ID before processing
    const seenIds = new Set();
    const uniqueSourceEvents = (events || []).filter(e => {
      if (!e || !e.id || seenIds.has(e.id)) return false;
      seenIds.add(e.id);
      return true;
    });

    return uniqueSourceEvents
      .filter((event) => {
        // Deep Object Integrity Check
        if (!event || typeof event !== 'object' || !event.id) {
          return false;
        }

        // 3. Normalized Status Check
        if (status) {
          const eventStatus = String(event.status || '').toUpperCase();
          if (eventStatus !== status.toUpperCase()) {
            return false;
          }
        }

        // 4. Robust Category Matching
        if (category && category !== 'All') {
          const eventCategory = String(event.category || '').toLowerCase().trim();
          const targetCategory = String(category).toLowerCase().trim();
          if (eventCategory !== targetCategory) {
            return false;
          }
        }

        // 5. Contextual Feature Filter
        // If Type is FEATURED, we only filter if a specific category is selected.
        // If "All" is selected, we show all events to fulfill the "Complete Collection" requirement.
        if (type === 'FEATURED' && category !== 'All' && !event.isFeatured) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // 6. Hardened Sorting Logic
        try {
          if (type === 'FEATURED') {
            // Prioritize featured events, then by date
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            
            const aTime = a.date ? new Date(a.date).getTime() : 0;
            const bTime = b.date ? new Date(b.date).getTime() : 0;
            return bTime - aTime;
          }

          if (type === 'TRENDING') {
            const aScore = Number(a.trendingScore ?? (a.sold / Math.max(1, a.capacity || 0) * 100)) || 0;
            const bScore = Number(b.trendingScore ?? (b.sold / Math.max(1, b.capacity || 0) * 100)) || 0;
            return bScore - aScore;
          }

          if (type === 'NEW') {
            // Priority: createdAt > date > fallback
            const aVal = a.createdAt || a.date || 0;
            const bVal = b.createdAt || b.date || 0;
            
            const aTime = aVal ? new Date(aVal).getTime() : 0;
            const bTime = bVal ? new Date(bVal).getTime() : 0;
            
            return bTime - aTime;
          }
        } catch (sortErr) {
          console.error('[EventFilter] Sort failure:', sortErr);
          return 0;
        }

        return 0;
      });
  } catch (err) {
    console.error('[EventFilter] Filter process crashed:', err);
    return [];
  }
}
