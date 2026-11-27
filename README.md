# Laporan Foto Bukti Dukung E-Kinerja Tahunan (Kertas F4)

Aplikasi penyusun dan pencetak **Laporan Foto Bukti Dukung E-Kinerja Tahunan** (Januari–Desember) dalam 1 dokumen **PDF ukuran Kertas F4 (Folio)**, terintegrasi dengan database **MySQL (WAMP Server)**.

---

## Prasyarat Sistem
1. **Node.js** (v18+)
2. **WAMP Server** (MySQL **8.4.13** aktif pada port `3306` di `C:\wamp64\bin\mysql\mysql8.4.13`)

---

## Panduan Instalasi & Menjalankan Aplikasi

### 1. Pastikan WAMP Server / MySQL Aktif
Jalankan **Wampserver64** dan pastikan layanan **MySQL (8.4.13)** pada `C:\wamp64\bin\mysql\mysql8.4.13` sudah berjalan (ikon WAMP berwarna hijau).

> **Penting:** Jika layanan MySQL belum aktif saat membuka `http://localhost:3000/`, aplikasi akan menampilkan **Banner Error Koneksi Database MySQL** beserta tombol **Coba Hubungkan Ulang**.

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
> Get-Content .\database.sql -Raw | C:\wamp64\bin\mysql\mysql8.4.13\bin\mysql.exe -u root
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
- **Penyimpanan Terpisah per Tahun & Bulan di Database MySQL**:
  - Setiap foto bukti dukung dan Rencana Aksi disimpan secara terpisah berdasarkan **Tahun (`year`)**, **Bulan (`month`)**, dan **Indikator Kinerja (`indicator`)** di tabel `evidence_items`.
  - Ketika mengganti tahun laporan (misal dari `2026` ke `2027`), daftar foto, rekapitulasi, Rencana Aksi, dan hasil cetak PDF hanya menampilkan data milik tahun yang sedang dipilih tanpa mencampur data tahun sebelumnya.
- **Total Seluruh Indikator pada Navigasi Periode Bulanan (`01 Januari` – `12 Desember`)**:
  - Angka pada daftar **Periode Bulanan** (`01 Januari`, `02 Februari`, dst.) menampilkan **total gabungan seluruh indikator kinerja** pada bulan tersebut, bukan hanya jumlah dari satu indikator yang sedang dipilih.
- **Penggabungan Multi-Indikator dalam Satu Halaman & Keterangan di Setiap Foto**:
  - Pada **Pratinjau Dokumen** dan **Cetak PDF**, keterangan **`Indikator: ...`** dan **`Rencana Aksi: ...`** ditempatkan langsung pada masing-masing kartu foto yang bersangkutan (tanpa menampilkan nama file).
  - Saat memilih **`Semua Indikator`**, foto-foto dari indikator kinerja yang berbeda pada bulan yang sama otomatis bergabung dalam satu halaman F4 secara hemat dan rapi.
- **Tombol Terpadu "Pilih atau Seret Foto ke Sini" (Mendukung Banyak Foto Sekaligus)**:
  - Tombol **Pilih atau Seret Foto ke Sini** langsung mendukung pemilihan 1 maupun banyak foto sekaligus (*multi-select* & *drag-and-drop*).
  - Menampilkan badge informasi jumlah foto yang berhasil diupload/dipilih langsung pada area tulisan **Pilih atau Seret Foto ke Sini** (misal: `4 foto berhasil diupload` / `Sukses mengunggah 4 foto!`).
