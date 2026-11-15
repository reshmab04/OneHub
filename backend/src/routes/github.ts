import { Router } from 'express';
import { getTrending } from '../controllers/github';

const router = Router();

router.get('/trending', getTrending);

export default router;
