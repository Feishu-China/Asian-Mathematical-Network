import { Router } from 'express';
import {
  listMyApplications,
  submitMyConferenceApplication,
  updateMyConferenceApplicationDraft,
} from '../controllers/me';

const router = Router();

router.get('/applications', listMyApplications);
router.put('/applications/:id/draft', updateMyConferenceApplicationDraft);
router.post('/applications/:id/submit', submitMyConferenceApplication);

export default router;