- **Input Bukti Dukung Terstruktur (Wajib Isi)**:
  - **Indikator Kinerja (Wajib)**: Pilih indikator kinerja aktif atau tambahkan indikator kinerja baru secara langsung.
  - **Rencana Aksi Fleksibel (1 Indikator Bisa Memiliki Beberapa Rencana Aksi Berbeda)**: Kolom **Rencana Aksi \*** pada form input *Tambah Foto & Nama Bukti Dukung* selalu terbuka (tidak dikunci), sehingga 1 Indikator Kinerja pada bulan yang sama dapat memiliki beberapa Rencana Aksi yang berbeda. Setelah foto disimpan ke *Daftar Foto Bulan*, field Rencana Aksi pada kartu foto tersebut dikunci agar tidak berubah secara tidak sengaja.
  - **Nama Bukti Dukung (Wajib pada Form Input, Disembunyikan pada Daftar Foto)**: Judul dokumentasi kegiatan pada form input, dan disembunyikan (*hidden*) pada kartu Daftar Foto agar tampilan kartu lebih ringkas.
  - **Bulan: Januari – Desember (Wajib)**: Pilihan periode bulan kegiatan dari Januari hingga Desember.
- **Format Header Pratinjau & Cetak PDF yang Ringkas & Jelas**:
  - **Mode Filter Bulanan (misal Bulan Januari)**:
    ```text
    Laporan Foto Bukti Dukung E-Kinerja Bulan Januari 2026
    Muhammad Gusti Kurniawan, S.Kom | NIP. 199308262025211037 | RSUD H. Abdul Manap Kota Jambi
    ```
  - **Mode Semua Halaman (Tahunan)**:
    ```text
    Laporan Foto Bukti Dukung E-Kinerja Tahun 2026
    Muhammad Gusti Kurniawan, S.Kom | NIP. 199308262025211037 | RSUD H. Abdul Manap Kota Jambi
    Bulan: Januari
    ```
  - **Badge Nomor Urut di Pojok Kiri Atas & Info Indikator/Rencana Aksi per Foto**: Setiap foto dilengkapi lencana nomor urut (`1`, `2`, `3`, dst.) di pojok kiri atas foto serta keterangan `Indikator` dan `Rencana Aksi` pada bagian bawah masing-masing kartu foto.
- **Manajemen Foto & Hapus Semua Foto per Bulan**: Pengaturan urutan foto, penggantian foto, pemindahan bulan, serta tombol **Hapus Semua Foto Bulan `<Nama Bulan>`**.
- **Tersimpan Otomatis di MySQL & Deteksi Koneksi**: Seluruh data identitas pegawai dan foto bukti dukung tersimpan otomatis di database MySQL `laporan_ekin_tahunan`. Dilengkapi indikator peringatan koneksi langsung di `localhost:3000` apabila MySQL (`C:\wamp64\bin\mysql\mysql8.4.13`) belum aktif.
- **Pengaturan Identitas & Kertas F4**:
  - Pilihan dimensi kertas **F4 Standar (215 × 330 mm)** atau **Folio / F4S (210 × 330 mm)**.
  - Pilihan tata letak **2, 4, atau 6 foto per halaman**.
  - Tombol **Muat Identitas Laporan & Pegawai** untuk mengisi ulang identitas pegawai secara instan.
- **Pratinjau & Unduh PDF**: Dilengkapi halaman sampul, tabel rekapitulasi bulanan, blok tanda tangan (`31 Desember <Tahun>`), serta penomoran halaman otomatis.

---

## Riwayat Pembaruan Fitur (Changelog)

- **Dukungan Multi Rencana Aksi dalam 1 Indikator Kinerja**:
  - Membuka kunci field **Rencana Aksi \*** pada form input **Tambah Foto & Nama Bukti Dukung** agar selalu dapat diisi dengan Rencana Aksi baru, sehingga 1 Indikator Kinerja pada bulan yang sama dapat memiliki beberapa Rencana Aksi yang berbeda tanpa menimpa Rencana Aksi pada foto yang sudah diinput sebelumnya.
- **Pemindahan Indikator & Rencana Aksi ke Masing-Masing Kartu Foto (Gabung Multi-Indikator Satu Halaman)**:
  - Memindahkan keterangan **`Indikator: ...`** dan **`Rencana Aksi: ...`** dari header halaman ke bagian bawah masing-masing kartu foto di **Pratinjau Dokumen** dan **Cetak PDF** (tetap tanpa menampilkan nama file foto).
  - Menggabungkan foto-foto dari indikator kinerja yang berbeda pada bulan yang sama ke dalam halaman yang sama (tidak lagi dipisah halaman per indikator).
