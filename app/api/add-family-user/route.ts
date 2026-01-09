import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, role, familyId } = await request.json()

    if (!email || !role || !familyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: currentUserRole } = await supabase
      .from('family_users')
      .select('role')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .single()

    if (currentUserRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: authUsers, error: listError } = await adminSupabase.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json({ 
        error: 'Failed to find user',
        message: 'Please ask the user to sign up first, then you can add them to your family.'
      }, { status: 500 })
    }

    const targetUser = authUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!targetUser) {
      return NextResponse.json({ 
        error: 'User not found',
        message: 'Please ask the user to sign up first, then you can add them to your family.'
      }, { status: 404 })
    }

    const { data: existingFamilyUser } = await supabase
      .from('family_users')
      .select('id')
      .eq('family_id', familyId)
      .eq('user_id', targetUser.id)
      .single()

    if (existingFamilyUser) {
      return NextResponse.json({ 
        error: 'User already exists',
        message: 'This user is already a member of your family.'
      }, { status: 409 })
    }

    const { data: newFamilyUser, error: insertError } = await supabase
      .from('family_users')
      .insert({
        family_id: familyId,
        user_id: targetUser.id,
        role: role,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: newFamilyUser })
  } catch (error: any) {
    console.error('Error adding family user:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

