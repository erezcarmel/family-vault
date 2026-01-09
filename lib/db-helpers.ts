import { createClient } from '@/lib/supabase/server'
import type { Family, UserRole } from '@/types'

/**
 * Get or create a family for the authenticated user
 */
export async function getOrCreateFamily(userId: string, userName: string): Promise<Family | null> {
  const supabase = await createClient()
  
  // Try to get existing family through family_users
  const { data: familyUser } = await supabase
    .from('family_users')
    .select('family_id, families(*)')
    .eq('user_id', userId)
    .single()

  if (familyUser && familyUser.families) {
    const families = Array.isArray(familyUser.families) 
      ? familyUser.families[0] 
      : familyUser.families
    if (families) {
      return families as Family
    }
  }

  // Try legacy method (for backward compatibility)
  const { data: existingFamily } = await supabase
    .from('families')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existingFamily) {
    return existingFamily
  }

  // Create new family if it doesn't exist
  const { data: newFamily, error: createError } = await supabase
    .from('families')
    .insert({
      user_id: userId,
      main_user: userName,
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating family:', createError)
    return null
  }

  if (newFamily) {
    // Create family_users entry with admin role
    await supabase
      .from('family_users')
      .insert({
        family_id: newFamily.id,
        user_id: userId,
        role: 'admin',
      })
  }

  return newFamily
}

/**
 * Get family ID for the authenticated user (client-side)
 */
export async function getFamilyId(supabase: any): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: familyUser } = await supabase
    .from('family_users')
    .select('family_id')
    .eq('user_id', user.id)
    .single()

  if (familyUser) {
    return familyUser.family_id
  }

  // Fallback to legacy method
  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return family?.id || null
}

/**
 * Get user role for a family (client-side)
 */
export async function getUserRole(supabase: any, familyId: string): Promise<UserRole | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: familyUser } = await supabase
    .from('family_users')
    .select('role')
    .eq('family_id', familyId)
    .eq('user_id', user.id)
    .single()

  return familyUser?.role || null
}

/**
 * Check if user is admin (client-side)
 */
export async function isAdmin(supabase: any, familyId: string): Promise<boolean> {
  const role = await getUserRole(supabase, familyId)
  return role === 'admin'
}

/**
 * Check if user is editor or admin (client-side)
 */
export async function isEditorOrAdmin(supabase: any, familyId: string): Promise<boolean> {
  const role = await getUserRole(supabase, familyId)
  return role === 'admin' || role === 'editor'
}

