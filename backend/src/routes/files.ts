import { Router } from 'express';
import {
  syncFile,
  listCloudFiles,
  downloadCloudFile,
  deleteCloudFile,
  getSyncStatus,
  getSyncHistory,
} from '../controllers/files';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const router = Router();

router.post('/sync', upload.single('file'), syncFile);
router.get('/sync/status', getSyncStatus);
router.get('/sync/history', getSyncHistory);
router.get('/cloud', listCloudFiles);
router.get('/cloud/download', downloadCloudFile);
router.delete('/cloud', deleteCloudFile);

export default router;
