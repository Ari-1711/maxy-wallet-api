# <a id="section-1"></a>🛡️ Maxy Wallet API (E-Wallet Secure Ledger Engine)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

> **Elevator Pitch:** RESTful Financial API berbasis Node.js yang memastikan keamanan finansial dan integritas transaksi (ACID 100%) dengan pemrosesan mutasi saldo secara atomik guna mencegah *double-spending* dan *race condition*.

---

> [!CAUTION]
> **Catatan Keamanan Kredensial:** 
> Pastikan untuk tidak pernah melakukan *commit* pada file `.env` ke *version control*. Gunakan rahasia yang kuat untuk `JWT_SECRET` dan string koneksi `DATABASE_URL` di lingkungan produksi.

## 📑 2. Daftar Isi
- [1. Hero Header & Quick Access](#section-1)
- [3. Ringkasan Eksekutif & Metrik Kinerja](#section-3)
- [4. Spesifikasi Database & Relasi Entitas](#section-4)
- [5. Arsitektur & Alur Kerja Sistem](#section-5)
- [6. Pertimbangan Teknik (Engineering Trade-offs)](#section-6)
- [7. Evaluasi & Validasi Kinerja](#section-7)
- [8. Refleksi Rekayasa & Evaluasi Teknis](#section-8)
- [9. Fitur API & Panduan Instalasi Lokal](#section-9)
- [10. Struktur Direktori Proyek](#section-10)
- [11. Penulis & Rincian Kontribusi](#section-11)
- [12. Tech Stack & Rencana Pengembangan Masa Depan](#section-12)

## <a id="section-3"></a>📊 3. Ringkasan Eksekutif & Metrik Kinerja

Proyek ini dibangun untuk menjawab tantangan pemrosesan saldo secara *real-time* di mana konsistensi data adalah prioritas utama. Menggunakan arsitektur RESTful API yang ditenagai oleh Express.js dan Prisma ORM, sistem ini mengandalkan eksekusi *atomic transaction* untuk memastikan setiap debit dan kredit tersinkronisasi tanpa celah.

| Metrik / Aspek | Keterangan |
| :--- | :--- |
| **Integritas Transaksi** | 100% ACID Compliance via Prisma `$transaction` |
| **Test Coverage** | End-to-End Flow Tested via Jest & Supertest |
| **Security Auth** | JWT Access & Refresh Tokens (Stateless) |
| **Password Hashing** | `bcrypt` (10 Salt Rounds) |
| **BigInt Support** | Native JavaScript BigInt serialization terkonfigurasi |

## <a id="section-4"></a>🗄️ 4. Spesifikasi Database & Relasi Entitas

Sistem ini didesain secara efisien menggunakan dua entitas inti untuk menekan *overhead* relasi yang tidak perlu:

1. **`User` (Entity)**: Menyimpan data pengguna, kredensial PIN yang di-hash dengan bcrypt, serta menyimpan agregasi total `balance` (tipe data *BigInt* untuk menghindari *floating point precision loss*). Field `phone_number` dilindungi oleh *Unique Constraint*.
2. **`Transaction` (Entity/MutationLog)**: Mencatat setiap pergerakan dana. Memiliki relasi *Foreign Key* ke entitas `User`. Mendukung tipe transaksi `CREDIT` dan `DEBIT`. Menyimpan rekam jejak `balance_before` dan `balance_after` untuk audit internal.

## <a id="section-5"></a>⚙️ 5. Arsitektur & Alur Kerja Sistem

Alur dari *request* hingga *response* dieksekusi secara ketat terlapisi:
1. **Client Request** ➔ Tiba di endpoint Express.js.
2. **JWT Middleware** (`auth.middleware.js`) ➔ Memvalidasi *Bearer Token*, menolak akses tak berizin secara instan.
3. **Controller Layer** ➔ Menangkap input, ekstraksi payload JWT, dan meneruskannya ke Service.
4. **Service Layer** ➔ Mengeksekusi *business logic*. Khusus mutasi saldo, memanggil `prisma.$transaction`.
5. **Database (PostgreSQL)** ➔ Menjalankan *row-level lock/update* secara atomik.
6. **Response** ➔ Format respons standar JSON dengan status `SUCCESS`.

## <a id="section-6"></a>⚖️ 6. Pertimbangan Teknik (Engineering Trade-offs)

| Aspek | Solusi Terpilih | Alternatif | Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **Transaksi** | **Prisma `$transaction`** | Raw SQL Queries | Lebih aman dari SQL Injection, *type-safe*, dan kode lebih *maintainable*. |
| **Otentikasi** | **JWT Bearer Token** | Session DB | *Stateless*, mengurangi beban baca database pada setiap *request*, ideal untuk ekosistem API modern. |
| **Hashing** | **Bcrypt** | Argon2id | Standard industri yang stabil, cukup tangguh dan optimal kecepatannya untuk keamanan PIN e-wallet. |

> [!TIP]
> **Analisis *Race Condition*:** Dengan menggunakan metode *atomic transaction*, saat dua *request transfer* datang bersamaan untuk pengguna yang sama, sistem akan menyelesaikan satu siklus mutasi debit/kredit sebelum mengizinkan siklus berikutnya, mencegah saldo menjadi minus (*double spending*).

## <a id="section-7"></a>🧪 7. Evaluasi & Validasi Kinerja

Sistem ini divalidasi menggunakan gabungan pengujian manual interaktif (Postman) dan otomatis (Jest/Supertest).
- **Integration Testing:** Skrip `tests/flow.test.js` memvalidasi *Happy Path* beruntun secara otomatis: Registrasi ➔ Login ➔ Top Up ➔ Payment ➔ Registrasi Target ➔ Transfer ➔ Update Profil ➔ Cek Riwayat.
- **Manual Edge Case:** File `postman_collection.json` secara mendalam menyertakan pengujian skenario kegagalan: Token kedaluwarsa, PIN salah, saldo tidak cukup saat transaksi, dan duplikasi pendaftaran nomor telepon.

## <a id="section-8"></a>💡 8. Refleksi Rekayasa & Evaluasi Teknis

Pada iterasi ini, tantangan terbesar adalah menjaga agar arsitektur tetap ramping (*no overengineering*) namun tetap **tangguh secara finansial**. Memasukkan RabbitMQ atau Kafka pada tahap awal *Proof of Concept* akan terlalu berlebihan. Solusi pragmatis yang kami ambil adalah mengandalkan sepenuhnya fitur transaksi *database-level* dari PostgreSQL.

*Mitigasi Masa Depan:* Apabila *throughput* mencapai tingkat *enterprise* (puluhan ribu transaksi per detik), *row-locking* di PostgreSQL dapat menjadi *bottleneck* performa. Rencana mitigasinya tertuang di bagian Roadmap.

## <a id="section-9"></a>🚀 9. Fitur API & Panduan Instalasi Lokal

### 📍 Endpoint Inti
- `POST /register` & `POST /login` (Sistem Otentikasi)
- `PUT /profile` (Manajemen Profil Pengguna)
- `POST /topup` (Pengisian Saldo Dompet)
- `POST /pay` (Pembayaran Transaksi / Merchant)
- `POST /transfer` (Transfer Dana Antar Pengguna / P2P)
- `GET /transactions` (Riwayat & Log Mutasi)

### 🛠️ Panduan Instalasi
1. **Clone Repository:**
   ```bash
   git clone https://github.com/Ari-1711/maxy-wallet-api.git
   cd maxy-wallet-api
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Konfigurasi Environment:**
   Buat file `.env` di direktori *root*:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5434/maxy_wallet?schema=public"
   PORT=3000
   JWT_SECRET="secret_maxy_wallet"
   JWT_REFRESH_SECRET="refresh_secret_maxy_wallet"
   ```
4. **Migrasi Database:**
   ```bash
   npx prisma migrate dev --name init
   ```
5. **Jalankan Server & Unit Test:**
   ```bash
   npm run dev    # Menjalankan development server
   npm test       # Menjalankan suite pengujian end-to-end Jest
   ```
6. **Deployment via Docker (Opsional tapi Direkomendasikan):**
   Jika Anda sudah menginstal Docker, Anda bisa langsung menjalankan seluruh arsitektur (Database PostgreSQL + Node.js API) secara instan tanpa perlu repot mengatur database lokal:
   ```bash
   docker-compose up --build -d
   ```
7. **Testing Interaktif via Postman:**
   Import file `postman_collection.json` yang tersedia di direktori proyek ini ke dalam aplikasi Postman Anda. Koleksi ini sudah dikonfigurasi untuk otomatis menangkap token otentikasi sehingga mempermudah Anda bereksperimen.

## <a id="section-10"></a>📂 10. Struktur Direktori Proyek

Representasi struktur *Layered Architecture* yang kami terapkan:

```text
📦 maxy-wallet-api
┣ 📂 prisma
┃ ┣ 📂 migrations       # File SQL pencatatan skema versi
┃ ┗ 📜 schema.prisma    # Definisi tabel/model inti database
┣ 📂 src
┃ ┣ 📂 controllers      # Entry poin request, penanganan response
┃ ┣ 📂 middleware       # Interseptor keamanan JWT & Error Handling global
┃ ┣ 📂 routes           # Definisi endpoint (Express router)
┃ ┣ 📂 services         # Otak aplikasi (Core Business & Transaction Logic)
┃ ┣ 📂 utils            # Kelas helper fungsional (Prisma client)
┃ ┗ 📜 index.js         # Bootstrap aplikasi & konfigurasi utama Server
┣ 📂 tests
┃ ┗ 📜 flow.test.js     # End-to-end flow unit testing suite (Jest)
┣ 📜 postman_collection.json # Dokumentasi dan set eksekusi API interaktif
┣ 📜 package.json       # Manajemen dependensi ekosistem
┗ 📜 .gitignore         # Eksklusi repository version control
```

## <a id="section-11"></a>👥 11. Penulis & Rincian Kontribusi

- **Ari Hermawan**
  - **Peran:** Lead Backend Engineer / System Architect
  - **Kontribusi:** Merancang skema database (PostgreSQL + Prisma), mengembangkan algoritma transfer atomik lintas batas, mengonfigurasi pengujian end-to-end, dan menyusun standar dokumentasi integrasi API.

## <a id="section-12"></a>🗺️ 12. Tech Stack & Rencana Pengembangan Masa Depan (Roadmap)

**Tech Stack Inti:** `Node.js (LTS)`, `Express.js`, `PostgreSQL`, `Prisma (v5.22.0)`, `Jest`, `Supertest`, `Bcrypt`, `JSONWebToken`.

**Roadmap Skalabilitas Lanjutan:**
1. [ ] **Implementasi Message Broker (Redis/BullMQ):** Memisahkan tugas transfer menjadi *asynchronous background jobs* untuk menangani lonjakan konkurensi (mencegah *database timeout* saat *traffic spike*).
2. [ ] **Multi-Currency E-Wallet Engine:** Merestrukturisasi *schema* untuk menampung saldo dompet dalam berbagai *currency* (USD, IDR, dll.) dengan integrasi kalkulasi *exchange rate* dinamis.
3. [ ] **Integrasi Webhook Payment Gateway:** Mengotomasi *Top-Up* melalui *webhook event listener* dari layanan perbankan/Payment Gateway pihak ketiga (Midtrans/Xendit/Stripe) demi validasi arus kas instan.

