/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IDBPDatabase } from 'idb';
import {
  getDatabase,
  getAllPersons,
  getAllServices,
} from './db';
import type {
  Person,
  Service,
  Access,
  UsageLog,
  HandoffNote,
  Settings,
} from './types';
import { computeResetAt } from '../domain/reset-rule';

/**
 * 4 Layanan AI utama yang digunakan tim dalam log kerja:
 * 1. Google AI Studio (authuser=true, Pacific midnight)
 * 2. Anthropic Claude (usesAuthuser=false, 5 jam)
 * 3. OpenAI ChatGPT (usesAuthuser=false, 3 jam)
 * 4. Freebuff (usesAuthuser=false, 3 jam)
 * Plus layanan pendukung: DeepSeek
 */
export const TEAM_INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-aistudio',
    name: 'Google AI Studio',
    urlTemplate: 'https://aistudio.google.com',
    usesAuthuser: true,
    resetRule: { mode: 'pacific_midnight' },
    createdAt: '2026-10-07T00:00:00.000Z',
    updatedAt: '2026-10-30T00:00:00.000Z',
  },
  {
    id: 'srv-claude',
    name: 'Anthropic Claude',
    urlTemplate: 'https://claude.ai',
    usesAuthuser: false,
    resetRule: { mode: 'duration', hours: 5 },
    createdAt: '2026-10-07T00:00:00.000Z',
    updatedAt: '2026-10-30T00:00:00.000Z',
  },
  {
    id: 'srv-chatgpt',
    name: 'OpenAI ChatGPT',
    urlTemplate: 'https://chatgpt.com',
    usesAuthuser: false,
    resetRule: { mode: 'duration', hours: 3 },
    createdAt: '2026-10-07T00:00:00.000Z',
    updatedAt: '2026-10-30T00:00:00.000Z',
  },
  {
    id: 'srv-freebuff',
    name: 'Freebuff',
    urlTemplate: 'https://freebuff.com',
    usesAuthuser: false,
    resetRule: { mode: 'duration', hours: 3 },
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-30T00:00:00.000Z',
  },
  {
    id: 'srv-deepseek',
    name: 'DeepSeek',
    urlTemplate: 'https://chat.deepseek.com',
    usesAuthuser: false,
    resetRule: { mode: 'duration', hours: 3 },
    createdAt: '2026-10-20T00:00:00.000Z',
    updatedAt: '2026-10-30T00:00:00.000Z',
  },
];

/**
 * 9 Akun Google riil tim dari file log AI work (/public/assets/aistudio/log_AI_work_644062a3)
 * Memenuhi batasan BR-07 (maksimum 10 akun).
 */
