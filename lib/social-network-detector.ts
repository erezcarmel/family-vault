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
 * Extracts the hostname from a URL string safely
 * @param url - The URL to parse
 * @returns The hostname or null if invalid
 */
function getHostname(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.toLowerCase()
  } catch {
    // If URL parsing fails, try adding protocol and parsing again
    try {
      const urlObj = new URL(`https://${url}`)
      return urlObj.hostname.toLowerCase()
    } catch {
      return null
    }
  }
}

/**
 * Checks if hostname matches the expected domain
 * @param hostname - The hostname to check
 * @param domains - Array of valid domain names
 * @returns true if hostname matches any of the domains
 */
function matchesDomain(hostname: string | null, domains: string[]): boolean {
  if (!hostname) return false
  
  // Check if hostname is exactly the domain or a subdomain of it
  for (const domain of domains) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) {
      return true
    }
  }
  return false
}

/**
 * Detects the social network from a profile URL
 * @param url - The profile URL to analyze
 * @returns SocialNetwork object if detected, null otherwise
 */
export function detectSocialNetwork(url: string): SocialNetwork | null {
  if (!url || typeof url !== 'string') return null
  
  const hostname = getHostname(url.trim())
  if (!hostname) return null
  
  // Facebook patterns
  if (matchesDomain(hostname, ['facebook.com', 'fb.com', 'fb.me'])) {
    return {
      name: 'Facebook',
      logo: '📘',
      color: '#1877F2'
    }
  }
  
  // Twitter/X patterns
  if (matchesDomain(hostname, ['twitter.com', 'x.com'])) {
    return {
      name: 'X (Twitter)',
      logo: '𝕏',
      color: '#000000'
    }
  }
  
  // Instagram patterns
  if (matchesDomain(hostname, ['instagram.com'])) {
    return {
      name: 'Instagram',
      logo: '📷',
      color: '#E4405F'
    }
  }
  
  // LinkedIn patterns
  if (matchesDomain(hostname, ['linkedin.com'])) {
    return {
      name: 'LinkedIn',
      logo: '💼',
      color: '#0A66C2'
    }
  }
  
  // TikTok patterns
  if (matchesDomain(hostname, ['tiktok.com'])) {
    return {
      name: 'TikTok',
      logo: '🎵',
      color: '#000000'
    }
  }
  
  // YouTube patterns
  if (matchesDomain(hostname, ['youtube.com', 'youtu.be'])) {
    return {
      name: 'YouTube',
      logo: '▶️',
      color: '#FF0000'
    }
  }
  
  // Reddit patterns
  if (matchesDomain(hostname, ['reddit.com'])) {
    return {
      name: 'Reddit',
      logo: '🤖',
      color: '#FF4500'
    }
  }
  
  // Pinterest patterns
  if (matchesDomain(hostname, ['pinterest.com'])) {
    return {
      name: 'Pinterest',
      logo: '📌',
      color: '#E60023'
    }
  }
  
  // Snapchat patterns
  if (matchesDomain(hostname, ['snapchat.com'])) {
    return {
      name: 'Snapchat',
      logo: '👻',
      color: '#FFFC00'
    }
  }
  
  // WhatsApp patterns
  if (matchesDomain(hostname, ['whatsapp.com', 'wa.me'])) {
    return {
      name: 'WhatsApp',
      logo: '💬',
      color: '#25D366'
    }
  }
  
  // Telegram patterns
  if (matchesDomain(hostname, ['telegram.org', 't.me'])) {
    return {
      name: 'Telegram',
      logo: '✈️',
      color: '#0088CC'
    }
  }
  
  // Discord patterns
  if (matchesDomain(hostname, ['discord.com', 'discord.gg'])) {
    return {
      name: 'Discord',
      logo: '🎮',
      color: '#5865F2'
    }
  }
  
  // Twitch patterns
  if (matchesDomain(hostname, ['twitch.tv'])) {
    return {
      name: 'Twitch',
      logo: '🎮',
      color: '#9146FF'
    }
  }
  
  // GitHub patterns
  if (matchesDomain(hostname, ['github.com'])) {
    return {
      name: 'GitHub',
      logo: '🐙',
      color: '#181717'
    }
  }
  
  return null
}
