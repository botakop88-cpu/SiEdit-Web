-- SiEdit Database Migration for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vendor table
CREATE TABLE IF NOT EXISTS vendor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  whatsapp TEXT,
  harga_kolase_sudah_pilih INTEGER DEFAULT 35000,
  harga_kolase_belum_pilih INTEGER DEFAULT 50000,
  harga_edit_full INTEGER DEFAULT 135000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Job table
CREATE TABLE IF NOT EXISTS job (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendor(id) ON DELETE SET NULL,
  nama_project TEXT NOT NULL,
  jenis_edit TEXT,
  harga INTEGER DEFAULT 0,
  deadline DATE,
  status_edit TEXT DEFAULT 'Masuk',
  status_bayar TEXT DEFAULT 'Belum Bayar',
  status_cetak TEXT DEFAULT 'Belum Cetak',
  tanggal_lunas DATE,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Invoice table
CREATE TABLE IF NOT EXISTS invoice (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendor(id) ON DELETE SET NULL,
  vendor_nama TEXT NOT NULL,
  tanggal DATE NOT NULL,
  items_json TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  pdf_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_deleted ON job(deleted_at);
CREATE INDEX IF NOT EXISTS idx_job_vendor ON job(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_deleted ON vendor(deleted_at);
CREATE INDEX IF NOT EXISTS idx_invoice_deleted ON invoice(deleted_at);

-- Enable Row Level Security
ALTER TABLE vendor ENABLE ROW LEVEL SECURITY;
ALTER TABLE job ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;

-- RLS Policies (single user mode - allow all operations)
CREATE POLICY "Allow all vendor operations" ON vendor FOR ALL USING (true);
CREATE POLICY "Allow all job operations" ON job FOR ALL USING (true);
CREATE POLICY "Allow all invoice operations" ON invoice FOR ALL USING (true);

-- Function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_vendor_updated_at BEFORE UPDATE ON vendor
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_updated_at BEFORE UPDATE ON job
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - remove if migrating from existing data)
-- INSERT INTO vendor (nama, whatsapp, harga_kolase_sudah_pilih, harga_kolase_belum_pilih, harga_edit_full)
-- VALUES 
--   ('Erik Basterpict', '0812-3456-7890', 35000, 50000, 135000),
--   ('Maya Studio', '0857-1234-5678', 35000, 50000, 135000);

-- Migration complete
-- Next: refresh your app and test CRUD operations
