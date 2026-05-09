import { File, Directory, Paths } from 'expo-file-system';

export const documentDirectory: string = Paths.document.uri;
export const cacheDirectory: string    = Paths.cache.uri;

export const EncodingType = {
  Base64: 'base64',
  UTF8:   'utf8',
} as const;

export async function readAsStringAsync(
  uri: string,
  options?: { encoding?: string },
): Promise<string> {
  if (options?.encoding === 'base64' || options?.encoding === EncodingType.Base64) {
    const res = await fetch(uri);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  return new File(uri).text();
}

// Handles file:// and content:// sources, any destination filename.
export async function copyAsync(options: { from: string; to: string }): Promise<void> {
  const response = await fetch(options.from);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const dest = new File(options.to);
  dest.parentDirectory.create();
  const writer = dest.writableStream().getWriter();
  await writer.write(bytes);
  await writer.close();
}

export async function makeDirectoryAsync(
  uri: string,
  _options?: { intermediates?: boolean },
): Promise<void> {
  try {
    new Directory(uri).create();
  } catch (e: unknown) {
    if (!String(e).includes('already exists')) throw e;
  }
}
