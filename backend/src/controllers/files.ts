import { Request, Response, NextFunction } from 'express';
import { cloudStorageService } from '../services/cloudStorage';
import { AppError } from '../middleware/errorHandler';

const FORBIDDEN_PATTERNS = [/\.\./, /^\//, /[\x00]/];

function validateFilePath(filePath: string): boolean {
  return !FORBIDDEN_PATTERNS.some(pattern => pattern.test(filePath));
}

export async function syncFile(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    const relativePath = req.body.relativePath as string;

    if (!file) {
      throw new AppError(400, 'No file provided');
    }
    if (!relativePath || !validateFilePath(relativePath)) {
      throw new AppError(400, 'Invalid file path');
    }

    const result = await cloudStorageService.uploadFile(
      relativePath,
      file.buffer,
      file.mimetype || 'application/octet-stream'
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listCloudFiles(req: Request, res: Response, next: NextFunction) {
  try {
    const prefix = req.query.prefix as string | undefined;
    if (prefix && !validateFilePath(prefix)) {
      throw new AppError(400, 'Invalid path prefix');
    }
    const files = await cloudStorageService.listFiles(prefix);
    res.json({ success: true, data: files });
  } catch (error) {
    next(error);
  }
}

export async function downloadCloudFile(req: Request, res: Response, next: NextFunction) {
  try {
    const filePath = req.query.path as string;
    if (!filePath || !validateFilePath(filePath)) {
      throw new AppError(400, 'Invalid file path');
    }
    const { buffer, contentType } = await cloudStorageService.downloadFile(filePath);
    res.set('Content-Type', contentType);
    res.set('Content-Disposition', `attachment; filename="${filePath.split('/').pop()}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

export async function deleteCloudFile(req: Request, res: Response, next: NextFunction) {
  try {
    const filePath = req.body.path as string;
    if (!filePath || !validateFilePath(filePath)) {
      throw new AppError(400, 'Invalid file path');
    }
    await cloudStorageService.deleteFile(filePath);
    res.json({ success: true, data: { path: filePath, deleted: true } });
  } catch (error) {
    next(error);
  }
}

export async function getSyncStatus(_req: Request, res: Response, next: NextFunction) {
  try {
    const status = await cloudStorageService.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
}

export async function getSyncHistory(_req: Request, res: Response, next: NextFunction) {
  try {
    const history = cloudStorageService.getHistory();
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}
