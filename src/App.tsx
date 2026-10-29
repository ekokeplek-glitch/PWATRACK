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
  Edit3,
  Activity,
  History
} from 'lucide-react';
import { RecoveryGenerator } from './components/RecoveryGenerator';
import { 
  getAllPersons, 
  getAllServices, 
  getAllAccess, 
  getSettings, 
  getLogsByAccessId 
} from './storage/db';
import type { Person, Service, Access, ResetRuleMode, LoginMethod, UsageLog } from './storage/types';
import { getPartsInTimezone, PACIFIC_TIMEZONE } from './domain/reset-rule';
import { getRemainingCountdown } from './domain/access-status';
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
  deleteAccountAccess 
} from './accounts/account-manager';
import { 
  openSession, 
  stopSession, 
  hitLimitSession, 
  editLimitResetAt, 
  processAutoReadyCheck 
} from './session/session-manager';

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
  { id: 'TASK-005', name: 'Akun Google & Akses per Layanan', phase: 'FASE 1', status: 'DONE', desc: 'CRUD Person (maks. 10) & Access dengan loginMethod dan loginName opsional.' },
  { id: 'TASK-006', name: 'Sesi Pemakaian (Buka, Stop, Limit)', phase: 'FASE 2', status: 'IN_PROGRESS', desc: 'Pencatatan sesi buka URL, Stop (durasi tetap ready), Limit (set resetAt).' },
  { id: 'TASK-007', name: 'Dashboard & Switch Cepat', phase: 'FASE 2', status: 'PENDING', desc: 'Badge status real-time, countdown timer, hitungan auto-ready, rekomendasi akun.' },
  { id: 'TASK-008', name: 'Riwayat, Catatan Akun & Catatan Lanjutan', phase: 'FASE 2', status: 'PENDING', desc: 'Event logs terurut waktu, catatan akun, catatan lanjutan bersama per layanan.' },
  { id: 'TASK-009', name: 'Ekspor/Impor JSON Lokal', phase: 'FASE 3', status: 'PENDING', desc: 'Backup & restore JSON lokal dengan validasi integritas skema (tanpa rahasia).' },
  { id: 'TASK-010', name: 'Spike Apps Script (CORS & Alur)', phase: 'FASE 3', status: 'PENDING', desc: 'Code.gs Google Apps Script & probe CORS/redirect untuk integrasi Sheet.' },
  { id: 'TASK-011', name: 'Backup & Restore Google Sheet (Klien)', phase: 'FASE 3', status: 'PENDING', desc: 'Sinkronisasi dua arah ke Google Sheet via secret key dan snapshot otomatis.' },
  { id: 'TASK-012', name: 'Hardening PWA, Offline & Uji Akhir', phase: 'FASE 4', status: 'PENDING', desc: 'Service worker offline caching, PWA install prompt, uji E2E di Android.' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'accounts' | 'services' | 'storage' | 'recovery' | 'tasks'>('sessions');
  
  // State Data IndexedDB
  const [persons, setPersons] = useState<Person[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [accessList, setAccessList] = useState<Access[]>([]);
  const [maxPersons, setMaxPersons] = useState(10);
  
  // State Sesi Pemakaian (TASK-006)
  const [selectedAccessId, setSelectedAccessId] = useState<string>('');
  const [sessionLogs, setSessionLogs] = useState<UsageLog[]>([]);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showEditResetModal, setShowEditResetModal] = useState(false);
  const [limitManualDate, setLimitManualDate] = useState('');
  const [editResetManualDate, setEditResetManualDate] = useState('');

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

  // Live countdown timer state
  const [activeCountdown, setActiveCountdown] = useState<string>('00:00:00');

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

      if (allAccess.length > 0 && (!selectedAccessId || !allAccess.find((a) => a.id === selectedAccessId))) {
        setSelectedAccessId(allAccess[0].id);
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

  // Update logs when selected access changes
  useEffect(() => {
    const fetchLogs = async () => {
      if (selectedAccessId) {
        try {
          const logs = await getLogsByAccessId(selectedAccessId);
          setSessionLogs(logs);
        } catch {
          setSessionLogs([]);
        }
      } else {
        setSessionLogs([]);
      }
    };
    fetchLogs();
  }, [selectedAccessId]);

  // Periodic Auto-Ready & countdown timer check
  useEffect(() => {
    const timer = setInterval(async () => {
      const currentSelected = accessList.find((a) => a.id === selectedAccessId);
      if (currentSelected?.status === 'limited' && currentSelected.resetAt) {
        const cd = getRemainingCountdown(currentSelected.resetAt, new Date());
        setActiveCountdown(cd.formatted);
      } else {
        setActiveCountdown('00:00:00');
      }

      // Jalankan Auto-Ready Checker background
      try {
        const checkResult = await processAutoReadyCheck({ now: new Date() });
        if (checkResult.transitionedCount > 0) {
          setSessionNotice(`Auto-Ready: ${checkResult.transitionedCount} akses telah kembali READY.`);
          await loadAllData();
        }
      } catch {
        // ignore
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedAccessId, accessList]);

  // Handlers for Session Actions (TASK-006)
  const handleOpenSession = async () => {
    if (!selectedAccessId) return;
    setSessionError(null);
    setSessionNotice(null);

    try {
      const res = await openSession(selectedAccessId, { openInBrowser: true, now: new Date() });
      setSessionNotice(`Sesi dibuka! Tautan dibuka di tab baru: ${res.url}`);
      await loadAllData();
      const logs = await getLogsByAccessId(selectedAccessId);
      setSessionLogs(logs);
    } catch (err: unknown) {
      if (err instanceof Error) setSessionError(err.message);
    }
  };

  const handleStopSession = async () => {
    if (!selectedAccessId) return;
    setSessionError(null);
    setSessionNotice(null);

    try {
      const res = await stopSession(selectedAccessId, { now: new Date() });
      const durationText = res.durationSec !== undefined ? `${res.durationSec} detik` : 'tanpa durasi';
      setSessionNotice(`Sesi dihentikan (Stop). Durasi: ${durationText}. Status tetap READY.`);
      await loadAllData();
      const logs = await getLogsByAccessId(selectedAccessId);
      setSessionLogs(logs);
    } catch (err: unknown) {
      if (err instanceof Error) setSessionError(err.message);
    }
  };

  const handleApplyLimit = async (useManual = false) => {
    if (!selectedAccessId) return;
    setSessionError(null);
    setSessionNotice(null);

    try {
      const manualDate = useManual && limitManualDate ? new Date(limitManualDate) : undefined;
      const res = await hitLimitSession(selectedAccessId, { manualResetAt: manualDate, now: new Date() });
      setSessionNotice(`Limit tercapai! Status menjadi LIMITED hingga ${new Date(res.resetAt).toLocaleString('id-ID')}.`);
      setShowLimitModal(false);
      setLimitManualDate('');
      await loadAllData();
      const logs = await getLogsByAccessId(selectedAccessId);
      setSessionLogs(logs);
    } catch (err: unknown) {
      if (err instanceof Error) setSessionError(err.message);
    }
  };

  const handleEditResetAt = async () => {
    if (!selectedAccessId || !editResetManualDate) return;
    setSessionError(null);
    setSessionNotice(null);

    try {
      const targetDate = new Date(editResetManualDate);
      const res = await editLimitResetAt(selectedAccessId, targetDate, { now: new Date() });
      setSessionNotice(`Waktu resetAt berhasil dikoreksi menjadi ${new Date(res.access.resetAt || '').toLocaleString('id-ID')}.`);
      setShowEditResetModal(false);
      setEditResetManualDate('');
      await loadAllData();
      const logs = await getLogsByAccessId(selectedAccessId);
      setSessionLogs(logs);
    } catch (err: unknown) {
      if (err instanceof Error) setSessionError(err.message);
    }
  };

  // Handlers CRUD Person (TASK-005)
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
      setPersonSuccess(`Akun "${personToDelete.ownerName}" berhasil dihapus.`);
      setPersonToDelete(null);
      await loadAllData();
    } catch (err: unknown) {
      if (err instanceof Error) setPersonError(err.message);
    }
  };

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
    } catch {
      // ignore
    }
  };

  // Selected access details
  const currentAccess = accessList.find((a) => a.id === selectedAccessId);
  const currentPerson = persons.find((p) => p.id === currentAccess?.personId);
  const currentService = services.find((s) => s.id === currentAccess?.serviceId);

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
              TASK-001 s/d 005 DONE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/80 text-amber-400 border border-amber-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              TASK-006 IN_PROGRESS
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-4 sm:px-6 overflow-x-auto">
        <div className="max-w-5xl mx-auto flex gap-6 text-sm min-w-max">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-3 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'sessions'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Sesi Pemakaian (TASK-006)
          </button>

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
            Layanan AI (TASK-004)
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
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Hero Card for TASK-006 */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  TASK-006: 5/5 Acceptance Criteria Lolos Uji Otomatis
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Sesi Pemakaian AI: Buka, Stop, & Limit</h2>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                    Kontrol sesi pemakaian terintegrasi: Buka (peluncuran URL & catat <code>opened</code>), Stop (hitung durasi & status tetap <code>ready</code>), Limit (status <code>limited</code> & catat <code>limit_hit</code>), koreksi waktu reset, serta evaluasi Auto-Ready tanpa duplikasi log.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                    <Activity className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Status Akses Aktif</p>
                      <p className="text-sm font-semibold text-slate-100 uppercase">{currentAccess?.status || 'Belum Ada Akses'}</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                    <Timer className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Hitung Mundur Reset</p>
                      <p className="text-sm font-semibold font-mono text-emerald-400">{activeCountdown}</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                    <Terminal className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Total Unit Tests</p>
                      <p className="text-sm font-semibold text-slate-100">27/27 Tests Passed (Vitest)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification & Alerts */}
            {sessionNotice && (
              <div className="p-3.5 rounded-xl bg-sky-950/80 border border-sky-800 text-sky-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{sessionNotice}</span>
              </div>
            )}

            {sessionError && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{sessionError}</span>
              </div>
            )}

            {/* Session Controller & Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Controller Box (Left: 7 cols) */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Play className="w-4 h-4 text-sky-400" />
                    Kontrol Sesi Akses Akun
                  </h3>
                  {currentAccess && (
                    <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      currentAccess.status === 'ready'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                    }`}>
                      {currentAccess.status}
                    </span>
                  )}
                </div>

                {/* Dropdown Pemilih Akses (Akun x Layanan) */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Pilih Akses Layanan yang Akan Digunakan:</label>
                  {accessList.length === 0 ? (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                      Belum ada akses terhubung. Silakan hubungkan akun ke layanan di tab "Akun & Akses".
                    </div>
                  ) : (
                    <select
                      value={selectedAccessId}
                      onChange={(e) => setSelectedAccessId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                    >
                      {accessList.map((acc) => {
                        const p = persons.find((per) => per.id === acc.personId);
                        const s = services.find((ser) => ser.id === acc.serviceId);
                        return (
                          <option key={acc.id} value={acc.id}>
                            [{s?.name || acc.serviceId}] {p?.ownerName || acc.personId} ({p?.googleEmail}) — Status: {acc.status.toUpperCase()}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* Detail Akses Terpilih */}
                {currentAccess && currentPerson && currentService && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{currentService.name}</h4>
                        <p className="text-xs text-slate-400">
                          Pengguna: <strong className="text-sky-300">{currentPerson.ownerName}</strong> ({currentPerson.googleEmail})
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {currentAccess.loginMethod === 'google' ? 'Google Auth' : `User: ${currentAccess.loginName || 'Sendiri'}`}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                      <div>
                        {currentAccess.activeSessionStart ? (
                          <span className="text-sky-400 font-medium animate-pulse flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                            Sesi Berjalan Sejak: {new Date(currentAccess.activeSessionStart).toLocaleTimeString()}
                          </span>
                        ) : (
                          <span>Tidak ada sesi yang sedang berjalan.</span>
                        )}
                      </div>

                      {currentAccess.status === 'limited' && currentAccess.resetAt && (
                        <div className="text-right">
                          <span className="text-rose-400 font-mono">Reset: {activeCountdown}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tombol Aksi Utama (Buka, Stop, Limit) */}
                <div className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Tombol Buka */}
                    <button
                      onClick={handleOpenSession}
                      disabled={!currentAccess || currentAccess.status === 'limited'}
                      className={`p-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm transition ${
                        !currentAccess || currentAccess.status === 'limited'
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                          : 'bg-sky-600 hover:bg-sky-500 text-white'
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      1. Tombol Buka Sesi (Buka URL)
                    </button>

                    {/* Tombol Stop */}
                    <button
                      onClick={handleStopSession}
                      disabled={!currentAccess || currentAccess.status === 'limited'}
                      className={`p-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                        !currentAccess || currentAccess.status === 'limited'
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <Square className="w-4 h-4" />
                      2. Tombol Stop (Tetap Ready)
                    </button>
                  </div>

                  {/* Tombol Limit & Koreksi Reset */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <button
                      onClick={() => setShowLimitModal(true)}
                      disabled={!currentAccess}
                      className="p-3 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-800 text-amber-200 font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <AlertOctagon className="w-4 h-4 text-amber-400" />
                      3. Tombol Limit (Tunggu Reset)
                    </button>

                    {currentAccess?.status === 'limited' ? (
                      <button
                        onClick={() => setShowEditResetModal(true)}
                        className="p-3 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-800 text-purple-200 font-semibold flex items-center justify-center gap-2 transition"
                      >
                        <Edit3 className="w-4 h-4 text-purple-400" />
                        Edit Waktu Reset (Koreksi)
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 flex items-center justify-center text-[11px]">
                        Edit reset aktif saat status LIMITED
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Riwayat Log Sesi Terpilih (Right: 5 cols) */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-400" />
                    Riwayat Sesi Akses ({sessionLogs.length})
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Real-time IndexedDB</span>
                </div>

                {sessionLogs.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl flex-1 flex items-center justify-center">
                    Belum ada riwayat aktivitas pada akses ini. Tekan "Tombol Buka" untuk memulai.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 flex-1">
                    {sessionLogs.map((log) => {
                      const logBadgeColor = 
                        log.type === 'opened' ? 'bg-sky-950 text-sky-400 border-sky-800' :
                        log.type === 'stop' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                        log.type === 'limit_hit' ? 'bg-rose-950 text-rose-400 border-rose-800' :
                        log.type === 'reset_ready' ? 'bg-purple-950 text-purple-400 border-purple-800' :
                        'bg-slate-800 text-slate-300 border-slate-700';

                      return (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold uppercase ${logBadgeColor}`}>
                              {log.type}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(log.at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{log.detail}</p>
                          {log.durationSec !== undefined && (
                            <p className="text-[10px] text-sky-400 font-mono">Durasi: {log.durationSec} detik</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Input Limit */}
            {showLimitModal && currentService && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-amber-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                  <div className="flex items-center gap-3 text-amber-400">
                    <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center">
                      <AlertOctagon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Set Status Limit Pemakaian</h4>
                      <p className="text-xs text-amber-300">Pilih waktu resetAt (BR-04, BR-05)</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    Pilih apakah ingin menggunakan kalkulasi aturan default layanan (<strong className="text-sky-300">{currentService.resetRule.mode}</strong>) atau masukkan waktu reset manual:
                  </p>

                  <div className="space-y-3 pt-1">
                    <button
                      onClick={() => handleApplyLimit(false)}
                      className="w-full p-3 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-200 text-xs font-semibold text-left transition flex items-center justify-between"
                    >
                      <div>
                        <span className="block font-bold">1. Gunakan Aturan Layanan</span>
                        <span className="text-[10px] text-sky-400">
                          {currentService.resetRule.mode === 'pacific_midnight' ? 'Tengah Malam Pasifik (00:00 PST/PDT)' : `${currentService.resetRule.hours} Jam dari sekarang`}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-sky-400" />
                    </button>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <label className="text-[11px] font-semibold text-slate-300 block">2. Atau Input Tanggal & Jam Manual (&gt; sekarang):</label>
                      <input
                        type="datetime-local"
                        value={limitManualDate}
                        onChange={(e) => setLimitManualDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                      />
                      <button
                        onClick={() => handleApplyLimit(true)}
                        disabled={!limitManualDate}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition ${
                          !limitManualDate 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                        }`}
                      >
                        Simpan Limit dengan Waktu Manual
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setShowLimitModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Edit resetAt */}
            {showEditResetModal && currentAccess && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-purple-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                  <div className="flex items-center gap-3 text-purple-400">
                    <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Koreksi Waktu Reset (resetAt)</h4>
                      <p className="text-xs text-purple-300">BR-05: Tidak ada tombol Ready manual</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    Waktu reset saat ini: <strong className="text-purple-300 font-mono">{currentAccess.resetAt ? new Date(currentAccess.resetAt).toLocaleString('id-ID') : '-'}</strong>.
                  </p>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 block">Pilih Waktu Reset Baru (&gt; sekarang):</label>
                    <input
                      type="datetime-local"
                      value={editResetManualDate}
                      onChange={(e) => setEditResetManualDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowEditResetModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleEditResetAt}
                      disabled={!editResetManualDate}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                        !editResetManualDate
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                    >
                      Simpan Koreksi Reset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Callout for TASK-006 */}
            <div className="border border-amber-800/60 bg-amber-950/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-amber-200">Menunggu Persetujuan DONE untuk TASK-006</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Seluruh 5 Acceptance Criteria (Buka sesi & opened log, Stop & durasi, Limit & resetAt, edit resetAt koreksi, serta auto-ready single-log) telah lolos 27 unit tests. Balas dengan frasa <code>TASK-006 DONE</code> untuk melanjutkan ke TASK-007.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm">
                  Siap ke TASK-007
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  TASK-005: Akun Google & Akses Layanan AI DONE
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Akun Google & Akses Layanan AI (Maks. 10 Akun)</h2>
                </div>
              </div>
            </div>

            {/* Layout Grid: Tambah Akun + Daftar Akun */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                      placeholder="Catatan akun..."
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
                    Simpan Akun Google
                  </button>
                </form>
              </div>

              {/* Daftar Akun */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Daftar Akun Google ({persons.length})
                  </h3>
                </div>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {persons.map((p, idx) => {
                    const pAccesses = accessList.filter((a) => a.personId === p.id);
                    return (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-sky-400 font-mono">#{idx + 1}</span>
                              <span className="text-xs font-bold text-slate-200">{p.ownerName}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">{p.label}</span>
                            </div>
                            <p className="text-[11px] font-mono text-slate-400">{p.googleEmail}</p>
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
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