export const TEAM_INITIAL_PERSONS: Person[] = [
  {
    id: 'person-eko',
    ownerName: 'Eko Keplek',
    googleEmail: 'eko.keplek@gmail.com',
    label: 'Akun Utama',
    note: 'ekokeplek-glitch / PWATRACK (Applet: ba9045fa-f040-41be-b79a-2dde40295d7b)',
    createdAt: '2026-10-07T07:55:15.000Z',
    updatedAt: '2026-10-29T05:35:00.000Z',
  },
  {
    id: 'person-cxperia',
    ownerName: 'Cxperia 575',
    googleEmail: 'cxperia575@gmail.com',
    label: 'OSINT & Apprent Lead',
    note: 'sarungsari / Akun-MAN & APPRENT ok, Apps Script Web App',
    createdAt: '2026-10-07T07:56:24.000Z',
    updatedAt: '2026-10-30T02:20:54.000Z',
  },
  {
    id: 'person-oned',
    ownerName: 'Oned Acer',
    googleEmail: 'oned250acer@gmail.com',
    label: 'Tester / ZLCE Kit',
    note: 'newmigrazy injek ke webrental, zlce kit, test prompt',
    createdAt: '2026-10-07T08:08:38.000Z',
    updatedAt: '2026-10-29T13:27:41.000Z',
  },
  {
    id: 'person-casavanza',
    ownerName: 'Casavanza',
    googleEmail: 'casavanza@gmail.com',
    label: 'Reviewer ZLCE',
    note: 'review zlce, Ryoappcass, Zlce2.3.1 clean',
    createdAt: '2026-10-07T11:44:07.000Z',
    updatedAt: '2026-10-24T00:14:00.000Z',
  },
  {
    id: 'person-kepek',
    ownerName: 'Kepek Malang',
    googleEmail: 'kepekmalang@gmail.com',
    label: 'Migrasi & Template',
    note: 'universal-project-template / sewamotor (Applet: 730cfd28-0321-4d37-874e-b261a8e4b173)',
    createdAt: '2026-10-07T12:45:06.000Z',
    updatedAt: '2026-10-30T08:00:00.000Z',
  },
  {
    id: 'person-layang',
    ownerName: 'Layang Setrum',
    googleEmail: 'layangsetrum@gmail.com',
    label: 'Arsitek ZLCE',
    note: 'layangsetrum-arch / ZLCEv3.2 & migrazy2, Apps Script Web App',
    createdAt: '2026-10-07T16:55:09.000Z',
    updatedAt: '2026-10-30T22:02:43.000Z',
  },
  {
    id: 'person-sulistiyani',
    ownerName: 'Sulistiyani',
    googleEmail: 'sulistiyani.979090@gmail.com',
    label: 'MIGRAZY & Akunman Lead',
    note: 'sultyn979090-wq / akunman (Applet: e17036b7-5d39-4841-94a5-a502115ddeaa)',
    createdAt: '2026-10-11T04:07:00.000Z',
    updatedAt: '2026-10-29T19:40:26.000Z',
  },
  {
    id: 'person-gete60',
    ownerName: 'Gete60 GPS',
    googleEmail: 'gete60gps@gmail.com',
    label: 'Quality Assurance',
    note: 'review zlce3.2.2 lintas AI Studio, Claude, ChatGPT',
    createdAt: '2026-10-11T09:40:54.000Z',
    updatedAt: '2026-10-29T02:42:58.000Z',
  },
  {
    id: 'person-acimau',
    ownerName: 'Acimau',
    googleEmail: 'acimau99@gmail.com',
    label: 'Netizen Dev',
    note: 'acimau99-netizen / SYSTRUKZLCE3.22, RyokouAPP',
    createdAt: '2026-10-15T02:59:00.000Z',
    updatedAt: '2026-10-29T02:42:56.000Z',
  },
];

/**
 * Pemetaan akses akun ke layanan AI sesuai data log.
 * - Sulistiyani di AI Studio status limited (dari entri 10/29 19:40:26).
 * - Sisa akun siap digunakan (ready).
 */
