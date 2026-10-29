# LOG PERUBAHAN: AI Account Manager (PWA)

Mengikuti Keep a Changelog dan SemVer. Perubahan Level S (`[MINOR]`) dan task revisi (`TASK-REV-NN`) wajib tercatat di sini.

---

## [Unreleased]

### Added
- Inisialisasi berkas kontrol ZLCE (LITE) dan setup PWA ([TASK-001]).
- Konfigurasi Web App Manifest (`public/manifest.webmanifest`) dan ikon PWA (`icon-192.svg`, `icon-512.svg`).
- Integrasi Vitest test runner dan smoke test (`tests/smoke.test.ts`).
- Konfigurasi `base: './'` pada `vite.config.ts` untuk kompatibilitas subpath GitHub Pages.
- Verifikasi dependensi riil ke `BLUEPRINT.md` v0.5.
