import { Router } from 'express';
import { getMyProfile } from '../controllers/profile';

const router = Router();

router.get('/me', getMyProfile);

export default router;
