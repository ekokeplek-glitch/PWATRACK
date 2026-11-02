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
* **Task Terakhir DONE:** `TASK-010`
* **Task Aktif:** `TASK-011`
* **Status Task Aktif:** READY
* **Task Berikutnya:** `TASK-012`

---

## 2. MATRIKS TASK

| ID Task | Nama | Dependensi | Status | Bukti Verifikasi | Disetujui |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-001` | Scaffold PWA & Verifikasi Dependensi | - | DONE | build exit 0, lint 0 error, vitest 1/1 pass (smoke.test), npm ls terverifikasi, base './' | ya |
| `TASK-002` | Penyimpanan IndexedDB & Skema | TASK-001 | DONE | 4/4 vitest pass (storage.test), lint 0 error, build exit 0; unique constraint, max 10 persons, migration verified | ya |
| `TASK-003` | Logika Waktu Reset & Status Akses | TASK-001 | DONE | 7/7 vitest pass (reset-rule.test & access-status.test), lint 0 error, build exit 0; DST boundary & state machine verified | ya |
| `TASK-004` | Layanan & Tautan + Builder URL | TASK-002, TASK-003 | DONE | 18/18 vitest pass (url-builder.test & service.test), lint 0 error, build exit 0; http(s) guard, authuser encoded, cascade delete verified | ya |
| `TASK-005` | Akun Google & Akses per Layanan | TASK-002 | DONE | 23/23 vitest pass (person.test & access.test), lint 0 error, build exit 0; max 10 persons, unique owner & email, loginMethod & loginName, cascade delete verified | ya |
| `TASK-006` | Sesi Pemakaian (Buka, Stop, Limit) | TASK-003, TASK-004, TASK-005 | DONE | 27/27 vitest pass (session.test), lint 0 error, build exit 0; open & session start, stop duration, limit & edit resetAt, auto-ready single log verified | ya |
| `TASK-007` | Dashboard & Switch Cepat | TASK-006 | DONE | 29/29 vitest pass (dashboard.test), lint 0 error, build exit 0; kartu layanan, hitung mundur live, banner auto-ready, rekomendasi switch <= 2 taps verified | ya |
| `TASK-008` | Riwayat, Catatan Akun & Catatan Lanjutan | TASK-006 | DONE | 32/32 vitest pass (handoff.test & history.test), lint 0 error, build exit 0; audit trail kronologis terpadu, catatan akun inline, handoff note per layanan dengan authorName verified | ya |
| `TASK-009` | Ekspor/Impor JSON Lokal | TASK-008 | DONE | 35/35 vitest pass (backup-json.test), lint 0 error, build exit 0; roundtrip identik, validasi skema ketat, rahasia endpoint/secret dikecualikan (BR-13) | ya |
| `TASK-010` | Spike Apps Script (CORS & Alur) | TASK-002 | DONE | 40/40 vitest pass (sheet-probe.test), lint 0 error, build exit 0; text/plain CORS bypass, Code.gs (ping/backup/restore), probe latensi, BLUEPRINT.md bagian 4 diperbarui | ya |
| `TASK-011` | Backup & Restore Google Sheet (Klien) | TASK-009, TASK-010 | READY | Klien probe, backup, restore terpasang di src/backup/sheet-probe.ts dan antarmuka Backup & Sheet di App.tsx | - |
| `TASK-012` | Hardening PWA, Offline & Uji Akhir | TASK-007, TASK-008, TASK-011 | PENDING | - | - |

Bukti Verifikasi: ringkasan + lokasi bukti. `DONE` tanpa bukti dan `Disetujui: ya` tidak valid.

---

## 3. WORK IN PROGRESS (WAL)

Catatan tulis-dahulu: isi SEBELUM memulai langkah multi-berkas, perbarui SESUDAH langkah selesai. Kosongkan (semua `-`) saat task `DONE`.

* **Task:** -
* **Langkah Sedang Dikerjakan:** -
* **Berkas Direncanakan/Disentuh:** -
* **Sudah Dilakukan:** -
* **Langkah Berikutnya (persis):** -
* **Perintah Verifikasi:** -
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

* [2026-10-30] Data Awal Log Tim Riil disinkronkan ke IndexedDB dari berkas log AI work CSV (/public/assets/aistudio/log_AI_work_644062a3).
* [2026-10-30] 9 Akun Google tim terdaftar unik: Eko Keplek, Cxperia 575, Oned Acer, Casavanza, Kepek Malang, Layang Setrum, Sulistiyani, Gete60 GPS, Acimau (memenuhi BR-07 <= 10 akun).
* [2026-10-30] 4 Layanan AI utama terdaftar: Google AI Studio, Anthropic Claude, OpenAI ChatGPT, Freebuff (+ DeepSeek).
* [2026-10-30] Status Akses Awal: Sulistiyani di AI Studio tercatat Limited (waktu reset Pacific midnight), 8 akun tim lainnya berstatus Ready.
* [2026-10-30] 29 Log Pemakaian kronologis terstruktur dan Catatan Lanjutan tim (Handoff Notes) diisi sesuai riwayat repo & tautan applet tim.
* [2026-10-30] Endpoint Web App Apps Script terhubung di Settings: https://script.google.com/macros/s/AKfycbxe9B7w3AQ7WMOEYeQg_31EiCuqNf5wpG1cF3xPEdLQCG6DLgrkfNs2lZFY4Q59X6BBNg/exec.
* [2026-10-30] 44/44 unit tests lolos (15 test files) via Vitest (`npm test`). Build lolos bersih (`compile_applet` exit 0).
* [2026-10-30] Tombol dan modal "Sinkron Data Log Tim" / "Muat Ulang Data Log Tim" tersedia di Dashboard dan tab Cadangan.

---

## 7. LOG AUDIT (terbaru di atas; arsipkan entri lama ke `docs/archive/`)

* [2026-10-29 jam: ?] TASK-006 s/d TASK-010 DONE. 40/40 tests pass. WAL dikosongkan. TASK-011 beralih ke READY.
* [2026-10-29 jam: ?] TASK-006 diimplementasikan dan 27 tests lulus. Menunggu batch lanjutan.
* [2026-10-29 jam: ?] TASK-005 DONE. 23 tests lulus. Pengguna menyetujui TASK-005.
* [2026-10-29 jam: ?] TASK-004 DONE. 18 tests lulus.
* [2026-10-29 jam: ?] TASK-003 DONE. 7 tests lulus.
* [2026-10-29 jam: ?] TASK-002 DONE. 4 tests lulus.
* [2026-10-29 jam: ?] TASK-001 DONE. Proyek di-scaffold.
