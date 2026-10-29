# LOG PERUBAHAN: AI Account Manager (PWA)

Mengikuti Keep a Changelog dan SemVer. Perubahan Level S (`[MINOR]`) dan task revisi (`TASK-REV-NN`) wajib tercatat di sini.

---

## [Unreleased]

### Added
- [TASK-005] Implementasi Akun Google & Akses per Layanan (`src/accounts/account-manager.ts`):
  - Model 1 Nama = 1 Akun Google (`ownerName` dan `googleEmail` masing-masing unik, case-insensitive).
  - Validasi format email Google dan proteksi batas maksimal 10 akun (akun ke-11 otomatis ditolak dengan pesan jelas).
  - Relasi 1 akun ke banyak layanan AI (`Access`) dengan keunikan kombinasi `(personId, serviceId)`.
  - Dukungan `loginMethod` (`google` atau `own`) dan `loginName` pengingat username layanan sendiri tanpa penyimpanan password (ASM-09).
  - Penghapusan akun dengan konfirmasi eksplisit pengguna dan penghapusan *cascade* (otomatis membersihkan akses dan riwayat log terkait).
  - Unit test suite `tests/person.test.ts` & `tests/access.test.ts` (5 tests baru, total 23 tests lulus).
  - Antarmuka interaktif Manajemen Akun & Akses di `src/App.tsx`.
- [TASK-004] Implementasi Layanan & Tautan (Add/Remove) + Builder URL (`src/domain/url-builder.ts` & `src/services/service-manager.ts`):
  - Builder URL dengan penyisipan parameter `?authuser=<email>` (ter-encode aman `encodeURIComponent`).
  - Validasi ketat skema URL http/https dan inisialisasi seed 5 layanan AI utama.
  - Cascade delete layanan beserta akses, logs, dan catatan lanjutan terkait.
  - Unit test suite `tests/url-builder.test.ts` & `tests/service.test.ts`.
- [TASK-003] Implementasi Logika Waktu Reset & Status Akses (`src/domain/reset-rule.ts` & `src/domain/access-status.ts`):
  - Fungsi murni `calculatePacificMidnight` dengan penanganan transisi DST PST/PDT.
  - State machine transition guards, auto-ready evaluator, dan countdown formatter.
  - Unit test suite `tests/reset-rule.test.ts` & `tests/access-status.test.ts`.
- [TASK-002] Implementasi penyimpanan IndexedDB & Skema Data (`src/storage/db.ts` & `src/storage/types.ts`).
- [TASK-001] Inisialisasi berkas kontrol ZLCE (LITE) dan setup fondasi PWA.
- [MINOR] Penambahan panel interaktif **ZLCE Recovery Generator (Opsi A)** di antarmuka web.

### Changed
- Status `TASK-001`, `TASK-002`, `TASK-003`, dan `TASK-004` disetujui pengguna menjadi `DONE`.
- Status `TASK-005` selesai diimplementasi dan seluruh 5 Acceptance Criteria terverifikasi (menunggu konfirmasi persetujuan DONE).
