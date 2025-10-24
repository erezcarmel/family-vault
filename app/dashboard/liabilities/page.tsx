'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHandHoldingDollar } from '@fortawesome/free-solid-svg-icons'

export default function Liabilities() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
          <FontAwesomeIcon icon={faHandHoldingDollar} className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liabilities</h1>
          <p className="text-gray-600">Manage your debts and liabilities</p>
        </div>
      </div>

      <div className="text-center py-20 card">
        <FontAwesomeIcon icon={faHandHoldingDollar} className="text-6xl text-gray-300 mb-4" />
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
        <p className="text-gray-600 mb-6">
          This feature is under development and will be available in a future update.
        </p>
        <div className="inline-block bg-red-100 text-red-700 px-4 py-2 rounded-lg">
          Feature in Development
        </div>
      </div>
    </div>
  )
}

