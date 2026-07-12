import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Settings() {
  const [jobCount, setJobCount] = useState(0)
  const [vendorCount, setVendorCount] = useState(0)
  const [invoiceCount, setInvoiceCount] = useState(0)

  useEffect(() => {
    Promise.all([
      supabase.from('job').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('vendor').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('invoice').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    ]).then(([jobs, vendors, invoices]) => {
      if (jobs.count) setJobCount(jobs.count)
      if (vendors.count) setVendorCount(vendors.count)
      if (invoices.count) setInvoiceCount(invoices.count)
    })
  }, [])

  function openSheet() {
    window.open('https://docs.google.com/spreadsheets/d/1xc5AIj93ssn8M3YCIRUT8-oG8AEg5c0cJ8e8POqYdNY/edit?usp=sharing', '_blank')
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 md:px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Pengaturan</h2>
        <p className="text-sm text-slate-500">Konfigurasi aplikasi</p>
      </header>

      <div className="p-4 md:p-6 space-y-4 max-w-2xl">
        {/* Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Informasi Aplikasi</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Versi</dt><dd className="font-medium">1.7.1 Web</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Database</dt><dd className="font-medium">Supabase (PostgreSQL)</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Mode</dt><dd className="font-medium">Online / Single User</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Total Job Aktif</dt><dd className="font-medium">{jobCount}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Total Vendor</dt><dd className="font-medium">{vendorCount}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Total Invoice</dt><dd className="font-medium">{invoiceCount}</dd></div>
          </dl>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Lokasi Data</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Hosting</dt><dd className="font-medium">Vercel</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Database</dt><dd className="font-medium">Supabase Cloud</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Region</dt><dd className="font-medium">Singapore</dd></div>
          </dl>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Backup & Sync</h3>
          <p className="text-sm text-slate-500 mb-4">
            Data otomatis tersimpan di Supabase. Backup harian ke Google Sheet berjalan otomatis tiap jam 02:00.
          </p>
          <div className="space-y-2">
            <button onClick={openSheet} className="flex items-center gap-2 w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
              Buka Google Sheet Backup
            </button>
            <button onClick={() => window.open('https://supabase.com/dashboard/project/etczyvlsiebdvosxdegd/settings/database', '_blank')} className="flex items-center gap-2 w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
              Buka Dashboard Supabase
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
