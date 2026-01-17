// Social network detection and logo utilities

export interface SocialNetwork {
  name: string
  icon: string // FontAwesome icon name
  color: string // Brand color
}

export const detectSocialNetwork = (url: string): SocialNetwork | null => {
  if (!url) return null
  
  const lowerUrl = url.toLowerCase()
  
  // Parse URL to get hostname
  let hostname = ''
  try {
    const urlObj = new URL(lowerUrl.startsWith('http') ? lowerUrl : `https://${lowerUrl}`)
    hostname = urlObj.hostname.replace(/^www\./, '')
  } catch {
    // If URL parsing fails, try simple string matching
    hostname = lowerUrl
  }
  
  // Facebook
  if (hostname === 'facebook.com' || hostname === 'fb.com' || hostname === 'fb.me' || hostname.endsWith('.facebook.com')) {
    return {
      name: 'Facebook',
      icon: 'faFacebook',
      color: '#1877F2'
    }
  }
  
  // Twitter / X
  if (hostname === 'twitter.com' || hostname === 'x.com' || hostname.endsWith('.twitter.com') || hostname.endsWith('.x.com')) {
    return {
      name: 'Twitter / X',
      icon: 'faXTwitter',
      color: '#000000'
    }
  }
  
  // Instagram
  if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) {
    return {
      name: 'Instagram',
      icon: 'faInstagram',
      color: '#E4405F'
    }
  }
  
  // LinkedIn
  if (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')) {
    return {
      name: 'LinkedIn',
      icon: 'faLinkedin',
      color: '#0A66C2'
    }
  }
  
  // YouTube
  if (hostname === 'youtube.com' || hostname === 'youtu.be' || hostname.endsWith('.youtube.com')) {
    return {
      name: 'YouTube',
      icon: 'faYoutube',
      color: '#FF0000'
    }
  }
  
  // TikTok
  if (hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com')) {
    return {
      name: 'TikTok',
      icon: 'faTiktok',
      color: '#000000'
    }
  }
  
  // Snapchat
  if (hostname === 'snapchat.com' || hostname.endsWith('.snapchat.com')) {
    return {
      name: 'Snapchat',
      icon: 'faSnapchat',
      color: '#FFFC00'
    }
  }
  
  // Pinterest
  if (hostname === 'pinterest.com' || hostname.endsWith('.pinterest.com')) {
    return {
      name: 'Pinterest',
      icon: 'faPinterest',
      color: '#E60023'
    }
  }
  
  // Reddit
  if (hostname === 'reddit.com' || hostname.endsWith('.reddit.com')) {
    return {
      name: 'Reddit',
      icon: 'faReddit',
      color: '#FF4500'
    }
  }
  
  // WhatsApp
  if (hostname === 'whatsapp.com' || hostname === 'wa.me' || hostname.endsWith('.whatsapp.com')) {
    return {
      name: 'WhatsApp',
      icon: 'faWhatsapp',
      color: '#25D366'
    }
  }
  
  // Telegram
  if (hostname === 'telegram.org' || hostname === 't.me' || hostname.endsWith('.telegram.org')) {
    return {
      name: 'Telegram',
      icon: 'faTelegram',
      color: '#0088cc'
    }
  }
  
  // GitHub
  if (hostname === 'github.com' || hostname.endsWith('.github.com')) {
    return {
      name: 'GitHub',
      icon: 'faGithub',
      color: '#181717'
    }
  }
  
  // Discord
  if (hostname === 'discord.com' || hostname === 'discord.gg' || hostname.endsWith('.discord.com')) {
    return {
      name: 'Discord',
      icon: 'faDiscord',
      color: '#5865F2'
    }
  }
  
  // Twitch
  if (hostname === 'twitch.tv' || hostname.endsWith('.twitch.tv')) {
    return {
      name: 'Twitch',
      icon: 'faTwitch',
      color: '#9146FF'
    }
  }
  
  return null
}

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    // Try adding https:// if missing
    try {
      new URL(`https://${url}`)
      return true
    } catch {
      return false
    }
  }
}

export const normalizeUrl = (url: string): string => {
  if (!url) return ''
  
  try {
    new URL(url)
    return url
  } catch {
    // Try adding https:// if missing
    try {
      new URL(`https://${url}`)
      return `https://${url}`
    } catch {
      return url
    }
  }
}
