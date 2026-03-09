// Path: /apps/api/src/common/storage/local-storage.provider.ts
import { Injectable } from "@nestjs/common";
import { StorageProvider } from "./storage.provider";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import * as sharp from "sharp";

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  async save(file: Express.Multer.File, folder: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), "uploads", folder);
    fs.mkdirSync(uploadDir, { recursive: true });

    const safeBase = `${randomUUID()}`;

    if (file.mimetype?.startsWith("image/")) {
      const filename = `${safeBase}.jpg`;
      const diskPath = path.join(uploadDir, filename);

      await sharp(file.buffer)
        .rotate()
        .resize({
          width: 1280,
          height: 1280,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(diskPath);

      return `/uploads/${folder}/${filename}`;
    }

    const ext = path.extname(file.originalname || "").toLowerCase() || ".bin";
    const filename = `${safeBase}${ext}`;
    const diskPath = path.join(uploadDir, filename);

    fs.writeFileSync(diskPath, file.buffer);
    return `/uploads/${folder}/${filename}`;
  }
}