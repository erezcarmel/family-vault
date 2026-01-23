/**
 * Social Network Detection Utilities
 * Detects social network from URL patterns and provides corresponding logo information
 */

export interface SocialNetwork {
  name: string
  logo: string
  color: string
}

/**
 * Detects the social network from a profile URL
 * @param url - The profile URL to analyze
 * @returns SocialNetwork object if detected, null otherwise
 */
export function detectSocialNetwork(url: string): SocialNetwork | null {
  if (!url || typeof url !== 'string') return null
  
  const normalizedUrl = url.toLowerCase().trim()
  
  // Facebook patterns
  if (normalizedUrl.includes('facebook.com') || normalizedUrl.includes('fb.com') || normalizedUrl.includes('fb.me')) {
    return {
      name: 'Facebook',
      logo: '📘',
      color: '#1877F2'
    }
  }
  
  // Twitter/X patterns
  if (normalizedUrl.includes('twitter.com') || normalizedUrl.includes('x.com')) {
    return {
      name: 'X (Twitter)',
      logo: '𝕏',
      color: '#000000'
    }
  }
  
  // Instagram patterns
  if (normalizedUrl.includes('instagram.com')) {
    return {
      name: 'Instagram',
      logo: '📷',
      color: '#E4405F'
    }
  }
  
  // LinkedIn patterns
  if (normalizedUrl.includes('linkedin.com')) {
    return {
      name: 'LinkedIn',
      logo: '💼',
      color: '#0A66C2'
    }
  }
  
  // TikTok patterns
  if (normalizedUrl.includes('tiktok.com')) {
    return {
      name: 'TikTok',
      logo: '🎵',
      color: '#000000'
    }
  }
  
  // YouTube patterns
  if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
    return {
      name: 'YouTube',
      logo: '▶️',
      color: '#FF0000'
    }
  }
  
  // Reddit patterns
  if (normalizedUrl.includes('reddit.com')) {
    return {
      name: 'Reddit',
      logo: '🤖',
      color: '#FF4500'
    }
  }
  
  // Pinterest patterns
  if (normalizedUrl.includes('pinterest.com')) {
    return {
      name: 'Pinterest',
      logo: '📌',
      color: '#E60023'
    }
  }
  
  // Snapchat patterns
  if (normalizedUrl.includes('snapchat.com')) {
    return {
      name: 'Snapchat',
      logo: '👻',
      color: '#FFFC00'
    }
  }
  
  // WhatsApp patterns
  if (normalizedUrl.includes('whatsapp.com') || normalizedUrl.includes('wa.me')) {
    return {
      name: 'WhatsApp',
      logo: '💬',
      color: '#25D366'
    }
  }
  
  // Telegram patterns
  if (normalizedUrl.includes('telegram.org') || normalizedUrl.includes('t.me')) {
    return {
      name: 'Telegram',
      logo: '✈️',
      color: '#0088CC'
    }
  }
  
  // Discord patterns
  if (normalizedUrl.includes('discord.com') || normalizedUrl.includes('discord.gg')) {
    return {
      name: 'Discord',
      logo: '💬',
      color: '#5865F2'
    }
  }
  
  // Twitch patterns
  if (normalizedUrl.includes('twitch.tv')) {
    return {
      name: 'Twitch',
      logo: '🎮',
      color: '#9146FF'
    }
  }
  
  // GitHub patterns
  if (normalizedUrl.includes('github.com')) {
    return {
      name: 'GitHub',
      logo: '🐙',
      color: '#181717'
    }
  }
  
  return null
}

/**
 * Validates if a string appears to be a URL
 * @param url - The string to validate
 * @returns true if it looks like a URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    new URL(url)
    return true
  } catch {
    // If URL constructor fails, check for common URL patterns
    const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/
    return urlPattern.test(url.trim())
  }
}
