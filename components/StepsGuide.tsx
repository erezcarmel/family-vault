'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faTimes, faUsers, faEnvelope, faUserPlus, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { createClient } from '@/lib/supabase/client'
import { getFamilyId } from '@/lib/db-helpers-client'

interface StepStatus {
  id: string
  completed: boolean
}

export default function StepsGuide() {
  const [isOpen, setIsOpen] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [steps, setSteps] = useState<Record<string, StepStatus>>({
    familyMember: { id: 'familyMember', completed: false },
    recoveryEmail: { id: 'recoveryEmail', completed: false },
    invitation: { id: 'invitation', completed: false }
  })
  const router = useRouter()
  const supabase = createClient()

  const checkSteps = useCallback(async () => {
    try {
      const familyId = await getFamilyId(supabase)
      if (!familyId) {
        setSteps({
          familyMember: { id: 'familyMember', completed: false },
          recoveryEmail: { id: 'recoveryEmail', completed: false },
          invitation: { id: 'invitation', completed: false }
        })
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const adminEmail = user.email?.toLowerCase().trim()

      const [
        { count: familyMembersCount },
        { data: emailAccounts },
        { count: invitationsCount }
      ] = await Promise.all([
        supabase
          .from('family_members')
          .select('id', { count: 'exact', head: true })
          .eq('family_id', familyId),
        supabase
          .from('assets')
          .select('data')
          .eq('family_id', familyId)
          .eq('category', 'digital_assets')
          .eq('type', 'email_accounts'),
        supabase
          .from('invitations')
          .select('id', { count: 'exact', head: true })
          .eq('family_id', familyId)
      ])

      const hasFamilyMember = (familyMembersCount || 0) > 0
      
      const hasRecoveryEmail = emailAccounts?.some((asset: any) => {
        const email = asset.data?.email?.toLowerCase().trim()
        return email === adminEmail
      }) || false

      const hasInvitation = (invitationsCount || 0) > 0

      setSteps({
        familyMember: { id: 'familyMember', completed: hasFamilyMember },
        recoveryEmail: { id: 'recoveryEmail', completed: hasRecoveryEmail },
        invitation: { id: 'invitation', completed: hasInvitation }
      })
    } catch (error) {
      console.error('Error checking steps:', error)
      setSteps(
        Object.values(steps).reduce((acc, step) => {
          acc[step.id] = { ...step, completed: false }
          return acc
        }, {} as Record<string, StepStatus>)
      );
    }
  }, [supabase])

  useEffect(() => {
    checkSteps()

    const handleFocus = () => {
      checkSteps()
    }

    window.addEventListener('focus', handleFocus)
    
    const interval = setInterval(() => {
      checkSteps()
    }, 10000)

    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [checkSteps])

  const allCompleted = Object.values(steps).every(step => step.completed)

  if (allCompleted) {
    return null
  }

  return (
    <div className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-w-[calc(100vw-3rem)]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-between flex-1 text-left hover:opacity-80 transition-opacity"
          >
             <h3 className="flex items-center text-lg font-semibold text-gray-900">
               Getting Started
               <div className="flex items-center space-x-1 ml-2">
                {Object.values(steps).map((step: StepStatus) => (
                  <div key={step.id}>
                    <FontAwesomeIcon 
                      icon={faCheckCircle} 
                      className={`w-4 h-4 ${step.completed ? 'text-green-600' : 'text-gray-300'}`} 
                    />
                  </div>
                ))}
              </div>
             </h3>
            
             <div className="flex items-center space-x-1 ml-2">
              <FontAwesomeIcon 
                icon={isCollapsed ? faChevronUp : faChevronDown} 
                className="w-3 h-3 text-gray-400 ml-1 cursor-pointer"
              />
            </div>
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
            aria-label="Close guide"
          >
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
          </button>
        </div>
        
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}
          `}
        >
          <div className="p-4 space-y-4">
            <StepItem
              icon={faUsers}
              title="Add a Family Member"
              description="Add at least one family member to your family tree"
              completed={steps.familyMember.completed}
              onClick={() => router.push('/dashboard/family')}
            />
            
            <StepItem
              icon={faEnvelope}
              title="Add Recovery Email"
              description="Add your email account in Digital Assets for account recovery"
              completed={steps.recoveryEmail.completed}
              onClick={() => router.push('/dashboard/digital-assets')}
            />
            
            <StepItem
              icon={faUserPlus}
              title="Invite Family Member"
              description="Invite at least one family member to join the app"
              completed={steps.invitation.completed}
              onClick={() => router.push('/dashboard/users')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface StepItemProps {
  icon: any
  title: string
  description: string
  completed: boolean
  onClick: () => void
}

function StepItem({ icon, title, description, completed, onClick }: StepItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={completed}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        completed
          ? 'bg-green-50 border-green-200 cursor-default'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 cursor-pointer'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          completed ? 'bg-green-100' : 'bg-gray-200'
        }`}>
          {completed ? (
            <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-green-600" />
          ) : (
            <FontAwesomeIcon icon={icon} className="w-4 h-4 text-gray-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${completed ? 'text-green-900' : 'text-gray-900'}`}>
            {title}
          </h4>
          <p className={`text-xs mt-1 ${completed ? 'text-green-700' : 'text-gray-600'}`}>
            {description}
          </p>
        </div>
      </div>
    </button>
  )
}

