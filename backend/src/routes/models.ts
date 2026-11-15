import { Router } from 'express';
import { getModels, getModelById } from '../controllers/models';

const router = Router();

router.get('/', getModels);
router.get('/:id', getModelById);

export default router;
