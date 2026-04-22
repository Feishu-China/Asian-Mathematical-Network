import { Router } from 'express';
import {
  listMyApplications,
  submitMyConferenceApplication,
  updateMyConferenceApplicationDraft,
} from '../controllers/me';
import { getMyApplicationDetail } from '../controllers/review';

const router = Router();

router.get('/applications', listMyApplications);
router.get('/applications/:id', getMyApplicationDetail);
router.put('/applications/:id/draft', updateMyConferenceApplicationDraft);
router.post('/applications/:id/submit', submitMyConferenceApplication);

export default router;
