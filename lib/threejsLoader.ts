import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

let cached: string | null = null;

export async function getThreeBundle(): Promise<string> {
  if (cached) return cached;

  const assets = await Asset.loadAsync([
    require('../assets/js/three.min.jslib'),
    require('../assets/js/GLTFLoader.jslib'),
    require('../assets/js/OrbitControls.jslib'),
  ]);

  const contents = await Promise.all(
    assets.map(a => FileSystem.readAsStringAsync(a.localUri!))
  );

  cached = contents.join('\n');
  return cached;
}
