import { Injectable } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";
import * as sharp from "sharp";

import { StorageProvider } from "./storage.provider";

type CloudinaryResourceType = "image" | "raw" | "video";

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
    folder: string,
  ): Promise<string> {
    const publicId = randomUUID();

    let buffer = file.buffer;

    if (
      file.mimetype?.startsWith(
        "image/",
      )
    ) {
      buffer = await sharp(
        file.buffer,
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
              result,
            ) => {
              if (
                error ||
                !result
              ) {
                reject(
                  error ??
                    new Error(
                      "Cloudinary upload failed",
                    ),
                );
                return;
              }

              resolve(
                result.secure_url,
              );
            },
          );

        stream.end(buffer);
      },
    );
  }

  async remove(
    url: string,
  ): Promise<void> {
    const {
      publicId,
      resourceType,
    } =
      this.getCloudinaryResource(
        url,
      );

    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type:
          resourceType,
        type: "upload",
        invalidate: true,
      },
    );
  }

  private getCloudinaryResource(
    url: string,
  ): {
    publicId: string;
    resourceType: CloudinaryResourceType;
  } {
    const parsedUrl =
      new URL(url);

    const segments =
      parsedUrl.pathname
        .split("/")
        .filter(Boolean);

    const uploadIndex =
      segments.indexOf(
        "upload",
      );

    if (
      uploadIndex < 1
    ) {
      throw new Error(
        "INVALID_CLOUDINARY_URL",
      );
    }

    const resourceType =
      segments[
        uploadIndex - 1
      ] as CloudinaryResourceType;

    if (
      resourceType !==
        "image" &&
      resourceType !==
        "raw" &&
      resourceType !==
        "video"
    ) {
      throw new Error(
        "INVALID_CLOUDINARY_RESOURCE_TYPE",
      );
    }

    const deliverySegments =
      segments.slice(
        uploadIndex + 1,
      );

    if (
      deliverySegments.length ===
      0
    ) {
      throw new Error(
        "INVALID_CLOUDINARY_URL",
      );
    }

    if (
      /^v\d+$/.test(
        deliverySegments[0],
      )
    ) {
      deliverySegments.shift();
    }

    if (
      deliverySegments.length ===
      0
    ) {
      throw new Error(
        "INVALID_CLOUDINARY_URL",
      );
    }

    const lastSegment =
      deliverySegments.pop();

    if (!lastSegment) {
      throw new Error(
        "INVALID_CLOUDINARY_URL",
      );
    }

    const extensionIndex =
      lastSegment.lastIndexOf(
        ".",
      );

    const publicIdLastSegment =
      extensionIndex > 0
        ? lastSegment.slice(
            0,
            extensionIndex,
          )
        : lastSegment;

    deliverySegments.push(
      publicIdLastSegment,
    );

    const publicId =
      deliverySegments.join(
        "/",
      );

    if (!publicId) {
      throw new Error(
        "INVALID_CLOUDINARY_PUBLIC_ID",
      );
    }

    return {
      publicId,
      resourceType,
    };
  }
}