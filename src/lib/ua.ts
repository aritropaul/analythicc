// Lightweight UA parser. Covers common browsers/OS/devices.
// Not perfect — tradeoff for tiny edge footprint.

export type UA = {
  browser: string;
  os: string;
  device: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'other';
};

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|embedly|quora|pinterest|vkshare|w3c|validator|curl|wget|lighthouse|headless/i;

export function parseUA(ua: string): UA {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'other' };
  if (BOT_RE.test(ua)) return { browser: 'Bot', os: 'Bot', device: 'bot' };

  // Browser
  let browser = 'Other';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera\//i.test(ua)) browser = 'Opera';
  else if (/Arc\//i.test(ua)) browser = 'Arc';
  else if (/Brave\//i.test(ua)) browser = 'Brave';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Chrome\//i.test(ua) && !/Edg|OPR/i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome|Edg|OPR/i.test(ua)) browser = 'Safari';

  // OS
  let os = 'Other';
  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua) && !/Mobile/i.test(ua)) os = 'macOS';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';

  // Device
  let device: UA['device'] = 'desktop';
  if (/iPad|Tablet/i.test(ua)) device = 'tablet';
  else if (/Mobi|Android|iPhone|iPod/i.test(ua)) device = 'mobile';

  return { browser, os, device };
}

export function parseReferrer(ref: string | undefined | null): {
  referrer: string | null;
  referrerDomain: string | null;
} {
  if (!ref) return { referrer: null, referrerDomain: null };
  try {
    const u = new URL(ref);
    return { referrer: ref, referrerDomain: u.hostname.replace(/^www\./, '') };
  } catch {
    return { referrer: ref, referrerDomain: null };
  }
}

export function parseUTM(url: string) {
  try {
    const u = new URL(url);
    return {
      utmSource: u.searchParams.get('utm_source'),
      utmMedium: u.searchParams.get('utm_medium'),
      utmCampaign: u.searchParams.get('utm_campaign'),
    };
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null };
  }
}
