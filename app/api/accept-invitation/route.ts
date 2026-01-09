import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Missing invitation token' }, { status: 400 })
    }

    const { data: result, error } = await supabase.rpc('accept_invitation', {
      p_token: token,
      p_user_id: user.id
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (result && result.length > 0) {
      const { success, message } = result[0]
      if (!success) {
        return NextResponse.json({ error: message }, { status: 400 })
      }
      return NextResponse.json({ success: true, message })
    }

    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
  } catch (error: any) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

