import { Router } from 'express';
import {
  closeConference,
  createConference,
  getOrganizerConference,
  publishConference,
  updateConference,
} from '../controllers/organizer';
import {
  assignReviewer,
  getOrganizerApplicationDetail,
  listOrganizerConferenceApplications,
  listReviewerCandidates,
  releaseDecision,
  upsertDecision,
} from '../controllers/review';

const router = Router();

router.post('/conferences', createConference);
router.get('/conferences/:id', getOrganizerConference);
router.get('/conferences/:id/applications', listOrganizerConferenceApplications);
router.put('/conferences/:id', updateConference);
router.post('/conferences/:id/publish', publishConference);
router.post('/conferences/:id/close', closeConference);
router.get('/applications/:id', getOrganizerApplicationDetail);
router.get('/applications/:id/reviewer-candidates', listReviewerCandidates);
router.post('/applications/:id/assign-reviewer', assignReviewer);
router.post('/applications/:id/decision', upsertDecision);
router.post('/applications/:id/release-decision', releaseDecision);

export default router;
