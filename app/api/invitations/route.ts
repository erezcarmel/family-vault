import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendInvitationEmail } from '@/lib/email'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const familyId = searchParams.get('familyId')

    if (!familyId) {
      return NextResponse.json({ error: 'Missing familyId' }, { status: 400 })
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

    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: invitations || [] })
  } catch (error: any) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

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

    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('family_id', familyId)
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvitation) {
      return NextResponse.json({ 
        error: 'Invitation already exists',
        message: 'A pending invitation already exists for this email.'
      }, { status: 409 })
    }

    const { data: newInvitation, error: insertError } = await supabase
      .from('invitations')
      .insert({
        family_id: familyId,
        email: email.toLowerCase().trim(),
        role: role,
        invited_by: user.id,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Get family name for email
    const { data: family } = await supabase
      .from('families')
      .select('family_name, main_user')
      .eq('id', familyId)
      .single()

    const familyName = family?.family_name || family?.main_user || 'your family'

    // Send invitation email
    try {
      await sendInvitationEmail({
        to: email.toLowerCase().trim(),
        invitationToken: newInvitation.token,
        role: role,
        familyName: familyName,
        inviterName: user.email || 'Family Admin',
      })
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      // Don't fail the request if email fails - invitation is still created
    }

    return NextResponse.json({ success: true, data: newInvitation })
  } catch (error: any) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')

    if (!invitationId) {
      return NextResponse.json({ error: 'Missing invitation id' }, { status: 400 })
    }

    const { data: invitation } = await supabase
      .from('invitations')
      .select('family_id')
      .eq('id', invitationId)
      .single()

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    const { data: currentUserRole } = await supabase
      .from('family_users')
      .select('role')
      .eq('family_id', invitation.family_id)
      .eq('user_id', user.id)
      .single()

    if (currentUserRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting invitation:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