export function generateInitialAccessList(): Access[] {
  // Hitung resetAt untuk Sulistiyani di AI Studio (Pacific midnight berikutnya)
  const sulisResetAt = computeResetAt(
    { mode: 'pacific_midnight' },
    new Date('2026-10-29T19:40:26.000Z')
  ).toISOString();

  return [
    // 1. Google AI Studio (9 akun memiliki akses)
    {
      id: 'acc-eko-aistudio',
      personId: 'person-eko',
      serviceId: 'srv-aistudio',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'eko.keplek@gmail.com',
      createdAt: '2026-10-07T07:55:15.000Z',
      updatedAt: '2026-10-29T05:35:00.000Z',
    },
    {
      id: 'acc-cxperia-aistudio',
      personId: 'person-cxperia',
      serviceId: 'srv-aistudio',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'cxperia575@gmail.com',
      createdAt: '2026-10-07T07:56:24.000Z',
      updatedAt: '2026-10-30T02:20:54.000Z',
    },
    {
      id: 'acc-oned-aistudio',
      personId: 'person-oned',
      serviceId: 'srv-aistudio',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'oned250acer@gmail.com',
      createdAt: '2026-10-07T08:08:38.000Z',
      updatedAt: '2026-10-26T01:48:00.000Z',
    },
    {
      id: 'acc-casavanza-aistudio',
      personId: 'person-casavanza',
      serviceId: 'srv-aistudio',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'casavanza@gmail.com',
      createdAt: '2026-10-07T11:44:07.000Z',
      updatedAt: '2026-10-24T00:14:00.000Z',
    },
    {
      id: 'acc-kepek-aistudio',
      personId: 'person-kepek',
      serviceId: 'srv-aistudio',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'kepekmalang@gmail.com',
      createdAt: '2026-10-07T12:45:06.000Z',
      updatedAt: '2026-10-30T08:00:00.000Z',
    },
    {
      id: 'acc-layang-aistudio',
      personId: 'person-layang',
      serviceId: 'srv-aistudio',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'layangsetrum@gmail.com',
      createdAt: '2026-10-07T16:55:09.000Z',
      updatedAt: '2026-10-30T22:02:43.000Z',
    },
    {
      id: 'acc-sulistiyani-aistudio',
      personId: 'person-sulistiyani',
      serviceId: 'srv-aistudio',
      status: 'limited',
      limitedAt: '2026-10-29T19:40:26.000Z',
      resetAt: sulisResetAt,
      loginMethod: 'google',
      loginName: 'sulistiyani.979090@gmail.com',
      createdAt: '2026-10-11T04:07:00.000Z',
      updatedAt: '2026-10-29T19:40:26.000Z',
    },
    {
      id: 'acc-gete60-aistudio',
      personId: 'person-gete60',
      serviceId: 'srv-aistudio',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'gete60gps@gmail.com',
      createdAt: '2026-10-11T09:40:54.000Z',
      updatedAt: '2026-10-28T02:42:52.000Z',
    },
    {
      id: 'acc-acimau-aistudio',
      personId: 'person-acimau',
      serviceId: 'srv-aistudio',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'acimau99@gmail.com',
      createdAt: '2026-10-15T02:59:00.000Z',
      updatedAt: '2026-10-29T02:42:56.000Z',
    },

    // 2. Anthropic Claude
    {
      id: 'acc-eko-claude',
      personId: 'person-eko',
      serviceId: 'srv-claude',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'eko.keplek@gmail.com',
      createdAt: '2026-10-08T14:19:57.000Z',
      updatedAt: '2026-10-25T08:11:00.000Z',
    },
    {
      id: 'acc-cxperia-claude',
      personId: 'person-cxperia',
      serviceId: 'srv-claude',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'cxperia575@gmail.com',
      createdAt: '2026-10-07T07:56:24.000Z',
      updatedAt: '2026-10-26T21:28:00.000Z',
    },
    {
      id: 'acc-oned-claude',
      personId: 'person-oned',
      serviceId: 'srv-claude',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'oned250acer@gmail.com',
      createdAt: '2026-10-07T08:08:38.000Z',
      updatedAt: '2026-10-29T13:27:41.000Z',
    },
    {
      id: 'acc-casavanza-claude',
      personId: 'person-casavanza',
      serviceId: 'srv-claude',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'casavanza@gmail.com',
      createdAt: '2026-10-07T11:44:07.000Z',
      updatedAt: '2026-10-21T02:02:00.000Z',
    },
    {
      id: 'acc-kepek-claude',
      personId: 'person-kepek',
      serviceId: 'srv-claude',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'kepekmalang@gmail.com',
      createdAt: '2026-10-07T16:24:57.000Z',
      updatedAt: '2026-10-25T06:10:00.000Z',
    },
    {
      id: 'acc-layang-claude',
      personId: 'person-layang',
      serviceId: 'srv-claude',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'layangsetrum@gmail.com',
      createdAt: '2026-10-07T16:55:09.000Z',
      updatedAt: '2026-10-27T11:02:00.000Z',
    },
    {
      id: 'acc-sulistiyani-claude',
      personId: 'person-sulistiyani',
      serviceId: 'srv-claude',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'sulistiyani.979090@gmail.com',
      createdAt: '2026-10-29T19:25:41.000Z',
      updatedAt: '2026-10-29T19:25:41.000Z',
    },
    {
      id: 'acc-gete60-claude',
      personId: 'person-gete60',
      serviceId: 'srv-claude',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'gete60gps@gmail.com',
      createdAt: '2026-10-29T02:42:54.000Z',
      updatedAt: '2026-10-29T02:42:54.000Z',
    },
    {
      id: 'acc-acimau-claude',
      personId: 'person-acimau',
      serviceId: 'srv-claude',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'acimau99@gmail.com',
      createdAt: '2026-10-22T02:07:00.000Z',
      updatedAt: '2026-10-27T00:00:00.000Z',
    },

    // 3. OpenAI ChatGPT
    {
      id: 'acc-gete60-chatgpt',
      personId: 'person-gete60',
      serviceId: 'srv-chatgpt',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'gete60gps@gmail.com',
      createdAt: '2026-10-29T02:42:58.000Z',
      updatedAt: '2026-10-29T02:42:58.000Z',
    },
    {
      id: 'acc-sulistiyani-chatgpt',
      personId: 'person-sulistiyani',
      serviceId: 'srv-chatgpt',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'sulistiyani.979090@gmail.com',
      createdAt: '2026-10-29T22:02:41.000Z',
      updatedAt: '2026-10-29T22:02:41.000Z',
    },
    {
      id: 'acc-eko-chatgpt',
      personId: 'person-eko',
      serviceId: 'srv-chatgpt',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'eko.keplek@gmail.com',
      createdAt: '2026-10-28T00:00:00.000Z',
      updatedAt: '2026-10-28T00:00:00.000Z',
    },

    // 4. Freebuff
    {
      id: 'acc-kepek-freebuff',
      personId: 'person-kepek',
      serviceId: 'srv-freebuff',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'kepekmalang@gmail.com',
      createdAt: '2026-10-15T12:00:00.000Z',
      updatedAt: '2026-10-15T12:00:00.000Z',
    },
    {
      id: 'acc-oned-freebuff',
      personId: 'person-oned',
      serviceId: 'srv-freebuff',
      status: 'ready',
      loginMethod: 'google',
      loginName: 'oned250acer@gmail.com',
      createdAt: '2026-10-15T12:00:00.000Z',
      updatedAt: '2026-10-15T12:00:00.000Z',
    },
  ];
}

