export abstract class StorageProvider {
  abstract save(
    file: Express.Multer.File,
    folder: string
  ): Promise<string>;
}