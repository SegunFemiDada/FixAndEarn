import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { stat, readdir } from 'fs/promises';
import { join } from 'path';

@Controller('uploads')
export class UploadsController {
  @Get('*')
  async getFile(@Param('0') filePath: string, @Res() res: Response) {
    // Resolve to the absolute uploads directory (assuming dist is in apps/api/dist)
    const uploadsDir = join(__dirname, '..', 'uploads');
    const safePath = join(uploadsDir, filePath);
    
    // Basic security: ensure the resolved path stays inside uploadsDir
    if (!safePath.startsWith(uploadsDir)) {
      throw new NotFoundException();
    }
    
    try {
      await stat(safePath);
      const stream = createReadStream(safePath);
      stream.pipe(res);
    } catch {
      throw new NotFoundException();
    }
  }

  // 🔍 Temporary debug endpoint – remove after debugging
  @Get('debug/list')
  async listUploads() {
    const uploadsDir = join(__dirname, '..', 'uploads');
    try {
      const files = await readdir(uploadsDir);
      const selfieDir = join(uploadsDir, 'selfie');
      let selfieFiles: string[] = [];
      try {
        selfieFiles = await readdir(selfieDir);
      } catch {
        // selfie directory may not exist
      }
      return { baseDir: uploadsDir, files, selfieFiles };
    } catch (err: any) {
      return { error: err.message, baseDir: uploadsDir };
    }
  }
}