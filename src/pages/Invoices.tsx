import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Vendor } from '../lib/types'
import { rupiah, formatTanggal } from '../lib/utils'
import { FileText } from 'lucide-react'

export default function Invoices() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendor, setSelectedVendor] = useState('')
  const [unpaidJobs, setUnpaidJobs] = useState<any[]>([])
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [invoices, setInvoices] = useState<any[]>([])
  const [tab, setTab] = useState<'buat' | 'riwayat'>('buat')

  useEffect(() => {
    supabase.from('vendor').select('*').is('deleted_at', null).order('nama').then(r => { if (r.data) setVendors(r.data) })
    loadInvoices()
  }, [])

  async function loadInvoices() {
    const { data } = await supabase.from('invoice').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    if (data) setInvoices(data)
  }

  async function onVendorChange(vendorId: string) {
    setSelectedVendor(vendorId)
    if (!vendorId) { setUnpaidJobs([]); return }
    const { data } = await supabase.from('job').select('*').eq('vendor_id', vendorId).eq('status_bayar', 'Belum Bayar').is('deleted_at', null)
    if (data) {
      setUnpaidJobs(data)
      setSelectedJobs(new Set(data.map(j => j.id)))
    }
  }

  function toggleJob(id: string) {
    const s = new Set(selectedJobs)
    if (s.has(id)) s.delete(id); else s.add(id)
    setSelectedJobs(s)
  }

  async function generateInvoice() {
    if (!selectedVendor || selectedJobs.size === 0) { alert('Pilih vendor dan minimal 1 job.'); return }
    const v = vendors.find(x => x.id === selectedVendor)
    if (!v) return

    const { data: jobs } = await supabase.from('job').select('*').in('id', [...selectedJobs])
    if (!jobs) return

    const total = jobs.reduce((s, j) => s + j.harga, 0)
    const items = jobs.map(j => ({ nama: j.nama_project, harga: j.harga, jenis: j.jenis_edit }))

    const { count } = await supabase.from('invoice').select('id', { count: 'exact', head: true })
    const no = String((count || 0) + 1).padStart(4, '0')
    const invNo = `INV-${no}`

    const { error } = await supabase.from('invoice').insert({
      vendor_id: v.id,
      vendor_nama: v.nama,
      tanggal: new Date().toISOString().split('T')[0],
      items_json: JSON.stringify(items),
      total,
      status_bayar: 'Belum Bayar',
      created_at: new Date().toISOString(),
    })

    if (error) { alert('Gagal buat invoice'); return }

    const win = window.open('', '_blank')
    if (!win) { alert('Pop-up diblokir. Izinkan pop-up untuk membuka PDF.'); return }
    generatePDF(win, invNo, v.nama, new Date().toLocaleDateString('id-ID'), items, total)

    loadInvoices()
    setSelectedVendor('')
    setSelectedJobs(new Set())
    setTab('riwayat')
  }

  function reopenInvoice(inv: any) {
    const win = window.open('', '_blank')
    if (!win) { alert('Pop-up diblokir. Izinkan pop-up untuk membuka PDF.'); return }
    const items = JSON.parse(inv.items_json || '[]')
    generatePDF(win, inv.id.slice(0, 8).toUpperCase(), inv.vendor_nama, inv.tanggal, items, inv.total)
  }

  async function toggleStatus(inv: any, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Ubah status invoice ${inv.vendor_nama} menjadi ${inv.status_bayar === 'Lunas' ? 'Belum Bayar' : 'Lunas'}?`)) return
    const baru = inv.status_bayar === 'Lunas' ? 'Belum Bayar' : 'Lunas'
    const { error } = await supabase.from('invoice').update({ status_bayar: baru }).eq('id', inv.id)
    if (error) { alert('Gagal ubah status'); return }
    // Update status_bayar job yg terkait
    const items = JSON.parse(inv.items_json || '[]')
    items.forEach(function(it) {
      supabase.from('job').update({ status_bayar: baru }).eq('nama_project', it.nama).is('deleted_at', null).then()
    })
    loadInvoices()
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Hapus invoice ini?')) return
    const { error } = await supabase.from('invoice').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) { alert('Gagal hapus'); return }
    loadInvoices()
  }

  function generatePDF(win: Window, no: string, vendorNama: string, tanggal: string, items: { nama: string; harga: number; jenis: string }[], total: number) {
    win.document.write(`
      <!doctype html>
      <html><head>
        <meta charset="utf-8">
        <title>Invoice ${no}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 210mm; margin: 20mm auto; padding: 0 20mm; color: #333; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { font-size: 24px; margin: 0; }
          .header p { color: #666; margin: 4px 0 0; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .meta div { font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #ddd; font-size: 14px; }
          th { background: #f5f5f5; font-weight: 600; }
          .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 10px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
          @media print { body { margin: 0; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>${no}</p>
        </div>
        <div class="meta">
          <div><strong>Kepada:</strong><br>${vendorNama}</div>
          <div><strong>Tanggal:</strong><br>${tanggal}</div>
        </div>
        <table>
          <thead><tr><th>No</th><th>Project</th><th>Jenis</th><th style="text-align:right">Harga</th></tr></thead>
          <tbody>
            ${items.map((item, i) => `
              <tr><td>${i + 1}</td><td>${item.nama}</td><td>${item.jenis}</td><td style="text-align:right">${rupiah(item.harga)}</td></tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">Total: ${rupiah(total)}</div>
        <div class="footer">Invoice ini dibuat otomatis oleh SiEdit Web</div>
        <script>
          window.onload = function() { window.print(); }
        <\/script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 md:px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Invoice</h2>
        <p className="text-sm text-slate-500">Buat dan kelola invoice</p>
      </header>

      <div className="p-4 md:p-6">
        <div className="flex gap-1 mb-6 p-1 bg-slate-100 rounded-lg w-fit">
          <button onClick={() => setTab('buat')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'buat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Buat Invoice Baru</button>
          <button onClick={() => setTab('riwayat')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'riwayat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Riwayat Invoice</button>
        </div>

        {tab === 'buat' && (
          <div>
            {vendors.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">Belum ada vendor. Tambahkan vendor dulu.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Vendor</label>
                  <select className="w-full md:w-80 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={selectedVendor} onChange={e => onVendorChange(e.target.value)}>
                    <option value="">Pilih vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.nama}</option>)}
                  </select>
                </div>

                {selectedVendor && unpaidJobs.length === 0 && (
                  <p className="text-sm text-green-600 py-4">Semua job vendor ini sudah Lunas.</p>
                )}

                {unpaidJobs.length > 0 && (
                  <>
                    <p className="text-sm text-slate-500 mb-3">Pilih job yang mau digabung ke invoice (klik baris untuk pilih):</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {unpaidJobs.map(j => (
                        <div key={j.id} onClick={() => toggleJob(j.id)} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border text-sm ${selectedJobs.has(j.id) ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                          <div className="flex items-center gap-3">
                            <input type="checkbox" checked={selectedJobs.has(j.id)} onChange={() => toggleJob(j.id)} />
                            <div>
                              <p className="font-medium">{j.nama_project}</p>
                              <p className="text-xs text-slate-500">{j.jenis_edit}</p>
                            </div>
                          </div>
                          <span className="font-medium">{rupiah(j.harga)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                      <span className="font-semibold">Total: {rupiah(unpaidJobs.filter(j => selectedJobs.has(j.id)).reduce((s, j) => s + j.harga, 0))}</span>
                      <button onClick={generateInvoice} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        <FileText className="w-4 h-4" /> Buat & Cetak Invoice
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'riwayat' && (
          <div className="bg-white rounded-xl border border-slate-200">
            {invoices.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">Belum ada invoice.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <div key={inv.id} className="p-4 md:p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={() => reopenInvoice(inv)}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{inv.vendor_nama}</p>
                      <p className="text-xs text-slate-500">{formatTanggal(inv.tanggal)} • {rupiah(inv.total)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 mr-1">Items: {JSON.parse(inv.items_json || '[]').length}</span>
                      <button
                        onClick={(e) => toggleStatus(inv, e)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${inv.status_bayar === 'Lunas' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}
                      >
                        {inv.status_bayar || 'Belum Bayar'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteInvoice(inv.id); }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus invoice"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
