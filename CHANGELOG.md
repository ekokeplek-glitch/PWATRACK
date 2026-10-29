# LOG PERUBAHAN: AI Account Manager (PWA)

Mengikuti Keep a Changelog dan SemVer. Perubahan Level S (`[MINOR]`) dan task revisi (`TASK-REV-NN`) wajib tercatat di sini.

---

## [Unreleased]

### Added
- [TASK-006] Implementasi Sesi Pemakaian (Buka, Stop, Limit) (`src/session/session-manager.ts`):
  - `openSession`: meluncurkan URL layanan di tab baru, mencatat log `opened`, dan menyetel `activeSessionStart`.
  - `stopSession`: mengakhiri sesi aktif, menghitung durasi sesi (detik), mencatat log `stop`, dan mempertahankan status `ready`.
  - `hitLimitSession`: mengubah status ke `limited`, menyetel `resetAt` valid (> now) via kalkulasi aturan layanan atau input manual, dan mencatat log `limit_hit`.
  - `editLimitResetAt`: memungkinkan koreksi nilai `resetAt` saat status limited (menegakkan BR-05 tanpa tombol Ready manual).
  - `processAutoReadyCheck`: mendeteksi kedaluwarsa limit secara periodik, mengubah status kembali ke `ready`, dan mencatat log `reset_ready` tepat satu kali per siklus.
  - Unit test suite `tests/session.test.ts` (4 tests baru, total 27 tests lulus).
  - Antarmuka interaktif Kontrol Sesi & Riwayat Log Real-time di `src/App.tsx`.
- [TASK-005] Implementasi Akun Google & Akses per Layanan (`src/accounts/account-manager.ts`).
- [TASK-004] Implementasi Layanan & Tautan (Add/Remove) + Builder URL (`src/domain/url-builder.ts` & `src/services/service-manager.ts`).
- [TASK-003] Implementasi Logika Waktu Reset & Status Akses (`src/domain/reset-rule.ts` & `src/domain/access-status.ts`).
- [TASK-002] Implementasi penyimpanan IndexedDB & Skema Data (`src/storage/db.ts` & `src/storage/types.ts`).
- [TASK-001] Inisialisasi berkas kontrol ZLCE (LITE) dan setup fondasi PWA.
- [MINOR] Penambahan panel interaktif **ZLCE Recovery Generator (Opsi A)** di antarmuka web.

### Changed
- Status `TASK-001` s/d `TASK-005` disetujui pengguna menjadi `DONE`.
- Status `TASK-006` selesai diimplementasi dan seluruh 5 Acceptance Criteria terverifikasi (menunggu konfirmasi persetujuan DONE).