/**
 * Catatan Lanjutan Tim (Handoff Notes) dari log riil.
 */
export const TEAM_INITIAL_HANDOFF_NOTES: HandoffNote[] = [
  // AI Studio
  {
    id: 'note-aistudio-cxperia',
    serviceId: 'srv-aistudio',
    accessId: 'acc-cxperia-aistudio',
    authorName: 'Cxperia 575',
    text: 'sarungsari/Akun-MAN - Web App Apps Script aktif di https://script.google.com/macros/s/AKfycbxe9B7w3AQ7WMOEYeQg_31EiCuqNf5wpG1cF3xPEdLQCG6DLgrkfNs2lZFY4Q59X6BBNg/exec',
    createdAt: '2026-10-30T02:20:54.000Z',
  },
  {
    id: 'note-aistudio-layang',
    serviceId: 'srv-aistudio',
    accessId: 'acc-layang-aistudio',
    authorName: 'Layang Setrum',
    text: 'Web App Apps Script migrazy v2 terintegrasi: https://script.google.com/macros/s/AKfycbwUWGyDvSfzsF_8WsFmR2j-8O13ObHeRy5Z0mUffS-RsHEtoI7D-JVoliptG7q-w_31/exec',
    createdAt: '2026-10-30T22:02:43.000Z',
  },
  {
    id: 'note-aistudio-sulis',
    serviceId: 'srv-aistudio',
    accessId: 'acc-sulistiyani-aistudio',
    authorName: 'Sulistiyani',
    text: 'sultyn979090-wq/akunman - Applet: https://ai.studio/apps/e17036b7-5d39-4841-94a5-a502115ddeaa (Limit tercatat)',
    createdAt: '2026-10-29T19:40:26.000Z',
  },
  {
    id: 'note-aistudio-eko',
    serviceId: 'srv-aistudio',
    accessId: 'acc-eko-aistudio',
    authorName: 'Eko Keplek',
    text: 'akun manager, repo ekokeplek-glitch/PWATRACK - Applet: https://ai.studio/apps/ba9045fa-f040-41be-b79a-2dde40295d7b',
    createdAt: '2026-10-29T05:35:00.000Z',
  },
  {
    id: 'note-aistudio-kepek',
    serviceId: 'srv-aistudio',
    accessId: 'acc-kepek-aistudio',
    authorName: 'Kepek Malang',
    text: 'universal-project-template & sewamotor - Applet: https://ai.studio/apps/730cfd28-0321-4d37-874e-b261a8e4b173',
    createdAt: '2026-10-30T08:00:00.000Z',
  },
  {
    id: 'note-aistudio-acimau',
    serviceId: 'srv-aistudio',
    accessId: 'acc-acimau-aistudio',
    authorName: 'Acimau',
    text: 'acimau99-netizen/SYSTRUKZLCE3.22 - struktur modular siap digunakan tim',
    createdAt: '2026-10-29T02:42:56.000Z',
  },

  // Claude
  {
    id: 'note-claude-sulis',
    serviceId: 'srv-claude',
    accessId: 'acc-sulistiyani-claude',
    authorName: 'Sulistiyani',
    text: 'Review dokumen arsitektur dan pembaruan README tim',
    createdAt: '2026-10-29T19:25:41.000Z',
  },
  {
    id: 'note-claude-gete60',
    serviceId: 'srv-claude',
    accessId: 'acc-gete60-claude',
    authorName: 'Gete60 GPS',
    text: 'Review ZLCE 3.2.2 - checklist verifikasi dan validasi struktur token',
    createdAt: '2026-10-29T02:42:54.000Z',
  },
  {
    id: 'note-claude-layang',
    serviceId: 'srv-claude',
    accessId: 'acc-layang-claude',
    authorName: 'Layang Setrum',
    text: 'Selesai restrukturisasi modul ZLCE 3.2',
    createdAt: '2026-10-27T11:02:00.000Z',
  },
  {
    id: 'note-claude-oned',
    serviceId: 'srv-claude',
    accessId: 'acc-oned-claude',
    authorName: 'Oned Acer',
    text: 'Selesai pertautan update repo fork sarungsari/APPRENT',
    createdAt: '2026-10-27T11:02:00.000Z',
  },

  // ChatGPT
  {
    id: 'note-chatgpt-sulis',
    serviceId: 'srv-chatgpt',
    accessId: 'acc-sulistiyani-chatgpt',
    authorName: 'Sulistiyani',
    text: 'Review dan README sinkronisasi tugas multi-model',
    createdAt: '2026-10-29T22:02:41.000Z',
  },
  {
    id: 'note-chatgpt-gete60',
    serviceId: 'srv-chatgpt',
    accessId: 'acc-gete60-chatgpt',
    authorName: 'Gete60 GPS',
    text: 'Review integritas ZLCE 3.2.2 pada skema relasional',
    createdAt: '2026-10-29T02:42:58.000Z',
  },

  // Freebuff
  {
    id: 'note-freebuff-kepek',
    serviceId: 'srv-freebuff',
    accessId: 'acc-kepek-freebuff',
    authorName: 'Kepek Malang',
    text: 'Test prompt 1 skrip - evaluasi limitasi token',
    createdAt: '2026-10-15T12:00:00.000Z',
  },
];

