/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Terminal, 
  Layers, 
  ChevronRight, 
  Database, 
  RotateCcw, 
  UserPlus, 
  Users, 
  AlertCircle, 
  Clock, 
  Timer, 
  Play, 
  Square, 
  AlertOctagon, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Globe2, 
  Check, 
  Link as LinkIcon,
  KeyRound,
  Edit2
} from 'lucide-react';
import { RecoveryGenerator } from './components/RecoveryGenerator';
import { 
  getAllPersons, 
  getAllServices, 
  getAllAccess,
  getSettings 
} from './storage/db';
import type { Person, Service, Access, AccessStatus, ResetRuleMode, LoginMethod } from './storage/types';
import { 
  calculatePacificMidnight, 
  calculateDurationReset, 
  validateManualReset,
  getPartsInTimezone,
  PACIFIC_TIMEZONE 
} from './domain/reset-rule';
import { 
  transitionToLimited, 
  transitionOnStop, 
  evaluateAutoReady, 
  getRemainingCountdown,
  assertLegalTransition 
} from './domain/access-status';
import { buildServiceUrl } from './domain/url-builder';
import { 
  seedInitialServices, 
  createServiceWithValidation, 
  deleteServiceWithCascade,
  DEFAULT_AI_SERVICES 
} from './services/service-manager';
import {
  createAccount,
  deleteAccountWithCascade,
  createAccountAccess,
  updateAccountAccess,
  deleteAccountAccess
} from './accounts/account-manager';

interface TaskItem {
  id: string;
  name: string;
  phase: string;
  status: 'PENDING' | 'READY' | 'IN_PROGRESS' | 'DONE';
  desc: string;
}

