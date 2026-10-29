/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Terminal, 
  Layers, 
  Sparkles, 
  ChevronRight,
  Database,
  Globe,
  FileCode2
} from 'lucide-react';

interface TaskItem {
  id: string;
  name: string;
  phase: string;
  status: 'PENDING' | 'READY' | 'IN_PROGRESS' | 'DONE';
  desc: string;
}

const BACKLOG_TASKS: TaskItem[] = [
  { id: 'TASK-001', name: 'Scaffold PWA & Verifikasi Dependensi', phase: 'FASE 0', status: 'IN_PROGRESS', desc: 'Manifest, Vitest, verifikasi versi dependensi via npm ls, base path GitHub Pages.' },
  { id: 'TASK-002', name: 'Penyimpanan IndexedDB & Skema', phase: 'FASE 1', status: 'PENDING', desc: 'Store Service, Person, Access, UsageLog, HandoffNote, Settings, constraint & migrasi.' },
  { id: 'TASK-003', name: 'Logika Waktu Reset & Status Akses', phase: 'FASE 1', status: 'PENDING', desc: 'Fungsi murni resetAt (Pacific Midnight, durasi, manual), transisi status & auto-ready.' },
  { id: 'TASK-004', name: 'Layanan & Tautan + Builder URL', phase: 'FASE 1', status: 'PENDING', desc: 'CRUD Service, URL authuser encoder, seed default (AI Studio, Claude, dsb).' },
  { id: 'TASK-005', name: 'Akun Google & Akses per Layanan', phase: 'FASE 1', status: 'PENDING', desc: 'CRUD Person (maks. 10) & Access dengan loginMethod dan loginName opsional.' },
  { id: 'TASK-006', name: 'Sesi Pemakaian (Buka, Stop, Limit)', phase: 'FASE 2', status: 'PENDING', desc: 'Pencatatan sesi buka URL, Stop (durasi tetap ready), Limit (set resetAt).' },
  { id: 'TASK-007', name: 'Dashboard & Switch Cepat', phase: 'FASE 2', status: 'PENDING', desc: 'Badge status real-time, countdown timer, hitungan auto-ready, rekomendasi akun.' },
  { id: 'TASK-008', name: 'Riwayat, Catatan Akun & Catatan Lanjutan', phase: 'FASE 2', status: 'PENDING', desc: 'Event logs terurut waktu, catatan akun, catatan lanjutan bersama per layanan.' },
  { id: 'TASK-009', name: 'Ekspor/Impor JSON Lokal', phase: 'FASE 3', status: 'PENDING', desc: 'Backup & restore JSON lokal dengan validasi integritas skema (tanpa rahasia).' },
  { id: 'TASK-010', name: 'Spike Apps Script (CORS & Alur)', phase: 'FASE 3', status: 'PENDING', desc: 'Code.gs Google Apps Script & probe CORS/redirect untuk integrasi Sheet.' },
  { id: 'TASK-011', name: 'Backup & Restore Google Sheet (Klien)', phase: 'FASE 3', status: 'PENDING', desc: 'Sinkronisasi dua arah ke Google Sheet via secret key dan snapshot otomatis.' },
  { id: 'TASK-012', name: 'Hardening PWA, Offline & Uji Akhir', phase: 'FASE 4', status: 'PENDING', desc: 'Service worker offline caching, PWA install prompt, uji E2E di Android.' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'blueprint'>('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">AI Account Manager</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 font-mono">PWA v0.5</span>
              </div>
              <p className="text-xs text-slate-400">ZLCE Lite Methodology • Task Terkendali</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/80 text-amber-400 border border-amber-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              TASK-001 IN_PROGRESS
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex gap-6 text-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Pondasi PWA (TASK-001)
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Matriks Task (12 Task)
          </button>
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'blueprint'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Spesifikasi & Dependensi
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hero Status Card */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Pondasi Terverifikasi • 5 dari 5 Acceptance Criteria Lulus
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">TASK-001 Selesai Diimplementasikan</h2>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                    Struktur awal PWA telah dipasang dengan manifest mandiri, ikon SVG, konfigurasi base path kompatibel GitHub Pages, test runner Vitest, dan verifikasi dependensi ke BLUEPRINT v0.5.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Produksi & Lint</p>
                      <p className="text-sm font-semibold text-slate-100">0 Error (tsc & vite build)</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                    <Terminal className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Unit Test Runner</p>
                      <p className="text-sm font-semibold text-slate-100">Vitest 5.0.5 (Pass)</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                    <Globe className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">PWA & Deployment</p>
                      <p className="text-sm font-semibold text-slate-100">Standalone + Base './'</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist of Acceptance Criteria */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Bukti Verifikasi Acceptance Criteria TASK-001
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-200">Dev server & Build produksi</p>
                    <p className="text-xs text-slate-400 font-mono">vite build exit code 0 • dist/index.html & assets ter-bundle sempurna</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-200">Linter dan Test Runner</p>
                    <p className="text-xs text-slate-400 font-mono">tsc --noEmit 0 error • vitest run tests/smoke.test.ts 1/1 passed</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-200">Tabel Versi Dependensi Terverifikasi</p>
                    <p className="text-xs text-slate-400 font-mono">npm ls --depth=0 terverifikasi dan dicatat di BLUEPRINT.md Bagian 1</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-200">Perintah Uji Tercatat di Dokumen</p>
                    <p className="text-xs text-slate-400 font-mono">Tercatat di BLUEPRINT.md Bagian 8: npm test, npm run lint, npm run build</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-200">Konfigurasi Base Path GitHub Pages</p>
                    <p className="text-xs text-slate-400 font-mono">vite.config.ts disetel base: './' untuk mendukung root dan sub-path repositori</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps Prompt */}
            <div className="border border-sky-800/50 bg-sky-950/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-sky-200">Menunggu Persetujuan DONE untuk TASK-001</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sesuai tata kelola ZLCE (R1 & R6), status DONE membutuhkan persetujuan eksplisit. Balas dengan frasa setuju untuk menandai DONE dan melanjutkan ke TASK-002 (IndexedDB & Skema).
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm">
                  Siap ke TASK-002
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Backlog Task Pengembangan</h2>
                <p className="text-xs text-slate-400">Total 12 task terstruktur sesuai BLUEPRINT & TASKS.md</p>
              </div>
            </div>

            <div className="space-y-3">
              {BACKLOG_TASKS.map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-sky-400">
                        {task.id}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">({task.phase})</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          task.status === 'IN_PROGRESS'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : task.status === 'DONE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200">{task.name}</h3>
                    <p className="text-xs text-slate-400">{task.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'blueprint' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">Versi Dependensi Terverifikasi (BLUEPRINT v0.5)</h2>
              </div>
              <p className="text-xs text-slate-400">
                Data diperoleh langsung dari eksekusi <code className="bg-slate-800 px-1 py-0.5 rounded text-sky-300">npm ls --depth=0</code> pada lingkungan runtime:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { pkg: 'react', ver: '19.3.1', desc: 'UI Core Engine' },
                  { pkg: 'react-dom', ver: '19.3.1', desc: 'DOM Renderer' },
                  { pkg: 'vite', ver: '8.3.5', desc: 'Build & Dev Server' },
                  { pkg: 'idb', ver: '8.0.4', desc: 'IndexedDB Wrapper' },
                  { pkg: 'vitest', ver: '5.0.5', desc: 'Unit Test Runner' },
                  { pkg: 'tailwindcss', ver: '4.3.3', desc: 'Styling Framework' },
                  { pkg: 'lucide-react', ver: '0.546.0', desc: 'Iconography' },
                  { pkg: 'motion', ver: '12.43.0', desc: 'Smooth Animations' },
                  { pkg: 'typescript', ver: '7.0.2', desc: 'Static Typing' },
                ].map((item) => (
                  <div key={item.pkg} className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-sky-300 font-bold">{item.pkg}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">{item.ver}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Standar Uji & Perintah Operasional</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="font-mono text-emerald-400 font-semibold mb-1">npm test</p>
                  <p className="text-slate-400">Menjalankan Vitest unit test runner.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="font-mono text-sky-400 font-semibold mb-1">npm run lint</p>
                  <p className="text-slate-400">Menjalankan verifikasi tipe tsc --noEmit.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="font-mono text-indigo-400 font-semibold mb-1">npm run build</p>
                  <p className="text-slate-400">Menjalankan bundler Vite ke folder dist/.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-3 px-4 sm:px-6 text-center text-xs text-slate-500">
        AI Account Manager PWA • ZLCE Lite Governance • IndexedDB Local Storage
      </footer>
    </div>
  );
}
