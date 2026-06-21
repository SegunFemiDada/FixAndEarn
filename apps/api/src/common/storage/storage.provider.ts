//path: apps/api/src/common/storage/storage.provider.ts
export abstract class StorageProvider {
  abstract save(
    file: Express.Multer.File,
    folder: string
  ): Promise<string>;
}