/**
 * Entri Riwayat Log Pemakaian (UsageLogs) yang diambil langsung dari baris CSV penting.
 */
export const TEAM_INITIAL_USAGE_LOGS: UsageLog[] = [
  // 10/29 - 10/30 (Sesi Terkini)
  {
    id: 'log-1030-layang-aistudio',
    accessId: 'acc-layang-aistudio',
    type: 'opened',
    at: '2026-10-30T22:02:43.000Z',
    detail: 'Apps Script: https://script.google.com/macros/s/AKfycbwUWGyDvSfzsF_8WsFmR2j-8O13ObHeRy5Z0mUffS-RsHEtoI7D-JVoliptG7q-w_31/exec',
  },
  {
    id: 'log-1030-kepek-aistudio',
    accessId: 'acc-kepek-aistudio',
    type: 'opened',
    at: '2026-10-30T08:00:00.000Z',
    detail: 'Applet: https://ai.studio/apps/730cfd28-0321-4d37-874e-b261a8e4b173',
  },
  {
    id: 'log-1030-cxperia-aistudio',
    accessId: 'acc-cxperia-aistudio',
    type: 'opened',
    at: '2026-10-30T02:20:54.000Z',
    detail: 'sarungsari/Akun-MAN - Web App: https://script.google.com/macros/s/AKfycbxe9B7w3AQ7WMOEYeQg_31EiCuqNf5wpG1cF3xPEdLQCG6DLgrkfNs2lZFY4Q59X6BBNg/exec',
  },
  {
    id: 'log-1029-sulis-chatgpt',
    accessId: 'acc-sulistiyani-chatgpt',
    type: 'opened',
    at: '2026-10-29T22:02:41.000Z',
    detail: 'review, readme',
  },
  {
    id: 'log-1029-sulis-aistudio',
    accessId: 'acc-sulistiyani-aistudio',
    type: 'limit_hit',
    at: '2026-10-29T19:40:26.000Z',
    detail: 'sultyn979090-wq/akunman, limit, https://ai.studio/apps/e17036b7-5d39-4841-94a5-a502115ddeaa',
  },
  {
    id: 'log-1029-sulis-claude',
    accessId: 'acc-sulistiyani-claude',
    type: 'opened',
    at: '2026-10-29T19:25:41.000Z',
    detail: 'review',
  },
  {
    id: 'log-1029-oned-claude',
    accessId: 'acc-oned-claude',
    type: 'opened',
    at: '2026-10-29T13:27:41.000Z',
    detail: 'lanjut test prompt',
  },
  {
    id: 'log-1029-eko-aistudio',
    accessId: 'acc-eko-aistudio',
    type: 'opened',
    at: '2026-10-29T05:35:00.000Z',
    detail: 'akun manager, ekokeplek-glitch/PWATRACK, https://ai.studio/apps/ba9045fa-f040-41be-b79a-2dde40295d7b',
  },
  {
    id: 'log-1029-gete60-chatgpt',
    accessId: 'acc-gete60-chatgpt',
    type: 'opened',
    at: '2026-10-29T02:42:58.000Z',
    detail: 'review zlce3.2.2',
  },
  {
    id: 'log-1029-acimau-aistudio',
    accessId: 'acc-acimau-aistudio',
    type: 'opened',
    at: '2026-10-29T02:42:56.000Z',
    detail: 'acimau99-netizen/SYSTRUKZLCE3.22',
  },
  {
    id: 'log-1029-gete60-claude',
    accessId: 'acc-gete60-claude',
    type: 'opened',
    at: '2026-10-29T02:42:54.000Z',
    detail: 'review zlce3.2.2',
  },
  {
    id: 'log-1028-gete60-aistudio',
    accessId: 'acc-gete60-aistudio',
    type: 'opened',
    at: '2026-10-28T02:42:52.000Z',
    detail: 'evaluasi kuota QA',
  },

  // 10/26 - 10/27 (Sesi APPRENT & Sinkronisasi)
  {
    id: 'log-1027-layang-claude',
    accessId: 'acc-layang-claude',
    type: 'opened',
    at: '2026-10-27T11:02:00.000Z',
    detail: 'finis restruk',
  },
  {
    id: 'log-1027-oned-claude',
    accessId: 'acc-oned-claude',
    type: 'opened',
    at: '2026-10-27T11:02:00.000Z',
    detail: 'finish link update repo APPRENT',
  },
  {
    id: 'log-1027-cxperia-aistudio',
    accessId: 'acc-cxperia-aistudio',
    type: 'opened',
    at: '2026-10-27T12:00:00.000Z',
    detail: 'link di sarungsari/APPRENT',
  },
  {
    id: 'log-1026-oned-claude',
    accessId: 'acc-oned-claude',
    type: 'limit_hit',
    at: '2026-10-26T20:29:00.000Z',
    detail: 'limit up 00.00 plankonek',
  },
  {
    id: 'log-1026-cxperia-claude',
    accessId: 'acc-cxperia-claude',
    type: 'limit_hit',
    at: '2026-10-26T21:28:00.000Z',
    detail: 'limit',
  },
  {
    id: 'log-1026-layang-claude',
    accessId: 'acc-layang-claude',
    type: 'limit_hit',
    at: '2026-10-26T23:15:00.000Z',
    detail: 'reset 02.30, restruk bl finish',
  },
  {
    id: 'log-1026-sulis-aistudio',
    accessId: 'acc-sulistiyani-aistudio',
    type: 'limit_hit',
    at: '2026-10-26T23:18:00.000Z',
    detail: 'limit, restrukZLC3.3, sultyn979090-wq/APPRENTV1.Z4',
  },
  {
    id: 'log-1026-cxperia-aistudio',
    accessId: 'acc-cxperia-aistudio',
    type: 'opened',
    at: '2026-10-26T14:00:00.000Z',
    detail: 'done allreview, sarungsari/APPRENT ok',
  },
  {
    id: 'log-1026-oned-aistudio',
    accessId: 'acc-oned-aistudio',
    type: 'opened',
    at: '2026-10-26T01:48:00.000Z',
    detail: 'repo fork sarungsari/APPRENT',
  },

  // 10/24 - 10/25 (Sesi Ryoappcass & APPRENT awal)
  {
    id: 'log-1025-cxperia-aistudio',
    accessId: 'acc-cxperia-aistudio',
    type: 'opened',
    at: '2026-10-25T18:10:00.000Z',
    detail: 'sarungsari/APPRENT ok',
  },
  {
    id: 'log-1025-kepek-claude',
    accessId: 'acc-kepek-claude',
    type: 'opened',
    at: '2026-10-25T06:10:00.000Z',
    detail: 'review',
  },
  {
    id: 'log-1025-eko-aistudio',
    accessId: 'acc-eko-aistudio',
    type: 'limit_hit',
    at: '2026-10-25T11:24:00.000Z',
    detail: 'limit, ekokeplek-glitch/APPRENTkpl',
  },
  {
    id: 'log-1025-cxperia-aistudio-fork',
    accessId: 'acc-cxperia-aistudio',
    type: 'opened',
    at: '2026-10-25T10:35:00.000Z',
    detail: 'fork layangsetrum-arch/Ryoappcass',
  },
  {
    id: 'log-1025-layang-aistudio',
    accessId: 'acc-layang-aistudio',
    type: 'opened',
    at: '2026-10-25T00:14:00.000Z',
    detail: 'layangsetrum-arch/Ryoappcass',
  },
  {
    id: 'log-1024-casavanza-aistudio',
    accessId: 'acc-casavanza-aistudio',
    type: 'opened',
    at: '2026-10-24T00:14:00.000Z',
    detail: 'layangsetrum-arch/Ryoappcass',
  },
  {
    id: 'log-1024-kepek-aistudio',
    accessId: 'acc-kepek-aistudio',
    type: 'opened',
    at: '2026-10-24T17:48:00.000Z',
    detail: 'acimau99-netizen/RyokouAPP',
  },

  // 10/15 - 10/21 (Sesi ZLCE 3.2.2 & Freebuff)
  {
    id: 'log-1021-cxperia-aistudio',
    accessId: 'acc-cxperia-aistudio',
    type: 'opened',
    at: '2026-10-21T05:28:00.000Z',
    detail: 'sarungsari/ZLCEv3.2.2',
  },
  {
    id: 'log-1021-layang-aistudio',
    accessId: 'acc-layang-aistudio',
    type: 'opened',
    at: '2026-10-21T04:44:00.000Z',
    detail: 'update zlce dari review',
  },
  {
    id: 'log-1015-kepek-freebuff',
    accessId: 'acc-kepek-freebuff',
    type: 'limit_hit',
    at: '2026-10-15T12:00:00.000Z',
    detail: 'limit, ada 2 error ketemu saat test prompt',
  },
  {
    id: 'log-1015-oned-aistudio',
    accessId: 'acc-oned-aistudio',
    type: 'opened',
    at: '2026-10-15T08:32:00.000Z',
    detail: 'test prompt, test ok, zlce kit',
  },

  // 10/7 (Sesi Awal Proyek)
  {
    id: 'log-1007-eko-aistudio',
    accessId: 'acc-eko-aistudio',
    type: 'limit_hit',
    at: '2026-10-07T14:55:15.000Z',
    detail: 'task-19, task22, Limit',
  },
  {
    id: 'log-1007-kepek-aistudio',
    accessId: 'acc-kepek-aistudio',
    type: 'opened',
    at: '2026-10-07T19:45:06.000Z',
    detail: 'migrasi dari 22, task 26, https://github.com/ekokeplek-glitch/sewamotor.git',
  },
];

