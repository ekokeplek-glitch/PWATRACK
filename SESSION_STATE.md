# STATUS SESI (SESSION_STATE.md): AI Account Manager (PWA)

**Sumber kebenaran tunggal status task dan titik pemulihan sesi.** Perbarui pada setiap perubahan status task, setiap commit, dan setiap langkah WAL. Enum: `PENDING | READY | IN_PROGRESS | BLOCKED | DONE`.
Format dibaca skrip `scripts/zlce/zlce-check.py`; jangan ubah nama field, kolom, atau nomor bagian.

---

## 0. KONTEKS PROYEK (statis)

* **Proyek:** AI Account Manager (PWA)
* **Stack:** React + Vite PWA, IndexedDB, tanpa backend; backup/restore ke Google Sheet via Apps Script Web App
* **MODE:** LITE
* **Kemampuan Tulis Berkas AI:** YA (lingkungan AI Studio terintegrasi berkas langsung)
* **Kemampuan Eksekusi AI:** YA (lingkungan AI Studio terintegrasi eksekusi perintah & tes)

---

## 1. STATUS AKTIF

* **Timestamp Audit:** 2026-10-29 jam: ?
* **Cabang Git:** `main`
* **Task Terakhir DONE:** `TASK-005`
* **Task Aktif:** `TASK-006`
* **Status Task Aktif:** IN_PROGRESS
* **Task Berikutnya:** `TASK-007`

---

## 2. MATRIKS TASK

