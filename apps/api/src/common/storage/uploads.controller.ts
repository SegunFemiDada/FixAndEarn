import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

@Controller('uploads')
export class UploadsController {
  @Get('*')
  async getFile(@Param('0') filePath: string, @Res() res: Response) {
    const uploadsDir = join(process.cwd(), 'apps/api/uploads');
    const safePath = join(uploadsDir, filePath);
    
    // Security: prevent directory traversal
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

  // Temporary debug endpoint – remove after confirming
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