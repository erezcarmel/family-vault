'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

interface PageHeaderProps {
  title: string
  description?: string
  icon: IconDefinition
  iconBgClassName?: string
  onAddClick?: () => void
  addButtonLabel?: string
}

export default function PageHeader({
  title,
  description,
  icon,
  iconBgClassName = 'bg-indigo-500',
  onAddClick,
  addButtonLabel,
}: PageHeaderProps) {
  const showAddButton = onAddClick && addButtonLabel

  return (
    <div className={showAddButton ? 'flex items-center justify-between' : 'flex items-center space-x-4'}>
      <div className="flex items-center space-x-4">
        <div
          className={`md:w-12 md:h-12 w-8 h-8 rounded-lg flex items-center justify-center ${iconBgClassName}`}
        >
          <FontAwesomeIcon icon={icon} className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{title}</h1>
          {description && (
            <p className="text-gray-600 hidden md:block">{description}</p>
          )}
        </div>
      </div>
      {showAddButton && (
        <button onClick={onAddClick} className="btn-primary">
          <FontAwesomeIcon icon={faPlus} className="md:mr-2" />
          <span className="hidden md:inline">{addButtonLabel}</span>
        </button>
      )}
    </div>
  )
}
