export const rupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const rupiahSingkat = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`
  }
  return rupiah(amount)
}

export const formatTanggal = (date: string | null): string => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const formatTanggalPanjang = (): string => {
  const d = new Date()
  return d.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
}

export const hitungSelisihHari = (deadline: string | null): number | null => {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(deadline)
  d.setHours(0, 0, 0, 0)
  const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export const validateWhatsApp = (wa: string): boolean => {
  // Format: 08xx-xxxx-xxxx atau 628xxxxxxxxx
  const clean = wa.replace(/\D/g, '')
  return clean.length >= 10 && clean.length <= 15
}
