// apps/api/src/common/storage/uploads.controller.ts
import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller('uploads')
export class UploadsController {
  @Get('*')
  async getFile(@Param('0') filePath: string, @Res() res: Response) {
    // Absolute path on Railway: /app/apps/api/uploads
    const uploadsDir = join(process.cwd(), 'apps/api/uploads');
    const safePath = join(uploadsDir, filePath);
    
    try {
      return res.sendFile(safePath);
    } catch {
      throw new NotFoundException();
    }
  }

  // 🔍 Temporary debug endpoint – remove after debugging
  @Get('debug/list')
  async listUploads() {
    const fs = require('fs').promises;
    const baseDir = join(process.cwd(), 'apps/api/uploads');
    try {
      const files = await fs.readdir(baseDir);
      const selfieDir = join(baseDir, 'selfie');
      let selfieFiles: string[] = [];
      try {
        selfieFiles = await fs.readdir(selfieDir);
      } catch {}
      return { baseDir, files, selfieFiles };
    } catch (err: any) {
      return { error: err.message, baseDir };
    }
  }
}