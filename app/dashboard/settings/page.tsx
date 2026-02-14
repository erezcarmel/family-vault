'use client'

import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog, faUsers, faUser } from '@fortawesome/free-solid-svg-icons'
import PageHeader from '@/components/PageHeader'

export default function Settings() {
  const router = useRouter()

  const settingsOptions = [
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage family members and their permissions',
      icon: faUsers,
      href: '/dashboard/users',
      color: 'bg-purple-500'
    },
    {
      id: 'my-profile',
      title: 'My Profile',
      description: 'View and manage your profile information',
      icon: faUser,
      href: '/dashboard/profile',
      color: 'bg-indigo-500'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <PageHeader
          title="Settings"
          description="Manage your account settings and preferences"
          icon={faCog}
          iconBgClassName="bg-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => router.push(option.href)}
            className="card text-left hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
          >
            <div className="flex items-start space-x-4">
              <div className={`${option.color} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                <FontAwesomeIcon icon={option.icon} className="text-white text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors duration-200">
                  {option.title}
                </h3>
                <p className="text-gray-600">{option.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

