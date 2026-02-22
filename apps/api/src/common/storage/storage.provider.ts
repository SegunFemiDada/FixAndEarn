// Path: /apps/api/src/common/storage/storage.provider.ts
export interface StorageProvider {
  save(file: Express.Multer.File, folder: string): Promise<string>;
}
