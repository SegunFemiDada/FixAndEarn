import { Module } from "@nestjs/common";

import { StorageProvider } from "./storage.provider";
import { CloudinaryStorageProvider } from "./cloudinary-storage.provider";

@Module({
  providers: [
    {
      provide: StorageProvider,
      useClass:
        CloudinaryStorageProvider,
    },
    CloudinaryStorageProvider,
  ],
  exports: [
    StorageProvider,
    CloudinaryStorageProvider,
  ],
})
export class StorageModule {}