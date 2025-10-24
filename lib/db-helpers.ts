import { createClient } from '@/lib/supabase/server'
import type { Family } from '@/types'

/**
 * Get or create a family for the authenticated user
 */
export async function getOrCreateFamily(userId: string, userName: string): Promise<Family | null> {
  const supabase = await createClient()
  
  // Try to get existing family
  const { data: existingFamily, error: fetchError } = await supabase
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

  return newFamily
}

/**
 * Get family for the authenticated user (client-side)
 */
export async function getFamilyId(supabase: any): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return family?.id || null
}

