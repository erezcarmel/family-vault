import type { UserRole } from '@/types'

export async function getFamilyId(supabase: any): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: familyUser, error: familyUserError } = await supabase
    .from('family_users')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (familyUser && !familyUserError) {
    return familyUser.family_id
  }

  const { data: family, error: familyError } = await supabase
    .from('families')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (family && !familyError) {
    return family.id
  }

  return null
}

export async function getUserRole(supabase: any, familyId: string): Promise<UserRole | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: familyUser, error } = await supabase
    .from('family_users')
    .select('role')
    .eq('family_id', familyId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error getting user role:', error)
    return null
  }

  return familyUser?.role || null
}

export async function isAdmin(supabase: any, familyId: string): Promise<boolean> {
  const role = await getUserRole(supabase, familyId)
  return role === 'admin'
}

export async function isEditorOrAdmin(supabase: any, familyId: string): Promise<boolean> {
  const role = await getUserRole(supabase, familyId)
  return role === 'admin' || role === 'editor'
}

