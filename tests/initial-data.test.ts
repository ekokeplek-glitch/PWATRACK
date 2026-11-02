/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { getDatabase } from '../src/storage/db';
import {
  seedTeamInitialData,
  isDatabaseEmpty,
  clearAllDatabaseData,
  TEAM_INITIAL_PERSONS,
  TEAM_INITIAL_SERVICES,
  generateInitialAccessList,
  TEAM_INITIAL_HANDOFF_NOTES,
  TEAM_INITIAL_USAGE_LOGS,
} from '../src/storage/initial-data';

describe('Seed Data Tim Riil (log AI work CSV)', () => {
  const TEST_DB_NAME = 'test_team_seed_db';

  beforeEach(async () => {
    const db = await getDatabase(TEST_DB_NAME);
    await clearAllDatabaseData(db);
  });

  it('memverifikasi data awal akun memenuhi batasan BR-07 (maksimum 10 akun)', () => {
    expect(TEAM_INITIAL_PERSONS.length).toBeLessThanOrEqual(10);
    expect(TEAM_INITIAL_PERSONS.length).toBe(9);

    const emails = TEAM_INITIAL_PERSONS.map((p) => p.googleEmail.toLowerCase());
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(TEAM_INITIAL_PERSONS.length);

    const names = TEAM_INITIAL_PERSONS.map((p) => p.ownerName.toLowerCase());
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(TEAM_INITIAL_PERSONS.length);
  });

  it('memverifikasi layanan AI riil mencakup Google AI Studio, Claude, ChatGPT, dan Freebuff', () => {
    const serviceIds = TEAM_INITIAL_SERVICES.map((s) => s.id);
    expect(serviceIds).toContain('srv-aistudio');
    expect(serviceIds).toContain('srv-claude');
    expect(serviceIds).toContain('srv-chatgpt');
    expect(serviceIds).toContain('srv-freebuff');

    const aiStudio = TEAM_INITIAL_SERVICES.find((s) => s.id === 'srv-aistudio');
    expect(aiStudio?.usesAuthuser).toBe(true);
    expect(aiStudio?.resetRule.mode).toBe('pacific_midnight');

    const claude = TEAM_INITIAL_SERVICES.find((s) => s.id === 'srv-claude');
    expect(claude?.usesAuthuser).toBe(false);
    expect(claude?.resetRule.mode).toBe('duration');
  });

  it('berhasil melakukan seeding data tim ke database kosong', async () => {
    const db = await getDatabase(TEST_DB_NAME);
    const initiallyEmpty = await isDatabaseEmpty(db);
    expect(initiallyEmpty).toBe(true);

    const res = await seedTeamInitialData(false, db);
    expect(res.personsCount).toBe(9);
    expect(res.servicesCount).toBe(5);
    expect(res.accessCount).toBeGreaterThanOrEqual(20);
    expect(res.logsCount).toBeGreaterThanOrEqual(25);
    expect(res.notesCount).toBeGreaterThanOrEqual(10);

    const afterEmpty = await isDatabaseEmpty(db);
    expect(afterEmpty).toBe(false);

    // Cek akun di store
    const persons = await db.getAll('persons');
    expect(persons.length).toBe(9);
    expect(persons.find((p) => p.googleEmail === 'eko.keplek@gmail.com')).toBeDefined();
    expect(persons.find((p) => p.googleEmail === 'sulistiyani.979090@gmail.com')).toBeDefined();

    // Cek status limited untuk Sulistiyani di AI Studio
    const sulisAccess = await db.get('access', 'acc-sulistiyani-aistudio');
    expect(sulisAccess).toBeDefined();
    expect(sulisAccess.status).toBe('limited');
    expect(sulisAccess.resetAt).toBeDefined();

    // Cek settings terisi sheetEndpoint
    const settings = await db.get('settings', 'default');
    expect(settings).toBeDefined();
    expect(settings.sheetEndpoint).toContain('script.google.com/macros/s/AKfycbxe9B7w3AQ7WMOEYeQg_31EiCuqNf5wpG1cF3xPEdLQCG6DLgrkfNs2lZFY4Q59X6BBNg/exec');
  });

  it('dapat melakukan reset data tim dengan forceReset = true', async () => {
    const db = await getDatabase(TEST_DB_NAME);
    await seedTeamInitialData(false, db);

    // Tambah satu catatan sementara
    await db.put('handoffNotes', {
      id: 'temp-note',
      serviceId: 'srv-aistudio',
      text: 'Catatan sementara',
      createdAt: new Date().toISOString(),
    });

    const notesBefore = await db.getAll('handoffNotes');
    expect(notesBefore.some((n) => n.id === 'temp-note')).toBe(true);

    // Reset paksa
    await seedTeamInitialData(true, db);

    const notesAfter = await db.getAll('handoffNotes');
    expect(notesAfter.some((n) => n.id === 'temp-note')).toBe(false);
    expect(notesAfter.length).toBe(TEAM_INITIAL_HANDOFF_NOTES.length);
  });
});
