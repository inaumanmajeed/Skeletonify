import type { Descriptor } from "./types";

const SCHEMA_VERSION = 1;
const STORAGE_PREFIX = "skeletonify:v1:";
const MAX_ENTRIES = 50;
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface CachedDescriptor {
  id: string;
  hash: string;
  descriptor: Descriptor;
  timestamp: number;
}

interface StoredEntry extends CachedDescriptor {
  v: number;
}

// In-memory LRU (Map iteration order == insertion order).
const memory = new Map<string, CachedDescriptor>();

const hasStorage = (): boolean => {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
};

const touch = (id: string, entry: CachedDescriptor): void => {
  memory.delete(id);
  memory.set(id, entry);
};

const evict = (): void => {
  while (memory.size > MAX_ENTRIES) {
    const oldestKey = memory.keys().next().value;
    if (oldestKey === undefined) break;
    memory.delete(oldestKey);
    if (hasStorage()) {
      try { window.localStorage.removeItem(STORAGE_PREFIX + oldestKey); } catch { /* ignore */ }
    }
  }
};

export function getCached(id: string): Descriptor | null {
  if (!id) return null;

  const cached = memory.get(id);
  if (cached) {
    touch(id, cached);
    return cached.descriptor;
  }

  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + id);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredEntry;
    if (parsed.v !== SCHEMA_VERSION) {
      window.localStorage.removeItem(STORAGE_PREFIX + id);
      return null;
    }
    if (Date.now() - parsed.timestamp > TTL_MS) {
      window.localStorage.removeItem(STORAGE_PREFIX + id);
      return null;
    }
    const entry: CachedDescriptor = {
      id: parsed.id,
      hash: parsed.hash,
      descriptor: parsed.descriptor,
      timestamp: parsed.timestamp,
    };
    memory.set(id, entry);
    evict();
    return entry.descriptor;
  } catch {
    return null;
  }
}

export function setCached(id: string, descriptor: Descriptor, hash = ""): void {
  if (!id) return;
  const entry: CachedDescriptor = { id, hash, descriptor, timestamp: Date.now() };
  memory.set(id, entry);
  evict();

  if (!hasStorage()) return;
  const stored: StoredEntry = { v: SCHEMA_VERSION, ...entry };
  try {
    window.localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(stored));
  } catch {
    // Quota exceeded or disabled — drop the oldest entry from storage and give up for this write.
    const oldestKey = memory.keys().next().value;
    if (oldestKey !== undefined && oldestKey !== id) {
      memory.delete(oldestKey);
      try { window.localStorage.removeItem(STORAGE_PREFIX + oldestKey); } catch { /* ignore */ }
    }
  }
}

export function hasCached(id: string): boolean {
  if (!id) return false;
  if (memory.has(id)) return true;
  if (!hasStorage()) return false;
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + id) !== null;
  } catch {
    return false;
  }
}

export function clearSkeletonCache(): void {
  memory.clear();
  if (!hasStorage()) return;
  try {
    const keysToRemove: string[] = [];
    const len = window.localStorage.length;
    for (let i = 0; i < len; i++) {
      try {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) keysToRemove.push(key);
      } catch {
        break;
      }
    }
    for (const key of keysToRemove) {
      try { window.localStorage.removeItem(key); } catch { /* ignore */ }
    }
  } catch {
    // ignore — storage may be unavailable entirely
  }
}