- **Total Semua Indikator pada Periode Bulanan & Opsi Unduh "Semua Indikator" di Pratinjau Dokumen**:
  - Mengubah perhitungan angka pada daftar **Periode Bulanan** (`01 Januari` – `12 Desember`) di sidebar agar menampilkan total bukti dari **seluruh indikator kinerja** pada bulan tersebut.
  - Menambahkan pilihan **`Semua Indikator`** pada dropdown **Indikator Cetak** di **Pratinjau Dokumen** dan Sidebar.
- **Penyatuan Unggah Banyak Foto ke Tombol "Pilih atau Seret Foto ke Sini" & Informasi Jumlah Foto**:
  - Memindahkan fungsi unggah banyak foto sekaligus (*multiple upload*) langsung ke tombol **Pilih atau Seret Foto ke Sini** dan menghapus tombol terpisah di kanan atas.
  - Menampilkan status jumlah foto yang berhasil diupload (`<N> foto berhasil diupload` dan `Sukses mengunggah <N> foto!`) beserta pratinjau mini langsung di area tulisan **Pilih atau Seret Foto ke Sini**.
- **Pemisahan Penyimpanan Foto & Rencana Aksi per Tahun dan Bulan di Database**:
  - Menambahkan kolom `year` pada tabel `evidence_items` di MySQL (beserta migrasi otomatis `ALTER TABLE`) sehingga setiap bukti dukung disimpan spesifik untuk pasangan **Tahun**, **Bulan**, dan **Indikator Kinerja** masing-masing.
- **Menyembunyikan Field Nama Bukti Dukung pada Kartu Daftar Foto**:
  - Menyembunyikan (*hidden*) label dan input **Nama Bukti Dukung \*** pada setiap kartu di bagian *Daftar Foto Bulan*.
- **Tombol Hapus Semua Daftar Foto per Bulan**:
  - Menambahkan tombol **Hapus Semua Foto Bulan `<Nama Bulan>`** (dilengkapi konfirmasi) pada header bagian *Daftar Foto Bulan* untuk mengosongkan seluruh foto pada bulan tersebut.
- **Penguncian Kolom Rencana Aksi pada Kartu Daftar Foto**:
  - Mengunci kolom **Rencana Aksi (Bulan Ini)** pada daftar kartu foto (*disabled* / *read-only* dengan indikator **Terkunci**) setelah foto diinput agar Rencana Aksi pada foto tersebut tidak berubah secara tidak sengaja.
- **Penyederhanaan Format Header Bulanan & Tahunan**:
  - Menyederhanakan header dokumen pada mode **Bulanan** dan **Semua Halaman (Tahunan)**.
- **Judul Dinamis per Filter Bulan & Badge Nomor Foto di Pojok Kiri Atas**:
  - Mendesain ulang nomor urut foto menjadi *badge* modern berwarna biru tua (`#0F4C81`) dengan tepi putih dan bayangan halus yang ditempatkan di **pojok kiri atas** setiap foto.
- **Deteksi Error Koneksi MySQL 8.4.13 di UI (`localhost:3000`)**:
  - Menampilkan pesan error koneksi database secara eksplisit di halaman aplikasi apabila layanan MySQL (`C:\wamp64\bin\mysql\mysql8.4.13`) belum dijalankan, dilengkapi tombol **Coba Hubungkan Ulang**.
- **Perombakan Form Input Bukti Dukung**:
  - Mengganti *Keterangan Singkat (Opsional)* menjadi **Rencana Aksi (Wajib)** dan *Tanggal Kegiatan (Opsional)* menjadi dropdown **Bulan: Januari – Desember (Wajib)**.
- **Kompatibilitas Konfigurasi Vite v8**:
  - Menambahkan ekstensi eksplisit `.ts` pada import `./server/mysqlApiPlugin.ts` di `vite.config.ts`.
- **Dukungan Multi-Indikator Kinerja**:
  - Penambahan manajemen daftar Indikator Kinerja pada menu *Input Bukti Dukung*, *Sidebar*, dan *Identitas & F4*.
