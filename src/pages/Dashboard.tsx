import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { JobWithVendor } from '../lib/types'
import { rupiah, hitungSelisihHari } from '../lib/utils'
import { TrendingUp, AlertTriangle, DollarSign, Briefcase, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
  total_job: number
  belum_bayar: number
  deadline_hari_ini: number
  invoice_belum_dibayar: number
  pendapatan_bulan_ini: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ total_job: 0, belum_bayar: 0, deadline_hari_ini: 0, invoice_belum_dibayar: 0, pendapatan_bulan_ini: 0 })
  const [deadlineJobs, setDeadlineJobs] = useState<JobWithVendor[]>([])
  const [activities, setActivities] = useState<{ text: string; time: string }[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: jobs } = await supabase.from('job').select('*, vendor:vendor_id(nama)').is('deleted_at', null)
    if (!jobs) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

    const total_job = jobs.length
    const belum_bayar = jobs.filter(j => j.status_bayar === 'Belum Bayar').length
    const deadline_hari_ini = jobs.filter(j => {
      if (!j.deadline) return false
      const d = new Date(j.deadline)
      d.setHours(0, 0, 0, 0)
      return d.getTime() === today.getTime()
    }).length
    const pendapatan_bulan_ini = jobs
      .filter(j => j.status_bayar === 'Lunas' && j.tanggal_lunas && new Date(j.tanggal_lunas) >= new Date(monthStart))
      .reduce((sum, j) => sum + j.harga, 0)

    setStats({ total_job, belum_bayar, invoice_belum_dibayar: belum_bayar, deadline_hari_ini, pendapatan_bulan_ini })

    // Deadline ≤ 3 hari, exclude Sudah Dikirim & Lunas
    const nearDeadline = jobs.filter(j => {
      if (!j.deadline || j.status_edit === 'Sudah Dikirim' || j.status_bayar === 'Lunas') return false
      const days = hitungSelisihHari(j.deadline)
      return days !== null && days <= 3
    }).sort((a, b) => (a.deadline || '').localeCompare(b.deadline || '')).slice(0, 10)
    setDeadlineJobs(nearDeadline)

    // Recent activity - created_at terbaru
    const recent = [...jobs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10)
    setActivities(recent.map(j => ({
      text: `Job "${j.nama_project}" ${j.vendor?.nama ? `(${j.vendor.nama})` : ''} ${j.created_at ? 'dibuat' : 'diupdate'}`,
      time: timeAgo(j.created_at)
    })))
  }

  function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} menit yang lalu`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} jam yang lalu`
    const days = Math.floor(hrs / 24)
    return `${days} hari yang lalu`
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 md:px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">Ringkasan job editor wedding</p>
      </header>

      <div className="p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard icon={<Briefcase className="w-5 h-5 text-blue-600" />} label="Total Job" value={stats.total_job} color="text-blue-600" />
          <StatCard icon={<DollarSign className="w-5 h-5 text-red-600" />} label="Belum Bayar" value={stats.belum_bayar} color="text-red-600" />
          <StatCard icon={<Clock className="w-5 h-5 text-orange-600" />} label="Deadline Hari Ini" value={stats.deadline_hari_ini} color="text-orange-600" />
          <StatCard icon={<AlertTriangle className="w-5 h-5 text-purple-600" />} label="Invoice Belum Dibayar" value={stats.invoice_belum_dibayar} color="text-purple-600" />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-green-600" />} label="Pendapatan Bulan Ini" value={rupiah(stats.pendapatan_bulan_ini)} color="text-green-600" />
        </div>

        {/* Deadline + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Deadline */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Deadline Terdekat (≤3 hari)
            </h3>
            {deadlineJobs.length === 0 ? (
              <p className="text-sm text-slate-500">Tidak ada deadline dalam 3 hari ke depan.</p>
            ) : (
              <div className="space-y-3">
                {deadlineJobs.map(job => {
                  const days = hitungSelisihHari(job.deadline)
                  let warnColor = 'text-green-600'
                  let label = `${days} hari`
                  if (days !== null) {
                    if (days <= 0) { warnColor = 'text-red-600'; label = 'Hari ini' }
                    else if (days === 1) { warnColor = 'text-orange-600'; label = 'Besok' }
                  }
                  return (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100" onClick={() => navigate('/jobs')}>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{job.nama_project}</p>
                        <p className="text-xs text-slate-500">{job.vendor?.nama || '-'}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium ${warnColor}`}>{label}</span>
                        <p className="text-xs text-slate-400">{job.status_edit}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-4">
              <Briefcase className="w-5 h-5 text-green-600" />
              Aktivitas Terbaru
            </h3>
            {activities.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada aktivitas.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((act, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <div>
                      <p className="text-sm text-slate-700">{act.text}</p>
                      <p className="text-xs text-slate-400">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        {icon}
        <span className={`text-lg font-bold ${color}`}>{value}</span>
      </div>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}
