// Path: /apps/api/src/common/storage/local-storage.provider.ts
import { Injectable } from "@nestjs/common";
import { StorageProvider } from "./storage.provider";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  async save(file: Express.Multer.File, folder: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), "uploads", folder);
    fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `${randomUUID()}-${file.originalname}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);
    return filePath;
  }
}
