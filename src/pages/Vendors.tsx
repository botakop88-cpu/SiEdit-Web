import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { rupiah, validateWhatsApp } from '../lib/utils'
import { Plus } from 'lucide-react'

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nama, setNama] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [hargaSudah, setHargaSudah] = useState(35000)
  const [hargaBelum, setHargaBelum] = useState(50000)
  const [hargaFull, setHargaFull] = useState(135000)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('vendor').select(`
      *,
      total_job:job(count),
      job!left(harga, status_bayar)
    `).is('deleted_at', null).order('nama')
    if (!data) return
    // Better approach: query stats separately
    const { data: jobs } = await supabase.from('job').select('vendor_id, harga, status_bayar').is('deleted_at', null)
    const jobMap = new Map<string, { count: number; pendapatan: number; piutang: number }>()
    jobs?.forEach(j => {
      if (!j.vendor_id) return
      if (!jobMap.has(j.vendor_id)) jobMap.set(j.vendor_id, { count: 0, pendapatan: 0, piutang: 0 })
      const s = jobMap.get(j.vendor_id)!
      s.count++
      if (j.status_bayar === 'Lunas') s.pendapatan += j.harga
      else s.piutang += j.harga
    })
    const result = data.map((v: any) => {
      const stats = jobMap.get(v.id) || { count: 0, pendapatan: 0, piutang: 0 }
      return { ...v, total_job: stats.count, total_pendapatan: stats.pendapatan, total_piutang: stats.piutang }
    })
    setVendors(result)
  }

  function resetForm() {
    setEditingId(null)
    setNama('')
    setWhatsapp('')
    setHargaSudah(35000)
    setHargaBelum(50000)
    setHargaFull(135000)
  }

  function openNew() { resetForm(); setShowModal(true) }

  function openEdit(v: any) {
    setEditingId(v.id)
    setNama(v.nama)
    setWhatsapp(v.whatsapp || '')
    setHargaSudah(v.harga_kolase_sudah_pilih)
    setHargaBelum(v.harga_kolase_belum_pilih)
    setHargaFull(v.harga_edit_full)
    setShowModal(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim()) return
    if (whatsapp && !validateWhatsApp(whatsapp)) { alert('Format WhatsApp tidak valid'); return }

    const payload = { nama: nama.trim(), whatsapp: whatsapp || null, harga_kolase_sudah_pilih: Number(hargaSudah), harga_kolase_belum_pilih: Number(hargaBelum), harga_edit_full: Number(hargaFull), updated_at: new Date().toISOString() }

    if (editingId) {
      await supabase.from('vendor').update(payload).eq('id', editingId)
    } else {
      await supabase.from('vendor').insert({ ...payload, created_at: new Date().toISOString() })
    }
    setShowModal(false)
    load()
  }

  async function deleteVendor(id: string) {
    const { count } = await supabase.from('job').select('id', { count: 'exact', head: true }).eq('vendor_id', id).is('deleted_at', null)
    if (count && count > 0) { alert(`Vendor masih punya ${count} job aktif. Hapus atau pindahkan job dulu.`); return }
    if (!confirm('Hapus vendor ini?')) return
    await supabase.from('vendor').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Vendor</h2>
          <p className="text-sm text-slate-500">Daftar vendor dan harga</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> + Vendor
        </button>
      </header>

      <div className="p-4 md:p-6">
        {vendors.length === 0 && <p className="text-sm text-slate-500 text-center py-8">Belum ada vendor.</p>}

        {/* Desktop: Table */}
        <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left p-3 font-medium">Nama</th>
                <th className="text-left p-3 font-medium">WhatsApp</th>
                <th className="text-left p-3 font-medium">Kolase Sudah</th>
                <th className="text-left p-3 font-medium">Kolase Belum</th>
                <th className="text-left p-3 font-medium">Edit Full</th>
                <th className="text-center p-3 font-medium">Total Job</th>
                <th className="text-right p-3 font-medium">Pendapatan</th>
                <th className="text-right p-3 font-medium">Piutang</th>
                <th className="w-20 p-3"></th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => openEdit(v)}>
                  <td className="p-3 font-medium">{v.nama}</td>
                  <td className="p-3 text-slate-500">{v.whatsapp || '-'}</td>
                  <td className="p-3">{rupiah(v.harga_kolase_sudah_pilih)}</td>
                  <td className="p-3">{rupiah(v.harga_kolase_belum_pilih)}</td>
                  <td className="p-3">{rupiah(v.harga_edit_full)}</td>
                  <td className="p-3 text-center">{v.total_job}</td>
                  <td className="p-3 text-right text-green-600 font-medium">{rupiah(v.total_pendapatan)}</td>
                  <td className="p-3 text-right text-red-600 font-medium">{rupiah(v.total_piutang)}</td>
                  <td className="p-3">
                    <button onClick={e => { e.stopPropagation(); deleteVendor(v.id) }} className="text-red-500 hover:text-red-700 text-xs">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-3">
          {vendors.map(v => (
            <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-blue-300" onClick={() => openEdit(v)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-slate-900">{v.nama}</p>
                  <p className="text-xs text-slate-500">{v.whatsapp || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{v.total_job} job</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded text-center">
                  <div className="font-medium text-slate-700">{rupiah(v.harga_kolase_sudah_pilih)}</div>
                  <div className="text-slate-400 mt-0.5">Kolase Sudah</div>
                </div>
                <div className="bg-slate-50 p-2 rounded text-center">
                  <div className="font-medium text-slate-700">{rupiah(v.harga_kolase_belum_pilih)}</div>
                  <div className="text-slate-400 mt-0.5">Kolase Belum</div>
                </div>
                <div className="bg-slate-50 p-2 rounded text-center">
                  <div className="font-medium text-slate-700">{rupiah(v.harga_edit_full)}</div>
                  <div className="text-slate-400 mt-0.5">Edit Full</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="bg-green-50 p-2 rounded text-center">
                  <div className="font-medium text-green-600">{rupiah(v.total_pendapatan)}</div>
                  <div className="text-green-500 mt-0.5">Pendapatan</div>
                </div>
                <div className="bg-red-50 p-2 rounded text-center">
                  <div className="font-medium text-red-600">{rupiah(v.total_piutang)}</div>
                  <div className="text-red-500 mt-0.5">Piutang</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white rounded-2xl md:rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit Vendor' : 'Vendor Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Vendor</label>
                <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={nama} onChange={e => setNama(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="0812-3456-7890" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kolase Sudah Pilih</label>
                  <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={hargaSudah} onChange={e => setHargaSudah(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kolase Belum Pilih</label>
                  <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={hargaBelum} onChange={e => setHargaBelum(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Edit Full</label>
                  <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={hargaFull} onChange={e => setHargaFull(Number(e.target.value))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
