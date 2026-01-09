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
  faUserCog
} from '@fortawesome/free-solid-svg-icons'
import { createClient } from '@/lib/supabase/client'
import { getFamilyId, getUserRole } from '@/lib/db-helpers-client'
import type { UserRole } from '@/types'

const navigationItems = [
  { href: '/dashboard', icon: faHome, label: 'Dashboard', category: null },
  { href: '/dashboard/money-accounts', icon: faDollarSign, label: 'Money Accounts', category: 'money_accounts' },
  { href: '/dashboard/insurance', icon: faShieldAlt, label: 'Insurance', category: 'insurance' },
  { href: '/dashboard/liabilities', icon: faHandHoldingDollar, label: 'Liabilities', category: 'liabilities' },
  { href: '/dashboard/healthcare', icon: faHeartPulse, label: 'Healthcare', category: 'healthcare_records' },
  { href: '/dashboard/digital-assets', icon: faLaptop, label: 'Digital Assets', category: 'digital_assets' },
  { href: '/dashboard/documents', icon: faFileAlt, label: 'Documents', category: null },
  { href: '/dashboard/family', icon: faUsers, label: 'Family Tree', category: null },
  { href: '/dashboard/executors', icon: faUserTie, label: 'Executors', category: null },
]

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [assetCounts, setAssetCounts] = useState<Record<string, number>>({})
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
        const { data: assets, error: assetsError } = await supabase
          .from('assets')
          .select('category')
          .eq('family_id', familyId)

        if (!assetsError && assets) {
          assets.forEach((asset) => {
            counts[asset.category] = (counts[asset.category] || 0) + 1
          })
        }

        // Fetch healthcare records count separately
        const { data: healthcareRecords, error: healthcareError } = await supabase
          .from('healthcare_records')
          .select('id')
          .eq('family_id', familyId)

        if (!healthcareError && healthcareRecords) {
          counts['healthcare_records'] = healthcareRecords.length
        }

        setAssetCounts(counts)
      } catch (error) {
        console.error('Sidebar - Error loading asset counts:', error)
      }
    }
    
    // Only load counts when on asset-related pages or initially
    const isAssetPage = pathname?.startsWith('/dashboard/money-accounts') ||
                       pathname?.startsWith('/dashboard/insurance') ||
                       pathname?.startsWith('/dashboard/liabilities') ||
                       pathname?.startsWith('/dashboard/healthcare') ||
                       pathname?.startsWith('/dashboard/digital-assets')
    
    if (isAssetPage || Object.keys(assetCounts).length === 0) {
      loadAssetCounts()
    }
  }, [supabase, pathname, assetCounts])

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

