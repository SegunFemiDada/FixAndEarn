import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';

@Controller('uploads')
export class UploadsController {
  @Get('*')
  async getFile(@Param('0') filePath: string, @Res() res: Response) {
    // Prevent directory traversal attacks
    const safePath = join(process.cwd(), 'uploads', filePath);
    if (!safePath.startsWith(join(process.cwd(), 'uploads'))) {
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
}