import { Router } from 'express';
import { getPublicScholarProfile } from '../controllers/profile';

const router = Router();

router.get('/:slug', getPublicScholarProfile);

export default router;
