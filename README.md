# SiEdit Web - Wedding Job Tracker

Web app untuk tracking job editor wedding freelance. Dibangun dengan React + TypeScript + Supabase.

## Fitur

- ✅ Dashboard dengan statistik real-time
- ✅ CRUD Job (tambah, edit, hapus, filter, group by vendor)
- ✅ CRUD Vendor dengan stats (total job, pendapatan, piutang)
- ✅ Generate Invoice PDF (pilih job, cetak langsung)
- ✅ Responsive (mobile-first dengan bottom nav, desktop dengan sidebar)
- ✅ Soft delete (data tidak hilang permanen)
- ✅ Online sync otomatis (Supabase)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Icons**: Lucide React
- **Deploy**: Vercel

## Setup Development

1. Clone repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Buka http://localhost:5173

## Deploy Production

Push ke GitHub, lalu connect ke Vercel:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

Vercel akan auto-detect Vite config dan deploy.

## Database

Supabase project sudah di-setup. SQL migration ada di `/docs/migration.sql`.

Untuk re-setup database dari awal:
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi `migration.sql`
3. Run query

## Credentials

- Supabase URL: `https://etczyvlsiebdvosxdegd.supabase.co`
- Supabase Key: lihat di `src/lib/supabaseClient.ts`

## License

Private project.
