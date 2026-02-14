import Sidebar from '@/components/Sidebar'
import StepsGuide from '@/components/StepsGuide'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 pt-20 md:p-8">
          {children}
        </div>
      </main>
      <StepsGuide />
    </div>
  )
}

