import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import Vendors from './pages/Vendors'
import Invoices from './pages/Invoices'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex">
        <div className="hidden md:flex"><Sidebar /></div>
        
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        <div className="flex md:hidden fixed bottom-0 left-0 right-0 z-50"><BottomNav /></div>
      </div>
    </BrowserRouter>
  )
}

export default App
