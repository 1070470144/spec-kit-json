export interface StoredObjectMeta { path: string; mime: string; size: number; sha256?: string; width?: number; height?: number }
export interface Storage {
  save(buffer: Buffer, keyHint: string, mime: string): Promise<StoredObjectMeta>
  getSignedUrl(path: string, expiresSeconds?: number): Promise<string>
}
