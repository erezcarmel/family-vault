import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default async function Home() {
  // Check if environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Environment Variables Not Set
            </h1>
            <p className="text-gray-600 mb-6">
              This application requires Supabase credentials to run. Please configure the following environment variables:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
              <code className="text-sm text-gray-800 block space-y-2">
                <div className="font-semibold">Required Variables:</div>
                <div>• NEXT_PUBLIC_SUPABASE_URL</div>
                <div>• NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
                <div>• OPENAI_API_KEY</div>
              </code>
            </div>
            <div className="bg-indigo-50 rounded-lg p-6 text-left">
              <h3 className="font-semibold text-indigo-900 mb-3">For Vercel Deployment:</h3>
              <ol className="text-sm text-indigo-800 space-y-2 list-decimal list-inside">
                <li>Go to your Vercel project settings</li>
                <li>Navigate to "Environment Variables"</li>
                <li>Add all three required variables</li>
                <li>Redeploy your application</li>
              </ol>
              <a 
                href="https://github.com/YOUR_USERNAME/family-vault/blob/main/VERCEL_SETUP.md"
                className="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Setup Guide →
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Auth error:', error)
      redirect('/auth/signin')
    }

    if (user) {
      // Check if user has a family (completed onboarding)
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (familyError) {
        console.error('Family check error:', familyError)
      }

      if (family) {
        redirect('/dashboard')
      } else {
        redirect('/onboarding')
      }
    }

    redirect('/auth/signin')
  } catch (error) {
    console.error('Error in home page:', error)
    redirect('/auth/signin')
  }
}
