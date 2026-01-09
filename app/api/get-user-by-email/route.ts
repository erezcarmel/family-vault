import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
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
      return NextResponse.json({ error: 'Failed to find user' }, { status: 500 })
    }

    const targetUser = authUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ userId: targetUser.id, email: targetUser.email })
  } catch (error: any) {
    console.error('Error getting user by email:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

