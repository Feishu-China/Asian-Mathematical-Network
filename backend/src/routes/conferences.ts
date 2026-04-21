import { Router } from 'express';
import {
  createConferenceApplicationDraft,
  getConferenceApplicationForm,
  getConferenceDetail,
  getMyConferenceApplication,
  listConferences,
} from '../controllers/conferences';

const router = Router();

router.get('/', listConferences);
router.get('/:id/applications/me', getMyConferenceApplication);
router.post('/:id/applications', createConferenceApplicationDraft);
router.get('/:id/application-form', getConferenceApplicationForm);
router.get('/:slug', getConferenceDetail);

export default router;
