import { Candidate, User, Settings, AuditLog } from "../types";
import { DEFAULT_SETTINGS } from "../constants";

const KEYS = {
  RECORDS: 'gce_records_v2',
  USERS: 'gce_users_v2',
  SETTINGS: 'gce_settings_v2',
  LOGS: 'gce_logs_v2',
  SESSION: 'gce_session_v2'
};

// Initialize DB
export const initDB = () => {
  if (!localStorage.getItem(KEYS.SETTINGS)) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem(KEYS.USERS)) {
    const defaultUsers: User[] = [
      {
        username: 'admin',
        // @ts-ignore
        password: window.CryptoJS?.MD5('admin123').toString() || '0192023a7bbd73250516f069df18b500', 
        name: 'Administrator',
        role: 'admin',
        status: 'active',
        plainPassword: 'admin', 
        permissions: { view: true, create: true, edit: true, delete: true, export: true, settings: true, sms: true }
      }
    ];
    localStorage.setItem(KEYS.USERS, JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem(KEYS.RECORDS)) {
    localStorage.setItem(KEYS.RECORDS, JSON.stringify([]));
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    alert("Storage Quota Exceeded! \n\nThe system cannot save more data. Please export your data and clear some records, or reduce file attachment sizes.");
    console.error("LocalStorage full:", e);
  }
};

export const getRecords = (): Candidate[] => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.RECORDS) || '[]');
  } catch(e) { return []; }
};

export const saveRecord = (record: Candidate): void => {
  const records = getRecords();
  const index = records.findIndex(r => r.id === record.id);
  if (index >= 0) {
    records[index] = record;
    logAction(`Updated record for ${record.surname} ${record.otherNames}`);
  } else {
    records.push(record);
    logAction(`Created record for ${record.surname} ${record.otherNames}`);
  }
  safeSetItem(KEYS.RECORDS, JSON.stringify(records));
};

export const deleteRecord = (id: number): void => {
  const records = getRecords();
  const record = records.find(r => r.id === id);
  const newRecords = records.filter(r => r.id !== id);
  safeSetItem(KEYS.RECORDS, JSON.stringify(newRecords));
  if (record) logAction(`Deleted record for ${record.surname}`);
};

export const getSettings = (): Settings => {
  return JSON.parse(localStorage.getItem(KEYS.SETTINGS) || JSON.stringify(DEFAULT_SETTINGS));
};

export const saveSettings = (settings: Settings): void => {
  safeSetItem(KEYS.SETTINGS, JSON.stringify(settings));
  logAction('System settings updated');
};

export const getAuditLogs = (): AuditLog[] => {
  return JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
};

export const clearAuditLogs = (): void => {
  safeSetItem(KEYS.LOGS, '[]');
};

export const logAction = (action: string) => {
  const logs = getAuditLogs();
  logs.unshift({ timestamp: Date.now(), action, user: getCurrentUser()?.username || 'system' });
  if (logs.length > 500) logs.pop();
  try {
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  } catch(e) {
    // Silently fail logging if full to prioritize data
  }
};

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(KEYS.SESSION);
  if (!session) return null;
  const { user, expiry } = JSON.parse(session);
  if (Date.now() > expiry) {
    logout();
    return null;
  }
  localStorage.setItem(KEYS.SESSION, JSON.stringify({ user, expiry: Date.now() + 30 * 60 * 1000 }));
  return user;
};

export const login = (username: string, passwordHash: string): User | null | 'pending' => {
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const user = users.find((u: any) => u.username === username && u.password === passwordHash);
  
  if (user) {
    if (user.status === 'pending') return 'pending';
    localStorage.setItem(KEYS.SESSION, JSON.stringify({ user, expiry: Date.now() + 30 * 60 * 1000 }));
    logAction('User Login');
    return user;
  }
  return null;
};

export const logout = () => {
  const user = getCurrentUser();
  if (user) logAction('User Logout');
  localStorage.removeItem(KEYS.SESSION);
};

export const getUsers = (): User[] => {
  return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
};

export const signupUser = (user: Partial<User>, passwordPlain: string): boolean => {
  const users = getUsers();
  if (users.find(u => u.username === user.username)) {
    return false; // Username exists
  }
  const newUser: any = {
    ...user,
    role: 'user',
    status: 'pending', 
    plainPassword: passwordPlain, 
    // @ts-ignore
    password: window.CryptoJS?.MD5(passwordPlain).toString(),
    permissions: { view: true, create: true, edit: false, delete: false, export: false, settings: true, sms: false }
  };
  users.push(newUser);
  safeSetItem(KEYS.USERS, JSON.stringify(users));
  return true;
};

export const approveUser = (username: string): void => {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    user.status = 'active';
    safeSetItem(KEYS.USERS, JSON.stringify(users));
    logAction(`Approved user: ${username}`);
  }
};

export const deleteUser = (username: string): void => {
  let users = getUsers();
  users = users.filter(u => u.username !== username);
  safeSetItem(KEYS.USERS, JSON.stringify(users));
  logAction(`Deleted user: ${username}`);
};

export const updateUserPassword = (username: string, newPassHash: string, newPassPlain: string): boolean => {
  const usersStr = localStorage.getItem(KEYS.USERS);
  if (!usersStr) return false;
  const users = JSON.parse(usersStr);
  const userIndex = users.findIndex((u: any) => u.username === username);
  if (userIndex === -1) return false;
  users[userIndex].password = newPassHash;
  users[userIndex].plainPassword = newPassPlain; 
  safeSetItem(KEYS.USERS, JSON.stringify(users));
  logAction(`Password updated for user: ${username}`);
  return true;
};