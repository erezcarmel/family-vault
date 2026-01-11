'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHome,
  faDollarSign,
  faShieldAlt,
  faHandHoldingDollar,
  faHeartPulse,
  faLaptop,
  faFileAlt,
  faUsers,
  faSignOutAlt,
  faBars,
  faTimes,
  faVault,
  faUserTie,
  faUserCog,
  faChevronDown,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons'
import { createClient } from '@/lib/supabase/client'
import { getFamilyId, getUserRole } from '@/lib/db-helpers-client'
import type { UserRole } from '@/types'

const navigationItems = [
  { href: '/dashboard', icon: faHome, label: 'Dashboard', category: null },
]

const assetItems = [
  { href: '/dashboard/money-accounts', icon: faDollarSign, label: 'Money Accounts', category: 'money_accounts' },
  { href: '/dashboard/insurance', icon: faShieldAlt, label: 'Insurance', category: 'insurance' },
  { href: '/dashboard/liabilities', icon: faHandHoldingDollar, label: 'Liabilities', category: 'liabilities' },
  { href: '/dashboard/healthcare', icon: faHeartPulse, label: 'Healthcare', category: 'healthcare_records' },
  { href: '/dashboard/digital-assets', icon: faLaptop, label: 'Digital Assets', category: 'digital_assets' },
  { href: '/dashboard/documents', icon: faFileAlt, label: 'Documents', category: 'documents' },
]

const nonAssetItems = [
  { href: '/dashboard/family', icon: faUsers, label: 'Family Tree', category: 'family_members' },
  { href: '/dashboard/executors', icon: faUserTie, label: 'Executors', category: null },
]

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAssetsExpanded, setIsAssetsExpanded] = useState(true)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [assetCounts, setAssetCounts] = useState<Record<string, number>>({})
  const [countsLoaded, setCountsLoaded] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const familyId = await getFamilyId(supabase)
        if (familyId) {
          const role = await getUserRole(supabase, familyId)
          console.log('Sidebar - Family ID:', familyId, 'Role:', role)
          setUserRole(role)
        } else {
          console.log('Sidebar - No family ID found')
        }
      } catch (error) {
        console.error('Sidebar - Error loading user role:', error)
      }
    }
    loadUserRole()
  }, [supabase])

  useEffect(() => {
    const loadAssetCounts = async () => {
      try {
        const familyId = await getFamilyId(supabase)
        if (!familyId) return

        const counts: Record<string, number> = {}

        // Fetch asset counts for money_accounts, insurance, liabilities, digital_assets
        // We need to fetch category data to group by category
        const { data: assets, error: assetsError } = await supabase
          .from('assets')
          .select('category')
          .eq('family_id', familyId)

        if (!assetsError && assets) {
          assets.forEach((asset) => {
            counts[asset.category] = (counts[asset.category] || 0) + 1
          })
        }

        // Fetch counts for healthcare records, documents, and family members in parallel
        const [
          { count: healthcareCount, error: healthcareError },
          { count: documentsCount, error: documentsError },
          { count: familyMembersCount, error: familyMembersError }
        ] = await Promise.all([
          supabase
            .from('healthcare_records')
            .select('id', { count: 'exact', head: true })
            .eq('family_id', familyId),
          supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .eq('family_id', familyId),
          supabase
            .from('family_members')
            .select('id', { count: 'exact', head: true })
            .eq('family_id', familyId)
        ])

        if (!healthcareError && healthcareCount !== null) {
          counts['healthcare_records'] = healthcareCount
        } else if (healthcareError) {
          console.error('Sidebar - Error loading healthcare records count:', healthcareError)
        }

        if (!documentsError && documentsCount !== null) {
          counts['documents'] = documentsCount
        } else if (documentsError) {
          console.error('Sidebar - Error loading documents count:', documentsError)
        }

        if (!familyMembersError && familyMembersCount !== null) {
          counts['family_members'] = familyMembersCount
        } else if (familyMembersError) {
          console.error('Sidebar - Error loading family members count:', familyMembersError)
        }

        setAssetCounts(counts)
        setCountsLoaded(true)
      } catch (error) {
        console.error('Sidebar - Error loading asset counts:', error)
      }
    }
    
    // Only load counts when on asset-related pages or on initial load
    const allItems = [...navigationItems, ...assetItems, ...nonAssetItems]
    const isAssetPage = allItems.some(item => item.category && pathname?.startsWith(item.href))
    
    if (isAssetPage || !countsLoaded) {
      loadAssetCounts()
    }
  }, [supabase, pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-indigo-600 text-white p-3 rounded-lg shadow-lg"
      >
        <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
      </button>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faVault} className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Family Vault</h1>
                <p className="text-xs text-gray-500">Family Asset Management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {/* Dashboard */}
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                const count = item.category ? (assetCounts[item.category] || 0) : null
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center justify-between px-4 py-3 rounded-lg
                        transition-colors duration-200
                        ${isActive
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={item.icon} className="w-5" />
                        <span>{item.label}</span>
                      </div>
                      {count !== null && (
                        <span className={`
                          text-xs font-semibold px-2 py-1 rounded-full
                          ${isActive
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-gray-100 text-gray-600'
                          }
                        `}>
                          {count}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}

              {/* Family Assets - Collapsible Section */}
              <li>
                <button
                  onClick={() => setIsAssetsExpanded(!isAssetsExpanded)}
                  aria-expanded={isAssetsExpanded}
                  aria-controls="family-assets-list"
                  className="flex items-center justify-between px-4 py-3 rounded-lg w-full
                    text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon 
                      icon={isAssetsExpanded ? faChevronDown : faChevronRight} 
                      className="w-4 text-gray-500"
                      aria-hidden="true"
                    />
                    <span className="font-medium">Family Assets</span>
                  </div>
                </button>
                
                {isAssetsExpanded && (
                  <ul id="family-assets-list" className="mt-1 space-y-1">
                    {assetItems.map((item) => {
                      const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                      const count = item.category ? (assetCounts[item.category] || 0) : null
                      
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`
                              flex items-center justify-between px-4 py-3 rounded-lg ml-6
                              transition-colors duration-200
                              ${isActive
                                ? 'bg-indigo-50 text-indigo-600 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="flex items-center space-x-3">
                              <FontAwesomeIcon icon={item.icon} className="w-5" />
                              <span>{item.label}</span>
                            </div>
                            {count !== null && (
                              <span className={`
                                text-xs font-semibold px-2 py-1 rounded-full
                                ${isActive
                                  ? 'bg-indigo-100 text-indigo-600'
                                  : 'bg-gray-100 text-gray-600'
                                }
                              `}>
                                {count}
                              </span>
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>

              {/* Non-Asset Items */}
              {nonAssetItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                const count = item.category ? (assetCounts[item.category] || 0) : null
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center justify-between px-4 py-3 rounded-lg
                        transition-colors duration-200
                        ${isActive
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={item.icon} className="w-5" />
                        <span>{item.label}</span>
                      </div>
                      {count !== null && (
                        <span className={`
                          text-xs font-semibold px-2 py-1 rounded-full
                          ${isActive
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-gray-100 text-gray-600'
                          }
                        `}>
                          {count}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
              
              {/* User Management (Admin Only) */}
              {userRole === 'admin' && (
                <li>
                  <Link
                    href="/dashboard/users"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center justify-between px-4 py-3 rounded-lg
                      transition-colors duration-200
                      ${pathname === '/dashboard/users'
                        ? 'bg-indigo-50 text-indigo-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <FontAwesomeIcon icon={faUserCog} className="w-5" />
                      <span>User Management</span>
                    </div>
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full
                text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