/**
 * Pengaturan awal terintegrasi dari log baris 98-99.
 */
export const TEAM_INITIAL_SETTINGS: Settings = {
  id: 'default',
  resetTimezone: 'America/Los_Angeles',
  sheetEndpoint: 'https://script.google.com/macros/s/AKfycbxe9B7w3AQ7WMOEYeQg_31EiCuqNf5wpG1cF3xPEdLQCG6DLgrkfNs2lZFY4Q59X6BBNg/exec',
  sheetSecret: '',
  maxPersons: 10,
  updatedAt: '2026-10-30T02:20:54.000Z',
};

/**
 * Mengecek apakah IndexedDB masih kosong (belum ada persons atau services)
 */
export async function isDatabaseEmpty(dbInstance?: IDBPDatabase): Promise<boolean> {
  const [persons, services] = await Promise.all([
    getAllPersons(dbInstance),
    getAllServices(dbInstance),
  ]);
  return persons.length === 0 || services.length === 0;
}

/**
 * Menghapus seluruh data di IndexedDB (digunakan untuk Reset ke Data Awal Log Tim)
 */
export async function clearAllDatabaseData(dbInstance?: IDBPDatabase): Promise<void> {
  const db = dbInstance || (await getDatabase());
  const tx = db.transaction(
    ['services', 'persons', 'access', 'logs', 'handoffNotes', 'settings'],
    'readwrite'
  );
  await Promise.all([
    tx.objectStore('services').clear(),
    tx.objectStore('persons').clear(),
    tx.objectStore('access').clear(),
    tx.objectStore('logs').clear(),
    tx.objectStore('handoffNotes').clear(),
    tx.objectStore('settings').clear(),
  ]);
  await tx.done;
}

