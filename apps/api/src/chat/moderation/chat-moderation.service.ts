//path: apps/api/src/chat/moderation/chat-moderation.service.ts
import { Injectable } from '@nestjs/common';

export type ModerationHit = {
  type: 'PHONE_NUMBER' | 'WHATSAPP' | 'OFF_PLATFORM_PAYMENT' | 'ADVERTISEMENT' | 'OTHER';
  matched?: string;
};

@Injectable()
export class ChatModerationService {
  scan(text: string): ModerationHit[] {
    const hits: ModerationHit[] = [];
    const t = text.toLowerCase();

    // Phone numbers (simple Nigeria-friendly heuristic: 10-14 digits, allows +)
    const phoneRegex = /(\+?\d[\d\s-]{9,13}\d)/g;
    const phoneMatches = text.match(phoneRegex);
    if (phoneMatches?.length) {
      for (const m of phoneMatches.slice(0, 3)) hits.push({ type: 'PHONE_NUMBER', matched: m });
    }

    if (t.includes('whatsapp') || t.includes('wa.me')) {
      hits.push({ type: 'WHATSAPP', matched: 'whatsapp' });
    }

    const offPlatform = ['pay outside', 'outside the platform', 'transfer me', 'send to my account', 'cash app', 'crypto address'];
    if (offPlatform.some((p) => t.includes(p))) {
      hits.push({ type: 'OFF_PLATFORM_PAYMENT' });
    }

    const ads = ['promo', 'advert', 'advertisement', 'marketing', 'referral link'];
    if (ads.some((p) => t.includes(p))) {
      hits.push({ type: 'ADVERTISEMENT' });
    }

    return hits;
  }
}
