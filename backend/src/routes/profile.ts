import { Router } from 'express';
import { getMyProfile, updateMyProfile } from '../controllers/profile';

const router = Router();

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

export default router;
