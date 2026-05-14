import * as SQLite from 'expo-sqlite';
import { Treatment, TreatmentPhoto } from '../types';

let _db: SQLite.SQLiteDatabase | null = null;

export function openDb(): SQLite.SQLiteDatabase {
  if (_db) return _db;
  _db = SQLite.openDatabaseSync('haru-record.db');
  _db.execSync('PRAGMA journal_mode = WAL;');

  const SCHEMA_VERSION = 4;
  const { user_version } = _db.getFirstSync<{ user_version: number }>('PRAGMA user_version') ?? { user_version: 0 };

  if (user_version < SCHEMA_VERSION) {
    _db.execSync('DROP TABLE IF EXISTS photos;');
    _db.execSync('DROP TABLE IF EXISTS treatments;');
  }

  _db.execSync(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS treatments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      clinic TEXT DEFAULT '',
      memo TEXT DEFAULT '',
      iconUri TEXT DEFAULT '',
      createdAt TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      treatmentId TEXT NOT NULL,
      uri TEXT NOT NULL,
      label TEXT DEFAULT '',
      date TEXT NOT NULL,
      caption TEXT DEFAULT '',
      createdAt TEXT DEFAULT ''
    );
  `);

  if (user_version < SCHEMA_VERSION) {
    _db.execSync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }

  return _db;
}

export function getHasSeenOnboarding(): boolean {
  const db = openDb();
  const row = db.getFirstSync<{ value: string }>(`SELECT value FROM settings WHERE key='onboarding_seen'`);
  return row?.value === '1';
}

export function getLastAdShownDate(): string | null {
  const db = openDb();
  const row = db.getFirstSync<{ value: string }>(`SELECT value FROM settings WHERE key='last_ad_shown'`);
  return row?.value ?? null;
}

export function setLastAdShownDate(isoDate: string): void {
  const db = openDb();
  db.runSync(`INSERT OR REPLACE INTO settings(key,value) VALUES('last_ad_shown',?)`, [isoDate]);
}

export function markOnboardingSeen(): void {
  const db = openDb();
  db.runSync(`INSERT OR REPLACE INTO settings(key,value) VALUES('onboarding_seen','1')`);
}

export function getAllTreatments(): Treatment[] {
  const db = openDb();
  return db.getAllSync<Treatment>('SELECT * FROM treatments ORDER BY date DESC');
}

export function getTreatmentById(id: string): Treatment | null {
  const db = openDb();
  return db.getFirstSync<Treatment>('SELECT * FROM treatments WHERE id = ?', [id]) ?? null;
}

export function insertTreatment(t: Treatment): void {
  const db = openDb();
  db.runSync(
    'INSERT INTO treatments (id, name, category, date, clinic, memo, iconUri, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [t.id, t.name, t.category, t.date, t.clinic ?? '', t.memo ?? '', t.iconUri ?? '', t.createdAt]
  );
}

export function updateTreatment(t: Treatment): void {
  const db = openDb();
  db.runSync(
    'UPDATE treatments SET name=?, category=?, date=?, clinic=?, memo=? WHERE id=?',
    [t.name, t.category, t.date, t.clinic ?? '', t.memo ?? '', t.id]
  );
}

export function updateTreatmentIcon(id: string, iconUri: string): void {
  const db = openDb();
  db.runSync('UPDATE treatments SET iconUri=? WHERE id=?', [iconUri, id]);
}

export function deleteTreatment(id: string): void {
  const db = openDb();
  db.runSync('DELETE FROM treatments WHERE id=?', [id]);
  db.runSync('DELETE FROM photos WHERE treatmentId=?', [id]);
}

export function getPhotosForTreatment(treatmentId: string): TreatmentPhoto[] {
  const db = openDb();
  return db.getAllSync<TreatmentPhoto>(
    'SELECT * FROM photos WHERE treatmentId = ? ORDER BY date ASC, createdAt ASC',
    [treatmentId]
  );
}

export function insertPhoto(p: TreatmentPhoto): void {
  const db = openDb();
  db.runSync(
    'INSERT INTO photos (id, treatmentId, uri, label, date, caption, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [p.id, p.treatmentId, p.uri, p.label ?? '', p.date, p.caption ?? '', p.createdAt ?? '']
  );
}

export function deletePhoto(id: string): void {
  const db = openDb();
  db.runSync('DELETE FROM photos WHERE id=?', [id]);
}

export function updatePhoto(p: Pick<TreatmentPhoto, 'id' | 'uri' | 'date' | 'label' | 'caption'>): void {
  const db = openDb();
  db.runSync(
    'UPDATE photos SET uri=?, date=?, label=?, caption=? WHERE id=?',
    [p.uri, p.date, p.label ?? '', p.caption ?? '', p.id]
  );
}

export function getAllPhotos(): TreatmentPhoto[] {
  const db = openDb();
  return db.getAllSync<TreatmentPhoto>('SELECT * FROM photos');
}
