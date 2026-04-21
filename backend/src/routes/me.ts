import { Router } from 'express';
import {
  submitMyConferenceApplication,
  updateMyConferenceApplicationDraft,
} from '../controllers/me';

const router = Router();

router.put('/applications/:id/draft', updateMyConferenceApplicationDraft);
router.post('/applications/:id/submit', submitMyConferenceApplication);

export default router;