| ID Task | Nama | Dependensi | Status | Bukti Verifikasi | Disetujui |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-001` | Scaffold PWA & Verifikasi Dependensi | - | DONE | build exit 0, lint 0 error, vitest 1/1 pass (smoke.test), npm ls terverifikasi, base './' | ya |
| `TASK-002` | Penyimpanan IndexedDB & Skema | TASK-001 | DONE | 4/4 vitest pass (storage.test), lint 0 error, build exit 0; unique constraint, max 10 persons, migration verified | ya |
| `TASK-003` | Logika Waktu Reset & Status Akses | TASK-001 | DONE | 7/7 vitest pass (reset-rule.test & access-status.test), lint 0 error, build exit 0; DST boundary & state machine verified | ya |
| `TASK-004` | Layanan & Tautan + Builder URL | TASK-002, TASK-003 | DONE | 18/18 vitest pass (url-builder.test & service.test), lint 0 error, build exit 0; http(s) guard, authuser encoded, cascade delete verified | ya |
| `TASK-005` | Akun Google & Akses per Layanan | TASK-002 | DONE | 23/23 vitest pass (person.test & access.test), lint 0 error, build exit 0; max 10 persons, unique owner & email, loginMethod & loginName, cascade delete verified | ya |
| `TASK-006` | Sesi Pemakaian (Buka, Stop, Limit) | TASK-003, TASK-004, TASK-005 | IN_PROGRESS | 27/27 vitest pass (session.test), lint 0 error, build exit 0; open & session start, stop duration, limit & edit resetAt, auto-ready single log verified | - |
| `TASK-007` | Dashboard & Switch Cepat | TASK-006 | PENDING | - | - |
| `TASK-008` | Riwayat, Catatan Akun & Catatan Lanjutan | TASK-006 | PENDING | - | - |
| `TASK-009` | Ekspor/Impor JSON Lokal | TASK-008 | PENDING | - | - |
| `TASK-010` | Spike Apps Script (CORS & Alur) | TASK-002 | PENDING | - | - |
| `TASK-011` | Backup & Restore Google Sheet (Klien) | TASK-009, TASK-010 | PENDING | - | - |
| `TASK-012` | Hardening PWA, Offline & Uji Akhir | TASK-007, TASK-008, TASK-011 | PENDING | - | - |

Bukti Verifikasi: ringkasan + lokasi bukti. `DONE` tanpa bukti dan `Disetujui: ya` tidak valid.

---

## 3. WORK IN PROGRESS (WAL)

Catatan tulis-dahulu: isi SEBELUM memulai langkah multi-berkas, perbarui SESUDAH langkah selesai. Kosongkan (semua `-`) saat task `DONE`.

* **Task:** TASK-006
* **Langkah Sedang Dikerjakan:** Menunggu persetujuan eksplisit DONE dari pengguna untuk TASK-006
* **Berkas Direncanakan/Disentuh:** src/session/session-manager.ts, tests/session.test.ts, src/App.tsx, SESSION_STATE.md, CHANGELOG.md
* **Sudah Dilakukan:** Implementasi session-manager.ts (openSession dengan auto browser launch & log opened, stopSession dengan kalkulasi durasi & status tetap ready, hitLimitSession dengan aturan layanan/manual & log limit_hit, editLimitResetAt untuk koreksi waktu reset saat limited, dan processAutoReadyCheck yang mencatat log reset_ready tepat 1 kali per siklus), 4 unit tests baru lulus (total 27/27 tests passed), UI interaktif Sesi Pemakaian di App.tsx
* **Langkah Berikutnya (persis):** Dapatkan konfirmasi persetujuan "TASK-006 DONE", tandai DONE di matriks, ubah TASK-007 ke READY / IN_PROGRESS, lalu implementasikan Dashboard & Switch Cepat (src/ui/*)
* **Perintah Verifikasi:** npm test && npm run lint && npm run build
* **Diperbarui:** 2026-10-29 jam: ?

---

## 4. ASSUMPTIONS & OPEN QUESTIONS

| ID | Jenis | Isi | Dampak jika salah | Status |
| :--- | :--- | :--- | :--- | :--- |
| `Q-01` | Pertanyaan | Backup Google Sheet via Apps Script Web App, dua arah (backup + restore) | Tugas backup/restore | ANSWERED |
| `ASM-02` | Asumsi | Maks. 10 akun total | Validasi | CONFIRMED |
| `ASM-03` | Asumsi | Tiap layanan punya akun/akses, aturan reset, dan riwayat sendiri | Struktur data | CONFIRMED |
| `ASM-04` | Asumsi | Limit = isian reset manual (default dari aturan layanan), lalu tunggu reset; Stop = tetap Ready | Logika status | CONFIRMED |
| `Q-05` | Pertanyaan | Satu nama = satu akun; perlu catatan lanjutan | Entitas | ANSWERED |
| `ASM-06` | Asumsi | 1 nama = 1 akun Google, dipakai lintas banyak AI/tautan; limit dicatat per layanan (model Person + Access) | Skema data | CONFIRMED |
| `ASM-07` | Asumsi | Catatan lanjutan = catatan bersama per layanan, ditulis atas nama pemilik akun aktif, tampil saat switch | Entitas + UI | CONFIRMED |
| `Q-08` | Pertanyaan | Hosting statis HTTPS untuk PWA: GitHub (dibaca sebagai GitHub Pages) | Install PWA, uji CORS Apps Script (TASK-012) | ANSWERED |
| `ASM-09` | Asumsi | Layanan non-Google (Claude, OpenAI, DeepSeek, x.com) dibuka tanpa parameter akun; login memakai akun Google atau user/login sendiri di layanan itu (dicatat di `Access.loginMethod`/`loginName`, tanpa password); URL seed dapat diedit | Builder URL, skema Access, UX switch | CONFIRMED |

Status: `OPEN | CONFIRMED | REJECTED | ANSWERED`. Jika ragu, catat di sini dan tanyakan; jangan mengarang.

---

## 5. SLOT REVISI AKTIF

| ID | Level (S/M/L) | Deskripsi | Tindakan |
| :--- | :--- | :--- | :--- |
| (kosong) | | | |

---

## 6. CATATAN SERAH TERIMA (ditimpa; maks. ~10 baris)

* [2026-10-29] TASK-005 resmi disetujui DONE ("TASK-005 DONE lanjutkan ke TASK-006").
* [2026-10-29] TASK-006 diimplementasikan penuh di src/session/session-manager.ts.
* [2026-10-29] 5 AC TASK-006 terpenuhi: buka & activeSessionStart, stop & durasi, limit & resetAt, koreksi resetAt saat limited, dan evaluasi auto-ready single-log.
* [2026-10-29] Menunggu persetujuan eksplisit pengguna untuk menandai TASK-006 DONE sebelum mulai TASK-007.

---

## 7. LOG AUDIT (terbaru di atas; arsipkan entri lama ke `docs/archive/`)

* **[2026-10-29 jam: ?]:** Eksekusi TASK-006: Implementasi src/session/session-manager.ts, 4 unit test tambahan lulus 100% (open_logs_and_sets_start, stop_keeps_ready_with_duration, limit_sets_resetAt, reset_ready_logged_once). Total 27/27 test passed. Status: IN_PROGRESS (menunggu persetujuan DONE).
* **[2026-10-29 jam: ?]:** Pengguna menyetujui TASK-005 DONE ("TASK-005 DONE lanjutkan ke TASK-006"). TASK-005 status DONE (Disetujui: ya). TASK-006 status IN_PROGRESS.
=== END CHECKPOINT ===
