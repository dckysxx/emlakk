// ─── Para string → sayı ───────────────────────────────────────────────────────
function parseMoney(str) {
  if (!str && str !== 0) return null;
  const n = Number(String(str).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''));
  return isNaN(n) ? null : n;
}

/**
 * Ana filtreleme fonksiyonu.
 * Supabase'e geçildiğinde bu fonksiyon query builder'a dönüştürülecek.
 */
export function filterListings(listings, filters) {
  return listings.filter(listing => {

    // 1. İlan türü
    if (filters.listingType && listing.type !== filters.listingType) return false;

    // 2. Mahalle (çoklu seçim)
    if (filters.neighborhoods?.length > 0) {
      if (!filters.neighborhoods.includes(listing.location || listing.neighborhood)) return false;
    }

    // 3. Fiyat aralığı
    const rawPrice = parseMoney(listing.price);
    if (rawPrice !== null) {
      const minP = parseMoney(filters.minPrice);
      const maxP = parseMoney(filters.maxPrice);
      if (minP !== null && rawPrice < minP) return false;
      if (maxP !== null && rawPrice > maxP) return false;
    }

    // 4. Oda sayısı (çoklu seçim)
    if (filters.rooms?.length > 0) {
      if (!filters.rooms.includes(listing.rooms)) return false;
    }

    // 5. Metrekare
    if (listing.sqm) {
      const minM = parseMoney(filters.minM2);
      const maxM = parseMoney(filters.maxM2);
      if (minM !== null && listing.sqm < minM) return false;
      if (maxM !== null && listing.sqm > maxM) return false;
    }

    // 6. Bina yaşı
    if (filters.buildingAge && listing.buildingAge !== undefined) {
      const age = Number(listing.buildingAge);
      const ranges = {
        '0-5':  [0,  5],
        '5-10': [5,  10],
        '10-20':[10, 20],
        '20+':  [20, 999],
      };
      const [min, max] = ranges[filters.buildingAge] || [0, 999];
      if (age < min || age > max) return false;
    }

    // 7. Ek özellikler
    if (filters.features?.length > 0) {
      const listingFeatures = listing.features || [];
      const hasAll = filters.features.every(f => listingFeatures.includes(f));
      if (!hasAll) return false;
    }

    return true;
  });
}

// ─── Aktif filtre count (badge için) ─────────────────────────────────────────
export function countActiveFilters(filters) {
  let count = 0;
  if (filters.listingType)          count++;
  if (filters.neighborhoods?.length) count += filters.neighborhoods.length;
  if (filters.minPrice)             count++;
  if (filters.maxPrice)             count++;
  if (filters.rooms?.length)        count += filters.rooms.length;
  if (filters.minM2)                count++;
  if (filters.maxM2)                count++;
  if (filters.buildingAge)          count++;
  if (filters.features?.length)     count += filters.features.length;
  return count;
}

// ─── Boş filtre state ─────────────────────────────────────────────────────────
export const EMPTY_FILTERS = {
  listingType:   '',
  neighborhoods: [],
  minPrice:      '',
  maxPrice:      '',
  rooms:         [],
  minM2:         '',
  maxM2:         '',
  buildingAge:   '',
  features:      [],
};