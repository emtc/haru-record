import { File, Directory, Paths } from 'expo-file-system/next';

const photoDir = new Directory(Paths.document, 'treatment_photos');

/** Copy a picker URI to the app's persistent document directory and return the new URI. */
export function persistPhoto(uri: string): string {
  if (!photoDir.exists) {
    photoDir.create();
  }
  const rawExt = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  const ext = rawExt && rawExt.length <= 4 ? rawExt : 'jpg';
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const src = new File(uri);
  const dest = new File(photoDir, filename);
  src.copy(dest);
  return dest.uri;
}
