# Laporan Foto Bukti Dukung E-Kinerja Tahunan (Kertas F4)

Aplikasi penyusun dan pencetak **Laporan Foto Bukti Dukung E-Kinerja Tahunan** (Januari–Desember) dalam 1 dokumen **PDF ukuran Kertas F4 (Folio)**, terintegrasi dengan database **MySQL (WAMP Server)**.

---

## Prasyarat Sistem
1. **Node.js** (v18+)
2. **WAMP Server** (MySQL 8.4.7 aktif pada port `3306`)

---

## Panduan Instalasi & Menjalankan Aplikasi

### 1. Pastikan WAMP Server Aktif
Jalankan **Wampserver64** dan pastikan layanan **MySQL (8.4.7)** sudah berjalan (ikon WAMP berwarna hijau).

### 2. Konfigurasi Environment (`.env`)
Sesuaikan konfigurasi koneksi database pada berkas `.env` (jika belum ada, salin dari `.env.example`):

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=laporan_ekin_tahunan
```

> **Catatan:** Database `laporan_ekin_tahunan` beserta tabel `report_metadata` dan `evidence_items` akan **dibuat secara otomatis** saat server aplikasi dijalankan pertama kali. Anda juga dapat mengimpor skema secara manual melalui berkas `database.sql` jika diperlukan:
> ```powershell
> Get-Content .\database.sql -Raw | C:\wamp64\bin\mysql\mysql8.4.7\bin\mysql.exe -u root
> ```

### 3. Instal Dependensi
Cukup dijalankan satu kali di awal:

```bash
npm install --legacy-peer-deps
```

### 4. Jalankan Server Development
```bash
npm run dev
```

Buka di peramban pada alamat:
- **Lokal**: `http://localhost:3000/`

---

## Fitur Utama
- **Input Bukti Dukung 12 Bulan (Januari–Desember)**: Unggah foto satu per satu maupun banyak foto sekaligus (*drag & drop* / *batch upload*), atur urutan, atau pindahkan foto antarbulan.
- **Tersimpan Otomatis di MySQL**: Seluruh data identitas pegawai dan foto bukti dukung tersimpan langsung di database MySQL `laporan_ekin_tahunan`.
- **Pengaturan Identitas & Kertas F4**:
  - Pilihan dimensi kertas **F4 Standar (215 × 330 mm)** atau **Folio / F4S (210 × 330 mm)**.
  - Pilihan tata letak **2, 4, atau 6 foto per halaman**.
  - Tombol **Muat Identitas Laporan & Pegawai** untuk mengisi ulang identitas pegawai secara instan.
- **Pratinjau & Unduh 1 PDF Setahun**: Dilengkapi halaman sampul, tabel rekapitulasi bulanan, blok tanda tangan (`31 Desember <Tahun>`), serta penomoran halaman otomatis.
