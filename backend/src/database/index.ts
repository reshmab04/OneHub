import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export interface DbSchema {
  users: UserRecord[];
  securityLog: SecurityLogRecord[];
}

export interface UserRecord {
  id: number;
  email: string;
  full_name: string;
  password_hash: string;
  role: 'admin' | 'user';
  failed_login_attempts: number;
  locked_until: string | null;
  reset_token: string | null;
  reset_token_expires: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityLogRecord {
  id: number;
  event: string;
  email: string | null;
  ip_address: string;
  user_agent: string;
  details: string | null;
  created_at: string;
}

const DB_PATH = path.join(DATA_DIR, 'onehub.json');

function defaultDb(): DbSchema {
  return { users: [], securityLog: [] };
}

function readDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_PATH)) return defaultDb();
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as DbSchema;
  } catch {
    return defaultDb();
  }
}

function writeDb(data: DbSchema): void {
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, DB_PATH);
}

class Database {
  private data: DbSchema;
  private nextUserId: number;
  private nextLogId: number;

  constructor() {
    this.data = readDb();
    this.nextUserId = this.data.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    this.nextLogId = this.data.securityLog.reduce((max, l) => Math.max(max, l.id), 0) + 1;
  }

  private save(): void {
    writeDb(this.data);
  }

  getUsers(): UserRecord[] {
    return this.data.users;
  }

  findUserByEmail(email: string): UserRecord | undefined {
    const lower = email.toLowerCase().trim();
    return this.data.users.find((u) => u.email === lower);
  }

  findUserById(id: number): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  findUserByResetToken(token: string): UserRecord | undefined {
    return this.data.users.find(
      (u) => u.reset_token === token && u.reset_token_expires && new Date(u.reset_token_expires) > new Date(),
    );
  }

  createUser(record: Omit<UserRecord, 'id'>): UserRecord {
    const user: UserRecord = { id: this.nextUserId++, ...record };
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: number, updates: Partial<UserRecord>): void {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
    }
  }

  countAdmins(): number {
    return this.data.users.filter((u) => u.role === 'admin').length;
  }

  addSecurityLog(record: Omit<SecurityLogRecord, 'id'>): void {
    this.data.securityLog.push({ id: this.nextLogId++, ...record });
    // Keep only the latest 10,000 entries
    if (this.data.securityLog.length > 10000) {
      this.data.securityLog = this.data.securityLog.slice(-10000);
    }
    this.save();
  }
}

const db = new Database();
export default db;
