import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import Vendors from './pages/Vendors'
import Invoices from './pages/Invoices'
import Settings from './pages/Settings'

function App() {
  const [isMobile] = useState(() => window.innerWidth < 768)

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex">
        {!isMobile && <Sidebar />}
        
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

        {isMobile && <BottomNav />}
      </div>
    </BrowserRouter>
  )
}

export default App
