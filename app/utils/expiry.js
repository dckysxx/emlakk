/*
 * Gerçek sistemde bu bildirimlerin tamamı backend cron job ve
 * SMS/e-mail servisleri (Twilio, SendGrid vb.) ile gönderilmelidir.
 * Bu dosya yalnızca frontend mantığını ve placeholder'ları içerir.
 */

// ─── Temel tarih yardımcıları ─────────────────────────────────────────────────

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getDaysRemaining(expiresAt) {
  const now    = new Date();
  const exp    = new Date(expiresAt);
  const diffMs = exp.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(expiresAt, thresholdDays = 7) {
  const days = getDaysRemaining(expiresAt);
  return days > 0 && days <= thresholdDays;
}

export function isExpired(expiresAt) {
  return new Date(expiresAt) < new Date();
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// ─── Yeni kayıt için tarih alanları üret ─────────────────────────────────────

export function makeExpiryFields(durationDays) {
  const createdAt = new Date();
  const expiresAt = addDays(createdAt, durationDays);
  return {
    createdAt:             createdAt.toISOString(),
    expiresAt:             expiresAt.toISOString(),
    status:                'active',
    notificationScheduled: false,
  };
}

// ─── Süre durumu hesapla ──────────────────────────────────────────────────────

export function getExpiryStatus(expiresAt) {
  if (isExpired(expiresAt))       return 'expired';
  if (isExpiringSoon(expiresAt))  return 'expiring_soon';
  return 'active';
}

// ─── Süresi dolmuş ilanları sil (isDeleted=true yap) ─────────────────────────
/*
 * Gerçek sistemde süresi dolan ilanlar backend cron job ile otomatik silinmelidir.
 * Bu fonksiyon yalnızca UI katmanında soft-delete simüle eder.
 */
export function autoDeleteExpiredListings(listings) {
  return listings.map(l => {
    if (!l.isDeleted && isExpired(l.expiresAt)) {
      return { ...l, isDeleted: true, status: 'expired' };
    }
    return l;
  });
}

// ─── Bildirim placeholder fonksiyonları ──────────────────────────────────────
/*
 * Gerçek sistemde bu bildirimler backend cron job ve
 * SMS/e-mail servisleri ile gönderilmelidir.
 */

export function scheduleRequestExpiryNotification(request) {
  console.log('[PLACEHOLDER] scheduleRequestExpiryNotification:', {
    requestId: request.id,
    expiresAt: request.expiresAt,
    message:   'Gerçek sistemde backend cron job bu zamanlamayı yönetir.',
  });
}

export function sendRequestExpiryEmail(user, request) {
  console.log('[PLACEHOLDER] sendRequestExpiryEmail:', {
    to:        user?.email,
    requestId: request.id,
    expiresAt: request.expiresAt,
    message:   'Gerçek sistemde SendGrid/SMTP ile gönderilir.',
  });
}

export function sendRequestExpirySms(user, request) {
  console.log('[PLACEHOLDER] sendRequestExpirySms:', {
    phone:     user?.phone,
    requestId: request.id,
    expiresAt: request.expiresAt,
    message:   'Gerçek sistemde Twilio/NetGSM ile gönderilir.',
  });
}