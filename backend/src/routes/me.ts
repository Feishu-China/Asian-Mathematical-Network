import { Router } from 'express';
import {
  getMyApplicationDetail,
  listMyApplications,
  submitMyConferenceApplication,
  submitMyPostVisitReport,
  updateMyConferenceApplicationDraft,
} from '../controllers/me';

const router = Router();

router.get('/applications', listMyApplications);
router.get('/applications/:id', getMyApplicationDetail);
router.put('/applications/:id/draft', updateMyConferenceApplicationDraft);
router.post('/applications/:id/submit', submitMyConferenceApplication);
router.post('/applications/:id/post-visit-report', submitMyPostVisitReport);

export default router;
