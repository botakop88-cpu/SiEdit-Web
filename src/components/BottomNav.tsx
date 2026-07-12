import { useLocation } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Users, FileText, Settings } from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/jobs', label: 'Job', icon: ListChecks },
  { path: '/vendors', label: 'Vendor', icon: Users },
  { path: '/invoices', label: 'Invoice', icon: FileText },
  { path: '/settings', label: 'Pengaturan', icon: Settings },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-40">
      {navItems.map(item => {
        const Icon = item.icon
        const isActive = location.pathname === item.path
        return (
          <a
            key={item.path}
            href={item.path}
            className={`flex-1 flex flex-col items-center gap-1 px-2 py-2.5 transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        )
      })}
    </nav>
  )
}