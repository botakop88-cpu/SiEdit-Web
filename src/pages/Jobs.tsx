import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Job, Vendor, JobWithVendor, StatusEdit, StatusBayar, StatusCetak, JenisEdit } from '../lib/types'
import { rupiah, formatTanggal, hitungSelisihHari } from '../lib/utils'
import { Plus, Search } from 'lucide-react'

export default function Jobs() {
  const [jobs, setJobs] = useState<JobWithVendor[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [filterVendor, setFilterVendor] = useState('Semua Vendor')
  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)

  // Form state
  const [formVendor, setFormVendor] = useState('')
  const [formProject, setFormProject] = useState('')
  const [formJenis, setFormJenis] = useState<JenisEdit>('Kolase Sudah Pilih')
  const [formHarga, setFormHarga] = useState(0)
  const [formDeadline, setFormDeadline] = useState('')
  const [formStatusEdit, setFormStatusEdit] = useState<StatusEdit>('Masuk')
  const [formStatusBayar, setFormStatusBayar] = useState<StatusBayar>('Belum Bayar')
  const [formStatusCetak, setFormStatusCetak] = useState<StatusCetak>('Belum Cetak')
  const [formCatatan, setFormCatatan] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: jobs } = await supabase.from('job').select('*, vendor:vendor_id(nama)').is('deleted_at', null).order('created_at', { ascending: false })
    const { data: vendors } = await supabase.from('vendor').select('*').is('deleted_at', null).order('nama')
    if (jobs) setJobs(jobs)
    if (vendors) setVendors(vendors)
  }

  function resetForm() {
    setEditingJob(null)
    setFormVendor('')
    setFormProject('')
    setFormJenis('Kolase Sudah Pilih')
    setFormHarga(0)
    setFormDeadline('')
    setFormStatusEdit('Masuk')
    setFormStatusBayar('Belum Bayar')
    setFormStatusCetak('Belum Cetak')
    setFormCatatan('')
  }

  function openNew() {
    resetForm()
    setShowModal(true)
  }

  function openEdit(job: Job) {
    setEditingJob(job)
    setFormVendor(job.vendor_id || '')
    setFormProject(job.nama_project)
    setFormJenis(job.jenis_edit as JenisEdit || 'Kolase Sudah Pilih')
    setFormHarga(job.harga)
    setFormDeadline(job.deadline || '')
    setFormStatusEdit(job.status_edit as StatusEdit)
    setFormStatusBayar(job.status_bayar as StatusBayar)
    setFormStatusCetak(job.status_cetak as StatusCetak)
    setFormCatatan(job.catatan || '')
    setShowModal(true)
  }

  function updateHarga(jenis: JenisEdit, vendorId: string) {
    const v = vendors.find(x => x.id === vendorId)
    if (!v) return
    if (jenis === 'Kolase Sudah Pilih') setFormHarga(v.harga_kolase_sudah_pilih)
    else if (jenis === 'Kolase Belum Pilih') setFormHarga(v.harga_kolase_belum_pilih)
    else if (jenis === 'Edit Full') setFormHarga(v.harga_edit_full)
  }

  function handleJenisChange(val: string) {
    setFormJenis(val as JenisEdit)
    if (formVendor) updateHarga(val as JenisEdit, formVendor)
  }

  function handleVendorChange(val: string) {
    setFormVendor(val)
    if (val) updateHarga(formJenis, val)
  }

  async function saveJob(e: React.FormEvent) {
    e.preventDefault()
    if (!formProject.trim()) return

    const payload = {
      vendor_id: formVendor || null,
      nama_project: formProject.trim(),
      jenis_edit: formJenis,
      harga: formHarga,
      deadline: formDeadline || null,
      status_edit: formStatusEdit,
      status_bayar: formStatusBayar,
      status_cetak: formStatusCetak,
      tanggal_lunas: formStatusBayar === 'Lunas' ? new Date().toISOString().split('T')[0] : null,
      catatan: formCatatan || null,
      updated_at: new Date().toISOString(),
    }

    if (editingJob) {
      await supabase.from('job').update(payload).eq('id', editingJob.id)
    } else {
      await supabase.from('job').insert({ ...payload, created_at: new Date().toISOString() })
    }

    setShowModal(false)
    loadData()
  }

  async function deleteJob(id: string) {
    if (!confirm('Hapus job ini?')) return
    await supabase.from('job').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    loadData()
  }

  async function batchUpdateStatus(jobIds: string[], statusBayar: StatusBayar) {
    await supabase.from('job').update({
      status_bayar: statusBayar,
      tanggal_lunas: statusBayar === 'Lunas' ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString()
    }).in('id', jobIds)
    loadData()
  }

  // Filter logic
  let filtered = [...jobs]
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(j => j.nama_project.toLowerCase().includes(s) || j.vendor?.nama?.toLowerCase().includes(s))
  }
  if (filterStatus === 'Belum Bayar' || filterStatus === 'Lunas') {
    filtered = filtered.filter(j => j.status_bayar === filterStatus)
  } else if (filterStatus === 'Sedang Edit') {
    filtered = filtered.filter(j => j.status_edit === 'Sedang Edit')
  } else if (filterStatus === 'Deadline ≤ 3 Hari') {
    filtered = filtered.filter(j => {
      if (!j.deadline) return false
      const days = hitungSelisihHari(j.deadline)
      return days !== null && days <= 3 && days >= 0
    })
  } else if (filterStatus === 'Sudah Cetak') {
    filtered = filtered.filter(j => j.status_cetak === 'Sudah Cetak')
  } else if (filterStatus === 'Belum Cetak') {
    filtered = filtered.filter(j => j.status_cetak === 'Belum Cetak')
  }
  if (filterVendor !== 'Semua Vendor') {
    filtered = filtered.filter(j => j.vendor?.nama === filterVendor)
  }

  // Group by vendor
  const groups: { vendor: string; vendorId: string; jobs: JobWithVendor[] }[] = []
  const vendorMap = new Map<string, JobWithVendor[]>()
  filtered.forEach(j => {
    const key = j.vendor?.nama || '(Tanpa Vendor)'
    if (!vendorMap.has(key)) vendorMap.set(key, [])
    vendorMap.get(key)!.push(j)
  })
  vendorMap.forEach((vj, vn) => {
    const vendorId = vj.find(j => j.vendor_id)?.vendor_id || ''
    groups.push({ vendor: vn, vendorId, jobs: vj })
  })

  // Bulk select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  function toggleSelect(id: string) {
    const s = new Set(selectedIds)
    if (s.has(id)) s.delete(id); else s.add(id)
    setSelectedIds(s)
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Daftar Job</h2>
          <p className="text-sm text-slate-500">Kelola semua job editor wedding</p>
        </div>
        <button onClick={openNew} className="md:hidden bg-blue-600 text-white p-2.5 rounded-full shadow-lg">
          <Plus className="w-5 h-5" />
        </button>
        <button onClick={openNew} className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Job Baru
        </button>
      </header>

      <div className="p-4 md:p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari project atau vendor..."
              className="border-none outline-none text-sm flex-1 bg-transparent"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option>Semua</option>
            <option>Belum Bayar</option>
            <option>Lunas</option>
            <option>Sedang Edit</option>
            <option>Deadline ≤ 3 Hari</option>
            <option>Sudah Cetak</option>
            <option>Belum Cetak</option>
          </select>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" value={filterVendor} onChange={e => setFilterVendor(e.target.value)}>
            <option>Semua Vendor</option>
            {vendors.map(v => <option key={v.id}>{v.nama}</option>)}
          </select>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex gap-2 mb-4 p-3 bg-blue-50 rounded-lg items-center">
            <span className="text-sm font-medium text-blue-800">{selectedIds.size} terpilih:</span>
            <button onClick={() => batchUpdateStatus([...selectedIds], 'Lunas')} className="px-3 py-1 bg-green-600 text-white text-xs rounded">Tandai Lunas</button>
            <button onClick={() => batchUpdateStatus([...selectedIds], 'Belum Bayar')} className="px-3 py-1 bg-red-600 text-white text-xs rounded">Tandai Belum Bayar</button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1 bg-slate-300 text-slate-700 text-xs rounded">Batal</button>
          </div>
        )}

        {/* Desktop: Table */}
        <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="w-8 p-3"><input type="checkbox" onChange={e => { if (e.target.checked) setSelectedIds(new Set(filtered.map(j => j.id))); else setSelectedIds(new Set()) }} /></th>
                <th className="text-left p-3 font-medium">Vendor / Project</th>
                <th className="text-left p-3 font-medium">Deadline</th>
                <th className="text-left p-3 font-medium">Status Edit</th>
                <th className="text-left p-3 font-medium">Bayar</th>
                <th className="text-left p-3 font-medium">Cetak</th>
                <th className="text-right p-3 font-medium">Harga</th>
                <th className="w-20 p-3"></th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <>
                  <tr key={g.vendor} className="bg-slate-100" style={g.vendor === '(Tanpa Vendor)' ? { background: '#f1f5f9' } : {}}>
                    <td colSpan={8} className="p-3">
                      <span className="font-semibold text-sm">{g.vendor}</span>
                      <span className="text-xs text-slate-500 ml-2">({g.jobs.length} job · {g.jobs.filter(j => j.status_bayar === 'Belum Bayar').length} blm bayar)</span>
                    </td>
                  </tr>
                  {g.jobs.map(job => (
                    <tr key={job.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => openEdit(job)}>
                      <td className="p-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(job.id)} onChange={() => toggleSelect(job.id)} /></td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{job.nama_project}</div>
                        <div className="text-sm font-bold text-amber-700">{job.vendor?.nama || '(Tanpa Vendor)'}</div>
                      </td>
                      <td className="p-3">
                        {job.deadline ? (() => {
                          const days = hitungSelisihHari(job.deadline)
                          return <span className={days !== null && days <= 0 ? 'text-red-600 font-medium' : days !== null && days <= 3 ? 'text-orange-600' : ''}>{formatTanggal(job.deadline)}</span>
                        })() : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="p-3">{badgeEdit(job.status_edit)}</td>
                      <td className="p-3">{badgeBayar(job.status_bayar)}</td>
                      <td className="p-3">{badgeCetak(job.status_cetak)}</td>
                      <td className="p-3 text-right font-medium">{rupiah(job.harga)}</td>
                      <td className="p-3 text-right">
                        <button onClick={e => { e.stopPropagation(); deleteJob(job.id) }} className="text-red-500 hover:text-red-700 text-xs">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 && <p className="text-sm text-slate-500 text-center py-8">Tidak ada job.</p>}
          {filtered.map(job => (
            <div key={job.id} className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-blue-300" onClick={() => openEdit(job)}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-slate-900">{job.nama_project}</p>
                  <p className="text-xs text-slate-500">{job.vendor?.nama || '-'}</p>
                </div>
                {badgeEdit(job.status_edit)}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {badgeBayar(job.status_bayar)}
                {badgeCetak(job.status_cetak)}
                <span className="ml-auto font-medium">{rupiah(job.harga)}</span>
              </div>
              {job.deadline && <p className="text-xs text-slate-400 mt-2">Deadline: {formatTanggal(job.deadline)}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white rounded-2xl md:rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{editingJob ? 'Edit Job' : 'Job Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={saveJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={formVendor} onChange={e => handleVendorChange(e.target.value)} required>
                  <option value="">Pilih vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Project</label>
                <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={formProject} onChange={e => setFormProject(e.target.value)} required placeholder="Pre-wedding & Budi" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Edit</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={formJenis} onChange={e => handleJenisChange(e.target.value)}>
                    <option value="Kolase Sudah Pilih">Kolase Sudah Pilih</option>
                    <option value="Kolase Belum Pilih">Kolase Belum Pilih</option>
                    <option value="Edit Full">Edit Full</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                  <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Harga</label>
                <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={formHarga} onChange={e => setFormHarga(Number(e.target.value))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status Edit</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={formStatusEdit} onChange={e => setFormStatusEdit(e.target.value as StatusEdit)}>
                    <option>Masuk</option><option>Sedang Edit</option><option>Revisi</option><option>Selesai</option><option>Sudah Dikirim</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status Bayar</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={formStatusBayar} onChange={e => setFormStatusBayar(e.target.value as StatusBayar)}>
                    <option>Belum Bayar</option><option>Lunas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status Cetak</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={formStatusCetak} onChange={e => setFormStatusCetak(e.target.value as StatusCetak)}>
                    <option>Belum Cetak</option><option>Sudah Cetak</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" rows={3} value={formCatatan} onChange={e => setFormCatatan(e.target.value)} placeholder="Catatan tambahan..."></textarea>
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

function badgeEdit(status: string) {
  const map: Record<string, { bg: string; text: string }> = {
    'Masuk': { bg: 'bg-orange-100', text: 'text-orange-800' },
    'Sedang Edit': { bg: 'bg-blue-100', text: 'text-blue-800' },
    'Revisi': { bg: 'bg-purple-100', text: 'text-purple-800' },
    'Selesai': { bg: 'bg-green-100', text: 'text-green-800' },
    'Sudah Dikirim': { bg: 'bg-green-100', text: 'text-green-800' },
  }
  const s = map[status] || { bg: 'bg-slate-100', text: 'text-slate-700' }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{status}</span>
}

function badgeBayar(status: string) {
  return status === 'Lunas'
    ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Lunas</span>
    : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Belum Bayar</span>
}

function badgeCetak(status: string) {
  return status === 'Sudah Cetak'
    ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Sudah Cetak</span>
    : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Belum Cetak</span>
}