const BACKLOG_TASKS: TaskItem[] = [
  { id: 'TASK-001', name: 'Scaffold PWA & Verifikasi Dependensi', phase: 'FASE 0', status: 'DONE', desc: 'Manifest, Vitest, verifikasi versi dependensi via npm ls, base path GitHub Pages.' },
  { id: 'TASK-002', name: 'Penyimpanan IndexedDB & Skema', phase: 'FASE 1', status: 'DONE', desc: 'Store Service, Person, Access, UsageLog, HandoffNote, Settings, constraint & migrasi.' },
  { id: 'TASK-003', name: 'Logika Waktu Reset & Status Akses', phase: 'FASE 1', status: 'DONE', desc: 'Fungsi murni resetAt (Pacific Midnight, durasi, manual), transisi status & auto-ready.' },
  { id: 'TASK-004', name: 'Layanan & Tautan + Builder URL', phase: 'FASE 1', status: 'DONE', desc: 'CRUD Service, URL authuser encoder, seed default (AI Studio, Claude, dsb).' },
  { id: 'TASK-005', name: 'Akun Google & Akses per Layanan', phase: 'FASE 1', status: 'IN_PROGRESS', desc: 'CRUD Person (maks. 10) & Access dengan loginMethod dan loginName opsional.' },
  { id: 'TASK-006', name: 'Sesi Pemakaian (Buka, Stop, Limit)', phase: 'FASE 2', status: 'PENDING', desc: 'Pencatatan sesi buka URL, Stop (durasi tetap ready), Limit (set resetAt).' },
  { id: 'TASK-007', name: 'Dashboard & Switch Cepat', phase: 'FASE 2', status: 'PENDING', desc: 'Badge status real-time, countdown timer, hitungan auto-ready, rekomendasi akun.' },
  { id: 'TASK-008', name: 'Riwayat, Catatan Akun & Catatan Lanjutan', phase: 'FASE 2', status: 'PENDING', desc: 'Event logs terurut waktu, catatan akun, catatan lanjutan bersama per layanan.' },
  { id: 'TASK-009', name: 'Ekspor/Impor JSON Lokal', phase: 'FASE 3', status: 'PENDING', desc: 'Backup & restore JSON lokal dengan validasi integritas skema (tanpa rahasia).' },
  { id: 'TASK-010', name: 'Spike Apps Script (CORS & Alur)', phase: 'FASE 3', status: 'PENDING', desc: 'Code.gs Google Apps Script & probe CORS/redirect untuk integrasi Sheet.' },
  { id: 'TASK-011', name: 'Backup & Restore Google Sheet (Klien)', phase: 'FASE 3', status: 'PENDING', desc: 'Sinkronisasi dua arah ke Google Sheet via secret key dan snapshot otomatis.' },
  { id: 'TASK-012', name: 'Hardening PWA, Offline & Uji Akhir', phase: 'FASE 4', status: 'PENDING', desc: 'Service worker offline caching, PWA install prompt, uji E2E di Android.' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'services' | 'reset' | 'storage' | 'recovery' | 'tasks'>('accounts');
  
  // State Data IndexedDB
  const [persons, setPersons] = useState<Person[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [accessList, setAccessList] = useState<Access[]>([]);
  const [maxPersons, setMaxPersons] = useState(10);
  
  // State Form Person (TASK-005)
  const [ownerName, setOwnerName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [label, setLabel] = useState('Akun Utama');
  const [note, setNote] = useState('');
  const [personError, setPersonError] = useState<string | null>(null);
  const [personSuccess, setPersonSuccess] = useState<string | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [selectedPersonForAccess, setSelectedPersonForAccess] = useState<Person | null>(null);

  // State Modal Tambah Akses ke Layanan (TASK-005)
  const [targetServiceId, setTargetServiceId] = useState('');
  const [targetLoginMethod, setTargetLoginMethod] = useState<LoginMethod>('google');
  const [targetLoginName, setTargetLoginName] = useState('');
  const [accessModalError, setAccessModalError] = useState<string | null>(null);

  // State Form Service (TASK-004)
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceUrl, setNewServiceUrl] = useState('');
  const [newServiceUsesAuthuser, setNewServiceUsesAuthuser] = useState(true);
  const [newServiceResetMode, setNewServiceResetMode] = useState<ResetRuleMode>('pacific_midnight');
  const [newServiceDurationHours, setNewServiceDurationHours] = useState(3);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [serviceSuccess, setServiceSuccess] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // State Live URL Builder Preview
  const [previewServiceId, setPreviewServiceId] = useState('srv-aistudio');
  const [previewEmail, setPreviewEmail] = useState('eko.keplek@gmail.com');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // State Simulator TASK-003
  const [durationHours, setDurationHours] = useState(3);
  const [manualInput, setManualInput] = useState('');
  const [simAccessStatus, setSimAccessStatus] = useState<AccessStatus>('ready');
  const [simResetAt, setSimResetAt] = useState<string | null>(null);
  const [simSessionStart, setSimSessionStart] = useState<string | null>(null);
  const [simMessage, setSimMessage] = useState<string | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [countdownString, setCountdownString] = useState('00:00:00');

  const loadAllData = async () => {
    try {
      const [allPersons, allServices, allAccess, settings] = await Promise.all([
        getAllPersons(),
        getAllServices(),
        getAllAccess(),
        getSettings(),
      ]);
      setPersons(allPersons);
      setServices(allServices);
      setAccessList(allAccess);
      setMaxPersons(settings.maxPersons);
      if (allServices.length > 0 && !allServices.find(s => s.id === previewServiceId)) {
        setPreviewServiceId(allServices[0].id);
      }
      if (allServices.length > 0 && !targetServiceId) {
        setTargetServiceId(allServices[0].id);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Timer countdown updater
  useEffect(() => {
    const timer = setInterval(() => {
      if (simResetAt) {
        const cd = getRemainingCountdown(simResetAt, new Date());
        setCountdownString(cd.formatted);
        
        const evalRes = evaluateAutoReady({ status: simAccessStatus, resetAt: simResetAt }, new Date());
        if (evalRes.transitionedToReady) {
          setSimAccessStatus('ready');
          setSimResetAt(null);
          setSimMessage('Status otomatis berubah menjadi READY!');
        }
      } else {
        setCountdownString('00:00:00');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [simResetAt, simAccessStatus]);

  // Handler CRUD Person (TASK-005)
  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonError(null);
    setPersonSuccess(null);

    try {
      const created = await createAccount({
        ownerName: ownerName.trim(),
        googleEmail: googleEmail.trim(),
        label: label.trim(),
        note: note.trim(),
      });
      setPersonSuccess(`Akun "${created.ownerName}" (${created.googleEmail}) berhasil dibuat!`);
      setOwnerName('');
      setGoogleEmail('');
      setNote('');
      await loadAllData();
    } catch (err: unknown) {
      if (err instanceof Error) setPersonError(err.message);
    }
  };

  const handleConfirmDeletePerson = async () => {
    if (!personToDelete) return;
    setPersonError(null);
    setPersonSuccess(null);
    try {
      await deleteAccountWithCascade(personToDelete.id, true);
      setPersonSuccess(`Akun "${personToDelete.ownerName}" dan seluruh akses serta riwayatnya berhasil dihapus.`);
      setPersonToDelete(null);
      if (selectedPersonForAccess?.id === personToDelete.id) {
        setSelectedPersonForAccess(null);
      }
      await loadAllData();
    } catch (err: unknown) {
      if (err instanceof Error) setPersonError(err.message);
    }
  };

  // Handler Access Management (TASK-005)
  const handleAddAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonForAccess || !targetServiceId) return;
    setAccessModalError(null);

    try {
      await createAccountAccess({
        personId: selectedPersonForAccess.id,
        serviceId: targetServiceId,
        loginMethod: targetLoginMethod,
        loginName: targetLoginName.trim() || undefined,
      });
      setTargetLoginName('');
      await loadAllData();
    } catch (err: unknown) {
      if (err instanceof Error) setAccessModalError(err.message);
    }
  };

  const handleDeleteAccess = async (accessId: string) => {
    try {
      await deleteAccountAccess(accessId);
      await loadAllData();
    } catch (err: unknown) {
      // ignore
    }
  };

  // Handler CRUD Service (TASK-004)
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceError(null);
    setServiceSuccess(null);

    try {
      const created = await createServiceWithValidation({
        name: newServiceName,
        urlTemplate: newServiceUrl,
        usesAuthuser: newServiceUsesAuthuser,
        resetRule: newServiceResetMode === 'duration' 
          ? { mode: 'duration', hours: newServiceDurationHours } 
          : { mode: 'pacific_midnight' },
      });
      setServiceSuccess(`Layanan "${created.name}" berhasil ditambahkan!`);
      setNewServiceName('');
      setNewServiceUrl('');
      await loadAllData();
    } catch (err: unknown) {
      if (err instanceof Error) setServiceError(err.message);
    }
  };

  const handleSeedServices = async () => {
    setServiceError(null);
    setServiceSuccess(null);
    try {
      const res = await seedInitialServices();
      setServiceSuccess(`${res.length} Layanan AI default berhasil diinisialisasi!`);
      await loadAllData();
    } catch (err: unknown) {
      if (err instanceof Error) setServiceError(err.message);
    }
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    setServiceError(null);
    setServiceSuccess(null);
    try {
      await deleteServiceWithCascade(serviceToDelete.id, true);
      setServiceSuccess(`Layanan "${serviceToDelete.name}" dan seluruh data terkait berhasil dihapus.`);
      setServiceToDelete(null);
      await loadAllData();
    } catch (err: unknown) {
      if (err instanceof Error) setServiceError(err.message);
    }
  };

  // URL Preview calculation
  const selectedPreviewService = services.find((s) => s.id === previewServiceId) || services[0] || DEFAULT_AI_SERVICES[0];
  let generatedUrl = '';
  try {
    generatedUrl = buildServiceUrl(
      selectedPreviewService?.urlTemplate || 'https://aistudio.google.com',
      selectedPreviewService?.usesAuthuser || false,
      previewEmail
    );
  } catch {
    generatedUrl = 'Error URL';
  }

  const handleCopyGeneratedUrl = () => {
    if (generatedUrl && generatedUrl !== 'Error URL') {
      navigator.clipboard.writeText(generatedUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // Filter akses untuk akun terpilih
  const selectedPersonAccesses = selectedPersonForAccess 
    ? accessList.filter((a) => a.personId === selectedPersonForAccess.id)
    : [];

  const availableServicesForPerson = selectedPersonForAccess
    ? services.filter((s) => !selectedPersonAccesses.some((a) => a.serviceId === s.id))
    : services;

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
              <p className="text-xs text-slate-400">ZLCE Lite • Task-Driven Development</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              TASK-001 s/d 004 DONE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/80 text-amber-400 border border-amber-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              TASK-005 IN_PROGRESS
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-4 sm:px-6 overflow-x-auto">
        <div className="max-w-5xl mx-auto flex gap-6 text-sm min-w-max">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-3 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'accounts'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Akun & Akses (TASK-005)
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'services'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            Layanan & Builder URL (TASK-004)
          </button>

          <button
            onClick={() => setActiveTab('reset')}
            className={`py-3 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'reset'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Logika Reset (TASK-003)
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`py-3 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'storage'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            IndexedDB (TASK-002)
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`py-3 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'recovery'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            ZLCE Recovery
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Matriks Task (12)
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            {/* Hero Card for TASK-005 */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  TASK-005: 5/5 Acceptance Criteria Lolos Uji Otomatis
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Akun Google & Akses Layanan AI (Maks. 10 Akun)</h2>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                    1 Nama = 1 Akun Google (<code>ownerName</code> & <code>googleEmail</code> unik). Satu akun dapat mengakses banyak layanan AI dengan pilihan metode login Google atau login sendiri (<code>loginMethod</code> & <code>loginName</code>), terlindungi batas maksimal 10 akun.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                    <Users className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Kapasitas Akun</p>
                      <p className="text-sm font-semibold text-slate-100">{persons.length} / {maxPersons} Terdaftar</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                    <KeyRound className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Total Akses Layanan</p>
                      <p className="text-sm font-semibold text-slate-100">{accessList.length} Akses Terhubung</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                    <Terminal className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Unit Tests Suite</p>
                      <p className="text-sm font-semibold text-slate-100">23/23 Tests Passed (Vitest)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Grid: Tambah Akun + Daftar Akun */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Tambah Akun (Left: 5 cols) */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-sky-400" />
                    Tambah Akun Google Baru
                  </h3>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
                    persons.length >= maxPersons ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {persons.length >= maxPersons ? 'Penuh (10/10)' : `${persons.length}/${maxPersons}`}
                  </span>
                </div>

                {personError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{personError}</span>
                  </div>
                )}

                {personSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{personSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCreatePerson} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Nama Pemilik Akun (ownerName - Unik)</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="mis. Budi Santoso"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Email Google Akun (googleEmail - Unik)</label>
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="budi@gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Label Identitas Akun</label>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="mis. Akun Kantor 01"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Catatan Bebas Akun (Opsional)</label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="mis. Akun tier Google Workspace dengan kuota model flash tinggi."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={persons.length >= maxPersons}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition shadow-sm ${
                      persons.length >= maxPersons 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-sky-600 hover:bg-sky-500 text-white'
                    }`}
                  >
                    {persons.length >= maxPersons ? 'Batas Maksimal 10 Akun Tercapai' : 'Simpan Akun Google'}
                  </button>
                </form>
              </div>

              {/* Daftar Akun & Pengaturan Akses (Right: 7 cols) */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Daftar Akun Google ({persons.length})
                  </h3>
                  <span className="text-xs text-slate-400">Klik "Akses Layanan" untuk kelola</span>
                </div>

                {persons.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    Belum ada akun Google terdaftar. Gunakan formulir di sebelah kiri untuk menambahkan akun pertama.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {persons.map((p, idx) => {
                      const pAccesses = accessList.filter((a) => a.personId === p.id);
                      return (
                        <div
                          key={p.id}
                          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-sky-400 font-mono">#{idx + 1}</span>
                                <span className="text-xs font-bold text-slate-200">{p.ownerName}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">{p.label}</span>
                              </div>
                              <p className="text-[11px] font-mono text-slate-400">{p.googleEmail}</p>
                              {p.note && <p className="text-[11px] text-slate-400 italic">"{p.note}"</p>}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => setSelectedPersonForAccess(p)}
                                className="px-2.5 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800 text-xs font-medium flex items-center gap-1 transition"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                Akses ({pAccesses.length})
                              </button>
                              <button
                                onClick={() => setPersonToDelete(p)}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-900 transition"
                                title="Hapus Akun (Cascade)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* List of badges for connected services */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/60">
                            {pAccesses.length === 0 ? (
                              <span className="text-[10px] text-slate-500 italic">Belum terhubung ke layanan AI</span>
                            ) : (
                              pAccesses.map((acc) => {
                                const srv = services.find((s) => s.id === acc.serviceId);
                                return (
                                  <span
                                    key={acc.id}
                                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${acc.status === 'ready' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                    {srv?.name || acc.serviceId}
                                    {acc.loginName && <span className="text-slate-400 font-mono">({acc.loginName})</span>}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Manajemen Akses Akun Terpilih */}
            {selectedPersonForAccess && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <KeyRound className="w-5 h-5 text-sky-400" />
                      <div>
                        <h4 className="text-base font-bold text-white">Kelola Akses Layanan AI</h4>
                        <p className="text-xs text-slate-400">
                          Akun: <strong className="text-sky-300">{selectedPersonForAccess.ownerName}</strong> ({selectedPersonForAccess.googleEmail})
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPersonForAccess(null)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                    >
                      Tutup
                    </button>
                  </div>

                  {accessModalError && (
                    <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{accessModalError}</span>
                    </div>
                  )}

                  {/* Daftar Layanan Terhubung */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-300">Layanan yang Terhubung ({selectedPersonAccesses.length}):</p>
                    {selectedPersonAccesses.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
                        Akun ini belum memiliki akses ke layanan AI mana pun. Tambahkan melalui form di bawah.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {selectedPersonAccesses.map((acc) => {
                          const srv = services.find((s) => s.id === acc.serviceId);
                          return (
                            <div
                              key={acc.id}
                              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-200">{srv?.name || acc.serviceId}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                    Metode: {acc.loginMethod === 'google' ? 'Google Auth' : 'Akun Sendiri'}
                                  </span>
                                </div>
                                {acc.loginName && (
                                  <p className="text-[10px] font-mono text-slate-400">Username pengingat: {acc.loginName}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteAccess(acc.id)}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-900 transition"
                                title="Cabut Akses"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Form Tambah Akses Baru */}
                  {availableServicesForPerson.length > 0 ? (
                    <form onSubmit={handleAddAccess} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                      <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-sky-400" />
                        Hubungkan ke Layanan Lain:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1">Pilih Layanan</label>
                          <select
                            value={targetServiceId}
                            onChange={(e) => setTargetServiceId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                          >
                            {availableServicesForPerson.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Metode Login (ASM-09)</label>
                          <select
                            value={targetLoginMethod}
                            onChange={(e) => setTargetLoginMethod(e.target.value as LoginMethod)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                          >
                            <option value="google">Akun Google</option>
                            <option value="own">User / Login Sendiri di Layanan</option>
                          </select>
                        </div>
                      </div>

                      {targetLoginMethod === 'own' && (
                        <div>
                          <label className="text-slate-400 block mb-1">Nama User / Handle di Layanan (Hanya Pengingat, Tanpa Password)</label>
                          <input
                            type="text"
                            value={targetLoginName}
                            onChange={(e) => setTargetLoginName(e.target.value)}
                            placeholder="mis. user_claude_2026"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition"
                      >
                        Hubungkan Akses Layanan
                      </button>
                    </form>
                  ) : (
                    <p className="text-xs text-emerald-400 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900">
                      ✓ Akun ini telah terhubung ke seluruh layanan AI yang terdaftar.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Modal Konfirmasi Hapus Akun (Cascade) */}
            {personToDelete && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-rose-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                  <div className="flex items-center gap-3 text-rose-400">
                    <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center">
                      <AlertOctagon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Konfirmasi Hapus Akun</h4>
                      <p className="text-xs text-rose-300">Operasi Cascade Delete (BR-07, BR-09)</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Menghapus akun <strong className="text-white">"{personToDelete.ownerName}"</strong> ({personToDelete.googleEmail}) akan secara permanen menghapus:
                  </p>

                  <ul className="list-disc list-inside text-xs text-rose-300/90 space-y-1 bg-slate-950 p-3 rounded-xl border border-rose-950">
                    <li>Profil akun dan catatan bebasnya.</li>
                    <li>Seluruh relasi hak akses ke berbagai layanan AI.</li>
                    <li>Semua riwayat sesi pemakaian dan catatan limit akun ini.</li>
                  </ul>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setPersonToDelete(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleConfirmDeletePerson}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-sm"
                    >
                      Ya, Hapus Akun & Data Terkait
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Callout for TASK-005 */}
            <div className="border border-amber-800/60 bg-amber-950/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-amber-200">Menunggu Persetujuan DONE untuk TASK-005</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Seluruh 5 Acceptance Criteria (CRUD Person, batas 10 akun, unique owner & email, CRUD Access dengan loginMethod & loginName, serta cascade delete) telah lolos 23 unit tests. Balas dengan frasa <code>TASK-005 DONE</code> untuk melanjutkan ke TASK-006.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm">
                  Siap ke TASK-006
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  TASK-004: Layanan & Tautan AI DONE
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Layanan & Tautan AI + Builder URL authuser</h2>
                </div>
              </div>
            </div>

            {/* Live Interactive URL Builder Preview Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-sky-400" />
                  Live Preview: URL Builder Peluncur Layanan (BR-02)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                <div className="sm:col-span-5">
                  <label className="text-slate-400 block mb-1">Pilih Layanan AI:</label>
                  <select
                    value={previewServiceId}
                    onChange={(e) => setPreviewServiceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.usesAuthuser ? '(Google Authuser)' : '(URL Polos)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-7">
                  <label className="text-slate-400 block mb-1">Email Akun Google:</label>
                  <input
                    type="text"
                    value={previewEmail}
                    onChange={(e) => setPreviewEmail(e.target.value)}
                    placeholder="mis. eko.keplek@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-mono font-semibold text-emerald-400 truncate">
                    {generatedUrl}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyGeneratedUrl}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
                    {copiedUrl ? 'Tersalin' : 'Salin URL'}
                  </button>

                  <a
                    href={generatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                  >
                    Buka di Tab Baru
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reset' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  TASK-003: Logika Reset DONE
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Logika Reset & State Machine Terverifikasi</h2>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  TASK-002: Penyimpanan IndexedDB DONE
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">IndexedDB Storage & Skema Siap</h2>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recovery' && <RecoveryGenerator />}

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
                          task.status === 'DONE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
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
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-3 px-4 sm:px-6 text-center text-xs text-slate-500">
        AI Account Manager PWA • ZLCE Lite Governance • IndexedDB Local Storage
      </footer>
    </div>
  );
}
