import { SupabaseClient } from '@supabase/supabase-js'
import type { Asset } from '@/types'

/**
 * Checks if an email address has a corresponding email asset with a recovery email
 * @param supabase - Supabase client instance
 * @param familyId - The family ID to search within
 * @param emailAddress - The email address to check
 * @returns Object with hasEmailAsset and hasRecoveryEmail flags
 */
export async function checkEmailRecoveryStatus(
  supabase: SupabaseClient,
  familyId: string,
  emailAddress: string
): Promise<{ hasEmailAsset: boolean; hasRecoveryEmail: boolean }> {
  try {
    // Search for an email asset with this email address
    // Only select needed fields to reduce data transfer
    const { data: emailAssets, error } = await supabase
      .from('assets')
      .select('id, data')
      .eq('family_id', familyId)
      .eq('category', 'digital_assets')
      .eq('type', 'email_accounts')

    if (error) {
      console.error('Error checking email recovery status:', error)
      return { hasEmailAsset: false, hasRecoveryEmail: false }
    }

    // Find the email asset with matching email
    const emailAsset = emailAssets?.find(
      (asset) => asset.data.email === emailAddress
    )

    if (!emailAsset) {
      return { hasEmailAsset: false, hasRecoveryEmail: false }
    }

    // Check if the email asset has a recovery email
    const hasRecoveryEmail = Boolean(emailAsset.data.recovery_email)

    return { hasEmailAsset: true, hasRecoveryEmail }
  } catch (error) {
    console.error('Error in checkEmailRecoveryStatus:', error)
    return { hasEmailAsset: false, hasRecoveryEmail: false }
  }
}

/**
 * Checks if a field name is likely to be an email field
 * @param fieldName - The field name to check
 * @returns true if the field name suggests it contains an email address
 * 
 * Note: Uses a whitelist approach instead of pattern matching to avoid false positives.
 * For example, a field named "email_notification_enabled" shouldn't be treated as an email field.
 * The whitelist includes common variations used in forms and databases.
 */
export function isEmailField(fieldName: string): boolean {
  const normalizedName = fieldName.toLowerCase().trim()
  // Check for exact matches or common email field patterns
  const emailFieldPatterns = [
    'email',
    'email_address',
    'emailaddress',
    'contact_email',
    'contactemail',
    'user_email',
    'useremail',
    'account_email',
    'accountemail'
  ]
  return emailFieldPatterns.includes(normalizedName)
}

/**
 * HTML5 email validation pattern following RFC 5322 standard
 * Pattern breakdown:
 * - Local part: [a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+ (alphanumeric and special chars)
 * - @ symbol
 * - Domain part: alphanumeric with optional hyphens, separated by dots
 * - Top-level domain: at least one dot followed by alphanumeric chars
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * Validates if a string is a valid email format
 * @param value - The value to validate
 * @returns true if the value is a valid email format
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value)
}
