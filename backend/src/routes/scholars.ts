import { Router } from 'express';
import { getPublicScholarProfile, listPublicScholars } from '../controllers/profile';

const router = Router();

router.get('/', listPublicScholars);
router.get('/:slug', getPublicScholarProfile);

export default router;
