import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as crypto from 'crypto'

// Helper function to hash passwords securely
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  // OWASP recommends at least 120,000 iterations for PBKDF2-SHA512
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { name, email, password, relationship_description, executor_id } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!relationship_description || typeof relationship_description !== 'string' || relationship_description.trim().length === 0) {
      return NextResponse.json({ error: 'Relationship description is required' }, { status: 400 })
    }

    // Get user's family ID
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (familyError || !family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    if (executor_id) {
      // Update existing executor
      const updateData: {
        name: string
        relationship_description: string
        password_hash?: string
      } = {
        name,
        relationship_description,
      }

      // Only update password if provided
      if (password) {
        updateData.password_hash = hashPassword(password)
      }

      const { error } = await supabase
        .from('executors')
        .update(updateData)
        .eq('id', executor_id)
        .eq('family_id', family.id) // Ensure user owns this executor

      if (error) {
        console.error('Error updating executor:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: 'Executor updated successfully' })
    } else {
      // Create new executor
      if (!password) {
        return NextResponse.json({ error: 'Password is required' }, { status: 400 })
      }

      const { error } = await supabase
        .from('executors')
        .insert({
          family_id: family.id,
          name,
          email,
          password_hash: hashPassword(password),
          relationship_description,
        })

      if (error) {
        console.error('Error creating executor:', error)
        if (error.code === '23505') {
          return NextResponse.json({ error: 'An executor with this email already exists for your family' }, { status: 400 })
        }
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: 'Executor created successfully' })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
