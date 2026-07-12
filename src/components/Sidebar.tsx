import { useLocation } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Users, FileText, Settings } from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/jobs', label: 'Daftar Job', icon: ListChecks },
  { path: '/vendors', label: 'Vendor', icon: Users },
  { path: '/invoices', label: 'Invoice', icon: FileText },
  { path: '/settings', label: 'Pengaturan', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden md:flex md:w-64 min-h-screen bg-slate-900 flex-col text-white">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold">SiEdit</h1>
        <p className="text-xs text-slate-500 mt-1">Wedding Job Tracker</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <a
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </a>
          )
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">v1.7.1 Web</p>
      </div>
    </aside>
  )
}