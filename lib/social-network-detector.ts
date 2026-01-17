// Social network detection and logo utilities

export interface SocialNetwork {
  name: string
  icon: string // FontAwesome icon name
  color: string // Brand color
}

export const detectSocialNetwork = (url: string): SocialNetwork | null => {
  if (!url) return null
  
  const lowerUrl = url.toLowerCase()
  
  // Facebook
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com') || lowerUrl.includes('fb.me')) {
    return {
      name: 'Facebook',
      icon: 'faFacebook',
      color: '#1877F2'
    }
  }
  
  // Twitter / X
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    return {
      name: 'Twitter / X',
      icon: 'faXTwitter',
      color: '#000000'
    }
  }
  
  // Instagram
  if (lowerUrl.includes('instagram.com')) {
    return {
      name: 'Instagram',
      icon: 'faInstagram',
      color: '#E4405F'
    }
  }
  
  // LinkedIn
  if (lowerUrl.includes('linkedin.com')) {
    return {
      name: 'LinkedIn',
      icon: 'faLinkedin',
      color: '#0A66C2'
    }
  }
  
  // YouTube
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return {
      name: 'YouTube',
      icon: 'faYoutube',
      color: '#FF0000'
    }
  }
  
  // TikTok
  if (lowerUrl.includes('tiktok.com')) {
    return {
      name: 'TikTok',
      icon: 'faTiktok',
      color: '#000000'
    }
  }
  
  // Snapchat
  if (lowerUrl.includes('snapchat.com')) {
    return {
      name: 'Snapchat',
      icon: 'faSnapchat',
      color: '#FFFC00'
    }
  }
  
  // Pinterest
  if (lowerUrl.includes('pinterest.com')) {
    return {
      name: 'Pinterest',
      icon: 'faPinterest',
      color: '#E60023'
    }
  }
  
  // Reddit
  if (lowerUrl.includes('reddit.com')) {
    return {
      name: 'Reddit',
      icon: 'faReddit',
      color: '#FF4500'
    }
  }
  
  // WhatsApp
  if (lowerUrl.includes('whatsapp.com') || lowerUrl.includes('wa.me')) {
    return {
      name: 'WhatsApp',
      icon: 'faWhatsapp',
      color: '#25D366'
    }
  }
  
  // Telegram
  if (lowerUrl.includes('telegram.org') || lowerUrl.includes('t.me')) {
    return {
      name: 'Telegram',
      icon: 'faTelegram',
      color: '#0088cc'
    }
  }
  
  // GitHub
  if (lowerUrl.includes('github.com')) {
    return {
      name: 'GitHub',
      icon: 'faGithub',
      color: '#181717'
    }
  }
  
  // Discord
  if (lowerUrl.includes('discord.com') || lowerUrl.includes('discord.gg')) {
    return {
      name: 'Discord',
      icon: 'faDiscord',
      color: '#5865F2'
    }
  }
  
  // Twitch
  if (lowerUrl.includes('twitch.tv')) {
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
