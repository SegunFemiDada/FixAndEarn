import { Injectable } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";
import * as sharp from "sharp";

import { StorageProvider } from "./storage.provider";

@Injectable()
export class CloudinaryStorageProvider
  implements StorageProvider
{
  constructor() {
    cloudinary.config({
      cloud_name:
        process.env.CLOUDINARY_CLOUD_NAME,
      api_key:
        process.env.CLOUDINARY_API_KEY,
      api_secret:
        process.env.CLOUDINARY_API_SECRET,
    });
  }

  async save(
    file: Express.Multer.File,
    folder: string
  ): Promise<string> {
    const publicId = randomUUID();

    let buffer = file.buffer;

    if (
      file.mimetype?.startsWith(
        "image/"
      )
    ) {
      buffer = await sharp(
        file.buffer
      )
        .rotate()
        .resize({
          width: 1280,
          height: 1280,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 80,
          mozjpeg: true,
        })
        .toBuffer();
    }

    return new Promise(
      (resolve, reject) => {
        const stream =
          cloudinary.uploader.upload_stream(
            {
              folder: `fixandearn/${folder}`,
              public_id: publicId,
              resource_type: "auto",
            },
            (
              error,
              result
            ) => {
              if (
                error ||
                !result
              ) {
                reject(
                  error ??
                    new Error(
                      "Cloudinary upload failed"
                    )
                );
                return;
              }

              resolve(
                result.secure_url
              );
            }
          );

        stream.end(buffer);
      }
    );
  }
}