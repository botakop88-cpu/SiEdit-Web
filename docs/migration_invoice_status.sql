-- Jalankan di Supabase SQL Editor
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS status_bayar text DEFAULT 'Belum Bayar';
COMMENT ON COLUMN invoice.status_bayar IS 'Status pembayaran invoice: Belum Bayar / Lunas';