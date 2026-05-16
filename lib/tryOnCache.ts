import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DIR = `${FileSystem.cacheDirectory}tryon/`;
const INDEX_PREFIX = 'tryon_cache:';

function shortHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function cacheKey(modelUri: string, garmentUri: string): string {
  return `${INDEX_PREFIX}${shortHash(modelUri)}_${shortHash(garmentUri)}`;
}

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    try { await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true }); } catch {}
  }
}

export async function getCached(modelUri: string, garmentUri: string): Promise<string | null> {
  try {
    const key = cacheKey(modelUri, garmentUri);
    const path = await AsyncStorage.getItem(key);
    if (!path) return null;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return path;
  } catch { return null; }
}

export async function setCached(modelUri: string, garmentUri: string, sourcePath: string): Promise<string> {
  try {
    await ensureDir();
    const key = cacheKey(modelUri, garmentUri);
    const dest = `${CACHE_DIR}${shortHash(modelUri)}_${shortHash(garmentUri)}.jpg`;
    try { await FileSystem.deleteAsync(dest, { idempotent: true }); } catch {}
    await FileSystem.copyAsync({ from: sourcePath, to: dest });
    await AsyncStorage.setItem(key, dest);
    return dest;
  } catch {
    return sourcePath;
  }
}

export async function invalidateByGarment(garmentUri: string): Promise<void> {
  try {
    const garmentHash = shortHash(garmentUri);
    const keys = await AsyncStorage.getAllKeys();
    const matches = keys.filter(k => k.startsWith(INDEX_PREFIX) && k.endsWith(`_${garmentHash}`));
    await deleteEntries(matches);
  } catch {}
}

export async function invalidateByModel(modelUri: string): Promise<void> {
  try {
    const modelHash = shortHash(modelUri);
    const keys = await AsyncStorage.getAllKeys();
    const matches = keys.filter(k => k.startsWith(`${INDEX_PREFIX}${modelHash}_`));
    await deleteEntries(matches);
  } catch {}
}

export async function invalidateAll(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const matches = keys.filter(k => k.startsWith(INDEX_PREFIX));
    await deleteEntries(matches);
    try { await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true }); } catch {}
  } catch {}
}

async function deleteEntries(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const pairs = await AsyncStorage.multiGet(keys);
  for (const [, path] of pairs) {
    if (path) {
      try { await FileSystem.deleteAsync(path, { idempotent: true }); } catch {}
    }
  }
  await AsyncStorage.multiRemove(keys);
}

export async function cacheStats(): Promise<{ count: number; bytes: number }> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const matches = keys.filter(k => k.startsWith(INDEX_PREFIX));
    let bytes = 0;
    const pairs = await AsyncStorage.multiGet(matches);
    for (const [, path] of pairs) {
      if (!path) continue;
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists && 'size' in info) bytes += (info.size as number) ?? 0;
    }
    return { count: matches.length, bytes };
  } catch { return { count: 0, bytes: 0 }; }
}