/**
 * Inisialisasi Seeding Data Tim Riil ke IndexedDB
 */
export async function seedTeamInitialData(
  forceReset = false,
  dbInstance?: IDBPDatabase
): Promise<{
  personsCount: number;
  servicesCount: number;
  accessCount: number;
  logsCount: number;
  notesCount: number;
}> {
  const db = dbInstance || (await getDatabase());

  if (forceReset) {
    await clearAllDatabaseData(db);
  } else {
    const empty = await isDatabaseEmpty(db);
    if (!empty) {
      // Database sudah berisi data dan tidak dipaksa reset
      const [persons, services, access, logs, notes] = await Promise.all([
        db.getAll('persons'),
        db.getAll('services'),
        db.getAll('access'),
        db.getAll('logs'),
        db.getAll('handoffNotes'),
      ]);
      return {
        personsCount: persons.length,
        servicesCount: services.length,
        accessCount: access.length,
        logsCount: logs.length,
        notesCount: notes.length,
      };
    }
  }

  // Lakukan penulisan data awal secara atomik dalam satu transaksi
  const tx = db.transaction(
    ['services', 'persons', 'access', 'logs', 'handoffNotes', 'settings'],
    'readwrite'
  );

  const serviceStore = tx.objectStore('services');
  for (const srv of TEAM_INITIAL_SERVICES) {
    await serviceStore.put(srv);
  }

  const personStore = tx.objectStore('persons');
  for (const person of TEAM_INITIAL_PERSONS) {
    await personStore.put(person);
  }

  const accessStore = tx.objectStore('access');
  const accessList = generateInitialAccessList();
  for (const acc of accessList) {
    await accessStore.put(acc);
  }

  const logStore = tx.objectStore('logs');
  for (const log of TEAM_INITIAL_USAGE_LOGS) {
    await logStore.put(log);
  }

  const handoffStore = tx.objectStore('handoffNotes');
  for (const note of TEAM_INITIAL_HANDOFF_NOTES) {
    await handoffStore.put(note);
  }

  const settingsStore = tx.objectStore('settings');
  await settingsStore.put(TEAM_INITIAL_SETTINGS);

  await tx.done;

  return {
    personsCount: TEAM_INITIAL_PERSONS.length,
    servicesCount: TEAM_INITIAL_SERVICES.length,
    accessCount: accessList.length,
    logsCount: TEAM_INITIAL_USAGE_LOGS.length,
    notesCount: TEAM_INITIAL_HANDOFF_NOTES.length,
  };
}
