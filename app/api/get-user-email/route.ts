import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
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

    const { data: user, error } = await adminSupabase.auth.admin.getUserById(userId)

    if (error || !user) {
      return NextResponse.json({ email: 'Unknown' }, { status: 200 })
    }

    return NextResponse.json({ email: user.user.email || 'Unknown' })
  } catch (error: any) {
    console.error('Error getting user email:', error)
    return NextResponse.json({ email: 'Unknown' }, { status: 200 })
  }
}

