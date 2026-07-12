export interface Vendor {
  id: string
  nama: string
  whatsapp: string | null
  harga_kolase_sudah_pilih: number
  harga_kolase_belum_pilih: number
  harga_edit_full: number
  created_at: string
  updated_at: string | null
  deleted_at: string | null
}

export interface Job {
  id: string
  vendor_id: string | null
  nama_project: string
  jenis_edit: string | null
  harga: number
  deadline: string | null
  status_edit: string
  status_bayar: string
  status_cetak: string
  tanggal_lunas: string | null
  catatan: string | null
  created_at: string
  updated_at: string | null
  deleted_at: string | null
}

export interface Invoice {
  id: string
  vendor_id: string | null
  vendor_nama: string
  tanggal: string
  items_json: string
  total: number
  pdf_path: string | null
  created_at: string
  deleted_at: string | null
}

export interface JobWithVendor extends Job {
  vendor?: Vendor | null
}

export interface VendorWithStats extends Vendor {
  total_job: number
  total_pendapatan: number
  total_piutang: number
}

export type StatusEdit = 'Masuk' | 'Sedang Edit' | 'Revisi' | 'Selesai' | 'Sudah Dikirim'
export type StatusBayar = 'Belum Bayar' | 'Lunas'
export type StatusCetak = 'Belum Cetak' | 'Sudah Cetak'
export type JenisEdit = 'Kolase Sudah Pilih' | 'Kolase Belum Pilih' | 'Edit Full'
