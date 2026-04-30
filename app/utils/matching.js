// ─── Sansür fonksiyonları ─────────────────────────────────────────────────────
export function maskName(firstName, lastName) {
  if (!lastName) return firstName;
  return `${firstName} ${lastName.charAt(0)}**`;
}

export function maskPhone(phone) {
  if (!phone || phone.length < 10) return '***';
  // "05321234567" → "53* *** ** **"
  const digits = phone.replace(/\D/g, '');
  const area = digits.slice(1, 3); // "53"
  return `${area}* *** ** **`;
}

// ─── Para string → sayı ───────────────────────────────────────────────────────
function parseMoney(str) {
  if (!str) return 0;
  return Number(String(str).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')) || 0;
}

// ─── Ana eşleşme skoru ────────────────────────────────────────────────────────
export function calculateMatchScore(request, listing) {
  let score = 0;
  const details = [];

  // 1. İlan türü
  if (request.listingType && listing.type &&
      request.listingType === listing.type) {
    score++;
    details.push('İlan türü');
  }

  // 2. İl
  if (request.il && listing.city &&
      request.il === listing.city) {
    score++;
    details.push('İl');
  }

  // 3. İlçe
  if (request.ilce && listing.district &&
      request.ilce === listing.district) {
    score++;
    details.push('İlçe');
  }

  // 4. Mahalle
  if (request.mahalle && listing.neighborhood &&
      request.mahalle === listing.neighborhood) {
    score++;
    details.push('Mahalle');
  }

  // 5. Oda sayısı
  if (request.odaSayisi && listing.rooms &&
      request.odaSayisi === listing.rooms) {
    score++;
    details.push('Oda sayısı');
  }

  // 6. Bina yaşı (±5 yıl tolerans)
  if (request.binaYasi && listing.buildingAge) {
    const diff = Math.abs(Number(request.binaYasi) - Number(listing.buildingAge));
    if (diff <= 5) {
      score++;
      details.push('Bina yaşı');
    }
  }

  // 7. m² (±20m² tolerans)
  if (request.metrekare && listing.sqm) {
    const diff = Math.abs(Number(request.metrekare) - Number(listing.sqm));
    if (diff <= 20) {
      score++;
      details.push('m²');
    }
  }

  // 8. Bütçe aralığı
  const listingPrice = parseMoney(listing.price);
  const minBudget    = parseMoney(request.minButce);
  const maxBudget    = parseMoney(request.maxButce);
  if (listingPrice > 0 && minBudget > 0 && maxBudget > 0 &&
      listingPrice >= minBudget && listingPrice <= maxBudget) {
    score++;
    details.push('Bütçe aralığı');
  }

  return { score, details, maxScore: 8 };
}

export function isMatch(request, listing) {
  return calculateMatchScore(request, listing).score >= 5;
}

// ─── Bir ilan için eşleşen tüm talepleri bul ─────────────────────────────────
export function findMatchesForListing(listing, allRequests) {
  return allRequests
    .map(req => ({
      request: req,
      ...calculateMatchScore(req, listing),
    }))
    .filter(m => m.score >= 5)
    .sort((a, b) => b.score - a.score);
}