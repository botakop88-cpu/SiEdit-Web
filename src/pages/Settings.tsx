import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Settings() {
  const [jobCount, setJobCount] = useState(0)
  const [vendorCount, setVendorCount] = useState(0)
  const [invoiceCount, setInvoiceCount] = useState(0)
  const [showRecycleBin, setShowRecycleBin] = useState(false)
  const [deletedJobs, setDeletedJobs] = useState<any[]>([])
  const [deletedVendors, setDeletedVendors] = useState<any[]>([])
  const [deletedInvoices, setDeletedInvoices] = useState<any[]>([])
  const [recycleBinTab, setRecycleBinTab] = useState<'job' | 'vendor' | 'invoice'>('job')

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
    window.open('https://docs.google.com/spreadsheets/d/15Y34AZ_spyNOL0l9Y0Zrvdcbbd0qMeDPtKBTNNiQwjQ/edit?gid=1821736230#gid=1821736230', '_blank')
  }

  async function loadRecycleBin() {
    const [jobs, vendors, invoices] = await Promise.all([
      supabase.from('job').select('*, vendor:vendor_id(nama)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
      supabase.from('vendor').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
      supabase.from('invoice').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    ])
    if (jobs.data) setDeletedJobs(jobs.data)
    if (vendors.data) setDeletedVendors(vendors.data)
    if (invoices.data) setDeletedInvoices(invoices.data)
    setShowRecycleBin(true)
  }

  async function restoreJob(id: string) {
    await supabase.from('job').update({ deleted_at: null }).eq('id', id)
    loadRecycleBin()
  }

  async function restoreVendor(id: string) {
    await supabase.from('vendor').update({ deleted_at: null }).eq('id', id)
    loadRecycleBin()
  }

  async function restoreInvoice(id: string) {
    await supabase.from('invoice').update({ deleted_at: null }).eq('id', id)
    loadRecycleBin()
  }

  async function deletePermanentJob(id: string) {
    if (!confirm('Hapus permanen job ini? Tidak bisa dipulihkan!')) return
    await supabase.from('job').delete().eq('id', id)
    loadRecycleBin()
  }

  async function deletePermanentVendor(id: string) {
    if (!confirm('Hapus permanen vendor ini? Tidak bisa dipulihkan!')) return
    await supabase.from('vendor').delete().eq('id', id)
    loadRecycleBin()
  }

  async function deletePermanentInvoice(id: string) {
    if (!confirm('Hapus permanen invoice ini? Tidak bisa dipulihkan!')) return
    await supabase.from('invoice').delete().eq('id', id)
    loadRecycleBin()
  }

  async function emptyTrash() {
    if (!confirm('Kosongkan Recycle Bin? Semua item akan dihapus permanen dan tidak bisa dipulihkan!')) return
    await Promise.all([
      supabase.from('job').delete().not('deleted_at', 'is', null),
      supabase.from('vendor').delete().not('deleted_at', 'is', null),
      supabase.from('invoice').delete().not('deleted_at', 'is', null),
    ])
    loadRecycleBin()
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

        {/* Backup */}
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

        {/* Recycle Bin */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Recycle Bin</h3>
          <p className="text-sm text-slate-500 mb-4">
            Item yang dihapus bisa dipulihkan dari sini. Hapus permanen untuk menghapus selamanya.
          </p>
          <button onClick={loadRecycleBin} className="flex items-center gap-2 w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Buka Recycle Bin
          </button>
        </div>
      </div>

      {/* Recycle Bin Modal */}
      {showRecycleBin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowRecycleBin(false)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recycle Bin</h3>
              <button onClick={() => setShowRecycleBin(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex gap-1 p-2 bg-slate-100">
              <button onClick={() => setRecycleBinTab('job')} className={`px-4 py-2 text-sm font-medium rounded ${recycleBinTab === 'job' ? 'bg-white text-slate-900' : 'text-slate-500'}`}>Job ({deletedJobs.length})</button>
              <button onClick={() => setRecycleBinTab('vendor')} className={`px-4 py-2 text-sm font-medium rounded ${recycleBinTab === 'vendor' ? 'bg-white text-slate-900' : 'text-slate-500'}`}>Vendor ({deletedVendors.length})</button>
              <button onClick={() => setRecycleBinTab('invoice')} className={`px-4 py-2 text-sm font-medium rounded ${recycleBinTab === 'invoice' ? 'bg-white text-slate-900' : 'text-slate-500'}`}>Invoice ({deletedInvoices.length})</button>
              <div className="flex-1"></div>
              <button onClick={emptyTrash} className="px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700">Kosongkan Sampah</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {recycleBinTab === 'job' && (
                deletedJobs.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Tidak ada job terhapus.</p>
                ) : (
                  <div className="space-y-2">
                    {deletedJobs.map(job => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                        <div>
                          <p className="font-medium text-sm">{job.nama_project}</p>
                          <p className="text-xs text-slate-500">{job.vendor?.nama || '-'} · Dihapus {new Date(job.deleted_at).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => restoreJob(job.id)} className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Pulihkan</button>
                          <button onClick={() => deletePermanentJob(job.id)} className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Hapus Permanen</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {recycleBinTab === 'vendor' && (
                deletedVendors.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Tidak ada vendor terhapus.</p>
                ) : (
                  <div className="space-y-2">
                    {deletedVendors.map(vendor => (
                      <div key={vendor.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                        <div>
                          <p className="font-medium text-sm">{vendor.nama}</p>
                          <p className="text-xs text-slate-500">Dihapus {new Date(vendor.deleted_at).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => restoreVendor(vendor.id)} className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Pulihkan</button>
                          <button onClick={() => deletePermanentVendor(vendor.id)} className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Hapus Permanen</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {recycleBinTab === 'invoice' && (
                deletedInvoices.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Tidak ada invoice terhapus.</p>
                ) : (
                  <div className="space-y-2">
                    {deletedInvoices.map(invoice => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                        <div>
                          <p className="font-medium text-sm">{invoice.vendor_nama}</p>
                          <p className="text-xs text-slate-500">Rp{invoice.total.toLocaleString('id-ID')} · Dihapus {new Date(invoice.deleted_at).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => restoreInvoice(invoice.id)} className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Pulihkan</button>
                          <button onClick={() => deletePermanentInvoice(invoice.id)} className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Hapus Permanen</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
